// backend/routes/compras.js
import express from "express";
import pool from "../db.js";

const router = express.Router();

// 📌 Obtener todas las compras
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
        `SELECT c.*, p.nombre AS proveedor_nombre
       FROM compras c
       LEFT JOIN proveedores p ON c.proveedor_id = p.id
       ORDER BY c.fecha DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener compras:", error);
    res.status(500).json({ error: "Error al obtener compras" });
  }
});

// 📌 Crear una nueva compra
router.post("/", async (req, res) => {
  const { proveedor_id, productos, total } = req.body;

  if (!proveedor_id || !productos || productos.length === 0 || !total) {
    return res.status(400).json({ error: "Datos incompletos" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Insertar compra
    const compraResult = await client.query(
        `INSERT INTO compras (proveedor_id, total) 
       VALUES ($1, $2) 
       RETURNING *`,
        [proveedor_id, total]
    );

    const compraId = compraResult.rows[0].id;

    // Insertar detalles y actualizar stock / precio_costo / ganancia
    for (const prod of productos) {
      // 1. Insertar detalle de la compra
      await client.query(
          `INSERT INTO detalles_compra (compra_id, producto_id, cantidad, precio_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
          [compraId, prod.producto_id, prod.cantidad, prod.precio_unitario, prod.subtotal]
      );

      // 2. Lógica de Precios, Historial y Stock
      const productoDB = await client.query(
          `SELECT precio, precio_costo FROM productos WHERE id = $1`,
          [prod.producto_id]
      );

      if (productoDB.rows.length > 0) {
        const { precio, precio_costo } = productoDB.rows[0];
        const costoActual = parseFloat(precio_costo) || 0;
        const costoNuevo = parseFloat(prod.precio_unitario) || 0;
        const precioVentaActual = parseFloat(precio) || 0;

        // Variables para decidir qué se actualiza en la tabla productos
        let precioCostoParaUpdate = costoActual;
        let nuevoPorcentajeGanancia = null;

        // ✅ REGISTRO EN HISTORIAL: Se hace SIEMPRE para tener trazabilidad comercial
        await client.query(
            `INSERT INTO historial_costos (producto_id, compra_id, precio_costo_anterior, precio_costo_nuevo, cantidad)
             VALUES ($1, $2, $3, $4, $5)`,
            [prod.producto_id, compraId, costoActual, costoNuevo, prod.cantidad]
        );

        // ✅ REGLA DE NEGOCIO: Solo actualizamos el costo maestro si el nuevo es mayor
        if (costoNuevo > costoActual) {
          precioCostoParaUpdate = costoNuevo;
          nuevoPorcentajeGanancia = ((precioVentaActual - precioCostoParaUpdate) / precioCostoParaUpdate) * 100;
        }

        // Actualizar el producto (Stock siempre suma, costo y ganancia dependen de la comparación anterior)
        await client.query(
            `UPDATE productos
           SET stock = stock + $1,
               precio_costo = $2,
               porcentaje_ganancia = COALESCE($3, porcentaje_ganancia),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $4`,
            [prod.cantidad, precioCostoParaUpdate, nuevoPorcentajeGanancia, prod.producto_id]
        );

        // Registro para el sistema de depósito
        await client.query(
            `INSERT INTO stock_deposito_detalle (producto_id, compra_id, cantidad_actual, fecha_ingreso)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
            [prod.producto_id, compraId, prod.cantidad]
        );
      }

      // 3. Lógica de Futuros Pedidos (Consumo inteligente)
      const futuroPedido = await client.query(
          `SELECT id, cantidad FROM futuros_pedidos WHERE producto_id = $1`,
          [prod.producto_id]
      );

      if (futuroPedido.rows.length > 0) {
        const pedido = futuroPedido.rows[0];
        const cantidadPendiente = parseFloat(pedido.cantidad) || 0;
        const cantidadComprada = parseFloat(prod.cantidad) || 0;
        const remanente = cantidadPendiente - cantidadComprada;

        if (remanente <= 0) {
          await client.query(`DELETE FROM futuros_pedidos WHERE id = $1`, [pedido.id]);
        } else {
          await client.query(`UPDATE futuros_pedidos SET cantidad = $1 WHERE id = $2`, [remanente, pedido.id]);
        }
      }
    }

    await client.query("COMMIT");
    res.status(201).json({ message: "Compra registrada con éxito", compra: compraResult.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al registrar compra:", error);
    res.status(500).json({ error: "Error al registrar compra" });
  } finally {
    client.release();
  }
});

// 📌 Obtener compra por ID con sus detalles
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const compraResult = await pool.query(
        `SELECT c.*, p.nombre AS proveedor_nombre
       FROM compras c
       LEFT JOIN proveedores p ON c.proveedor_id = p.id
       WHERE c.id = $1`,
        [id]
    );

    if (compraResult.rows.length === 0) {
      return res.status(404).json({ error: "Compra no encontrada" });
    }

    const detallesResult = await pool.query(
        `SELECT dc.*, pr.nombre AS producto_nombre
       FROM detalles_compra dc
       LEFT JOIN productos pr ON dc.producto_id = pr.id
       WHERE dc.compra_id = $1`,
        [id]
    );

    res.json({
      ...compraResult.rows[0],
      detalles: detallesResult.rows,
    });
  } catch (error) {
    console.error("Error al obtener compra:", error);
    res.status(500).json({ error: "Error al obtener compra" });
  }
});

// 📌 Eliminar compra y revertir stock/costo/pedidos futuros
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const detallesResult = await client.query(
        `SELECT producto_id, cantidad, precio_unitario
       FROM detalles_compra
       WHERE compra_id = $1`,
        [id]
    );

    for (const detalle of detallesResult.rows) {
      const { producto_id, cantidad } = detalle;

      // Revertir Historial de Costos
      const historialResult = await client.query(
          `SELECT precio_costo_anterior
         FROM historial_costos
         WHERE compra_id = $1 AND producto_id = $2`,
          [id, producto_id]
      );

      let nuevoCostoParaProducto = null;
      let ganancia = null;
      let costoRevertido = false;

      if (historialResult.rows.length > 0) {
        nuevoCostoParaProducto = historialResult.rows[0].precio_costo_anterior;
        costoRevertido = true;
        await client.query(
            `DELETE FROM historial_costos WHERE compra_id = $1 AND producto_id = $2`,
            [id, producto_id]
        );
      }

      const currentProd = await client.query(
          `SELECT nombre, precio, precio_costo FROM productos WHERE id = $1`,
          [producto_id]
      );

      if (currentProd.rows.length > 0) {
        const { precio: precioVenta, precio_costo: costoActualDB } = currentProd.rows[0];
        if (!costoRevertido) nuevoCostoParaProducto = costoActualDB;
        ganancia = ((parseFloat(precioVenta) - parseFloat(nuevoCostoParaProducto)) / parseFloat(nuevoCostoParaProducto)) * 100;
      }

      await client.query(
          `UPDATE productos
         SET stock = stock - $1,
             precio_costo = $2,
             porcentaje_ganancia = COALESCE($3, porcentaje_ganancia),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
          [cantidad, nuevoCostoParaProducto, ganancia, producto_id]
      );

      // Restaurar Futuros Pedidos
      const futuroCheck = await client.query(
          `SELECT id, cantidad FROM futuros_pedidos WHERE producto_id = $1`,
          [producto_id]
      );

      if (futuroCheck.rows.length > 0) {
        const cantRestaurada = (parseFloat(futuroCheck.rows[0].cantidad) || 0) + parseFloat(cantidad);
        await client.query(`UPDATE futuros_pedidos SET cantidad = $1 WHERE id = $2`, [cantRestaurada, futuroCheck.rows[0].id]);
      } else {
        const prodNombre = currentProd.rows[0]?.nombre || 'Producto Restaurado';
        await client.query(
            `INSERT INTO futuros_pedidos (producto_id, producto, cantidad, creado_en)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
            [producto_id, prodNombre, cantidad]
        );
      }
    }

    await client.query(`DELETE FROM stock_deposito_detalle WHERE compra_id = $1`, [id]);
    await client.query(`DELETE FROM detalles_compra WHERE compra_id = $1`, [id]);
    await client.query(`DELETE FROM compras WHERE id = $1`, [id]);

    await client.query("COMMIT");
    res.json({ message: "Compra eliminada y datos revertidos correctamente." });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al eliminar compra:", error);
    res.status(500).json({ error: "Error al eliminar compra" });
  } finally {
    client.release();
  }
});

export default router;