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
      // 1. Insertar detalle
      await client.query(
          `INSERT INTO detalles_compra (compra_id, producto_id, cantidad, precio_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
          [compraId, prod.producto_id, prod.cantidad, prod.precio_unitario, prod.subtotal]
      );

      // 2. Lógica de Precios y Stock
      const productoDB = await client.query(
          `SELECT precio, precio_costo FROM productos WHERE id = $1`,
          [prod.producto_id]
      );

      if (productoDB.rows.length > 0) {
        const { precio, precio_costo } = productoDB.rows[0];
        let nuevoPrecioCosto = parseFloat(precio_costo);
        let nuevoPorcentajeGanancia = null;

        const costoActual = parseFloat(precio_costo);
        const costoNuevo = parseFloat(prod.precio_unitario);

        if (costoNuevo > costoActual) {
          nuevoPrecioCosto = costoNuevo;
          nuevoPorcentajeGanancia = ((parseFloat(precio) - nuevoPrecioCosto) / nuevoPrecioCosto) * 100;

          await client.query(
              `INSERT INTO historial_costos (producto_id, compra_id, precio_costo_anterior, precio_costo_nuevo)
               VALUES ($1, $2, $3, $4)`,
              [prod.producto_id, compraId, costoActual, nuevoPrecioCosto]
          );
        }

        await client.query(
            `UPDATE productos
           SET stock = stock + $1,
               precio_costo = $2,
               porcentaje_ganancia = COALESCE($3, porcentaje_ganancia),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $4`,
            [prod.cantidad, nuevoPrecioCosto, nuevoPorcentajeGanancia, prod.producto_id]
        );

        await client.query(
            `INSERT INTO stock_deposito_detalle (producto_id, compra_id, cantidad_actual, fecha_ingreso)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
            [prod.producto_id, compraId, prod.cantidad]
        );
      }

      // 3. Lógica INTELIGENTE: Consumo de Futuros Pedidos
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

// 📌 Obtener compra por ID
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

// 📌 Eliminar una compra y revertir stock/costo (CON RESTAURACIÓN DE FUTUROS PEDIDOS)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Obtener detalles de la compra a eliminar
    const detallesResult = await client.query(
        `SELECT producto_id, cantidad, precio_unitario
       FROM detalles_compra
       WHERE compra_id = $1`,
        [id]
    );

    if (detallesResult.rows.length === 0) {
      const compraCheck = await client.query(`SELECT 1 FROM compras WHERE id = $1`, [id]);
      if (compraCheck.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Compra no encontrada" });
      }
    }

    // 2. Procesar reversión por producto
    for (const detalle of detallesResult.rows) {
      const { producto_id, cantidad } = detalle;

      // A. Revertir Historial de Costos
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
        const costoAnterior = historialResult.rows[0].precio_costo_anterior;
        nuevoCostoParaProducto = costoAnterior;
        costoRevertido = true;
        await client.query(
            `DELETE FROM historial_costos
           WHERE compra_id = $1 AND producto_id = $2`,
            [id, producto_id]
        );
      }

      // Obtenemos datos del producto (Nombre necesario para restaurar futuro pedido si no existe)
      const currentProd = await client.query(
          `SELECT nombre, precio, precio_costo FROM productos WHERE id = $1`,
          [producto_id]
      );

      const prodNombre = currentProd.rows[0]?.nombre || 'Producto Restaurado'; // Fallback por seguridad

      if (currentProd.rows.length > 0) {
        const { precio: precioVenta, precio_costo: costoActualDB } = currentProd.rows[0];

        if (!costoRevertido) {
          nuevoCostoParaProducto = costoActualDB;
        }
        ganancia = ((parseFloat(precioVenta) - parseFloat(nuevoCostoParaProducto)) / parseFloat(nuevoCostoParaProducto)) * 100;
      }

      // B. Revertir Stock y Costo en Productos
      await client.query(
          `UPDATE productos
         SET stock = stock - $1,
             precio_costo = $2,
             porcentaje_ganancia = COALESCE($3, porcentaje_ganancia),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
          [cantidad, nuevoCostoParaProducto, ganancia, producto_id]
      );

      // =============================================================================
      // 🧠 LÓGICA INVERSA: RESTAURAR FUTUROS PEDIDOS
      // =============================================================================
      // Buscamos si ya existe en la lista de pendientes
      const futuroCheck = await client.query(
          `SELECT id, cantidad FROM futuros_pedidos WHERE producto_id = $1`,
          [producto_id]
      );

      if (futuroCheck.rows.length > 0) {
        // ESCENARIO 1: Ya estaba en la lista (ej: compra parcial o re-agregado). SUMAMOS la cantidad devuelta.
        const cantActual = parseFloat(futuroCheck.rows[0].cantidad) || 0;
        const cantRestaurada = cantActual + parseFloat(cantidad);

        await client.query(
            `UPDATE futuros_pedidos SET cantidad = $1 WHERE id = $2`,
            [cantRestaurada, futuroCheck.rows[0].id]
        );
      } else {
        // ESCENARIO 2: No estaba en la lista (se había borrado al comprar). LO VOLVEMOS A CREAR.
        await client.query(
            `INSERT INTO futuros_pedidos (producto_id, producto, cantidad, creado_en)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
            [producto_id, prodNombre, cantidad]
        );
      }
      // =============================================================================

    }

    // 3. Eliminar registros de la compra
    await client.query(`DELETE FROM stock_deposito_detalle WHERE compra_id = $1`, [id]);
    await client.query(`DELETE FROM detalles_compra WHERE compra_id = $1`, [id]);
    const compraResult = await client.query(`DELETE FROM compras WHERE id = $1 RETURNING *`, [id]);

    if (compraResult.rows.length === 0) {
      throw new Error("Compra no encontrada después de revertir.");
    }

    await client.query("COMMIT");
    res.json({ message: "Compra eliminada, stock revertido y pedidos futuros restaurados." });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al eliminar compra y revertir:", error);
    res.status(500).json({ error: "Error al eliminar compra y revertir" });
  } finally {
    client.release();
  }
});

export default router;