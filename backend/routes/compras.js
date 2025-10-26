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
      await client.query(
          `INSERT INTO detalles_compra (compra_id, producto_id, cantidad, precio_unitario, subtotal) 
         VALUES ($1, $2, $3, $4, $5)`,
          [compraId, prod.producto_id, prod.cantidad, prod.precio_unitario, prod.subtotal]
      );

      // Ver precio actual
      const productoDB = await client.query(
          `SELECT precio, precio_costo FROM productos WHERE id = $1`,
          [prod.producto_id]
      );

      if (productoDB.rows.length > 0) {
        const { precio, precio_costo } = productoDB.rows[0];
        let nuevoPrecioCosto = parseFloat(precio_costo); // Mantenemos el costo actual por defecto
        let nuevoPorcentajeGanancia = null;

        // Convertimos a números para la comparación
        const costoActual = parseFloat(precio_costo);
        const costoNuevo = parseFloat(prod.precio_unitario);

        // La condición para actualizar es: SOLO si el nuevo costo es SUPERIOR al actual.
        if (costoNuevo > costoActual) {
          nuevoPrecioCosto = costoNuevo; // Establecemos el nuevo costo

          // Recalculamos la ganancia con el nuevo precio de costo
          nuevoPorcentajeGanancia =
              ((parseFloat(precio) - nuevoPrecioCosto) / nuevoPrecioCosto) * 100;

          // INSERTAR EN HISTORIAL DE COSTOS (NUEVO)
          await client.query(
              `INSERT INTO historial_costos (producto_id, compra_id, precio_costo_anterior, precio_costo_nuevo)
               VALUES ($1, $2, $3, $4)`,
              [prod.producto_id, compraId, costoActual, nuevoPrecioCosto]
          );
        }

        // El stock SIEMPRE se actualiza, pero el precio_costo y porcentaje_ganancia solo si se cumplió la condición.
        await client.query(
            `UPDATE productos 
           SET stock = stock + $1,
               precio_costo = $2,
               porcentaje_ganancia = COALESCE($3, porcentaje_ganancia),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $4`,
            [prod.cantidad, nuevoPrecioCosto, nuevoPorcentajeGanancia, prod.producto_id]
        );
        // 2. Insertar el nuevo lote en stock_deposito_detalle (Todo el stock nuevo entra al depósito)
        await client.query(
            `INSERT INTO stock_deposito_detalle (producto_id, compra_id, cantidad_actual, fecha_ingreso)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
            [prod.producto_id, compraId, prod.cantidad] // prod.cantidad es la cantidad comprada
        );

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

// 📌 Obtener compra por ID (con detalles)
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

// 📌 Eliminar una compra y revertir stock/costo (NUEVO)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Obtener detalles de la compra
    const detallesResult = await client.query(
        `SELECT producto_id, cantidad, precio_unitario 
       FROM detalles_compra 
       WHERE compra_id = $1`,
        [id]
    );

    if (detallesResult.rows.length === 0) {
      // Revertir solo si la compra existe, pero puede que no tenga detalles
      const compraCheck = await client.query(`SELECT 1 FROM compras WHERE id = $1`, [id]);
      if (compraCheck.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Compra no encontrada" });
      }
      // Si la encontró, pero sin detalles, seguimos al paso 3 para eliminarla
    }

    // 2. Revertir stock y costo para cada producto
    for (const detalle of detallesResult.rows) {
      const { producto_id, cantidad } = detalle;

      // ************** REVERTIR COSTO (si aplica) **************
      // Verificar si esta compra CAUSÓ un cambio de costo
      const historialResult = await client.query(
          `SELECT precio_costo_anterior 
         FROM historial_costos 
         WHERE compra_id = $1 AND producto_id = $2`,
          [id, producto_id]
      );

      let nuevoCostoParaProducto = null;
      let ganancia = null;
      let costoRevertido = false;

      // Si la compra modificó el costo, revertimos al costo anterior
      if (historialResult.rows.length > 0) {
        const costoAnterior = historialResult.rows[0].precio_costo_anterior;
        nuevoCostoParaProducto = costoAnterior;
        costoRevertido = true;

        // **IMPORTANTE**: Eliminamos el registro del historial
        await client.query(
            `DELETE FROM historial_costos 
           WHERE compra_id = $1 AND producto_id = $2`,
            [id, producto_id]
        );
      }

      // Obtenemos el precio de venta para recalcular la ganancia o para mantener el costo actual
      const currentProd = await client.query(
          `SELECT precio, precio_costo FROM productos WHERE id = $1`,
          [producto_id]
      );

      if (currentProd.rows.length > 0) {
        const { precio: precioVenta, precio_costo: costoActualDB } = currentProd.rows[0];

        if (!costoRevertido) {
          // Si el costo NO cambió, mantenemos el costo actual de la BD
          nuevoCostoParaProducto = costoActualDB;
        }

        // Recalculamos la ganancia con el costo que vamos a aplicar
        ganancia = ((parseFloat(precioVenta) - parseFloat(nuevoCostoParaProducto)) / parseFloat(nuevoCostoParaProducto)) * 100;
      }


      // ************** REVERTIR STOCK Y ACTUALIZAR COSTO **************
      await client.query(
          `UPDATE productos 
         SET stock = stock - $1,
             precio_costo = $2,
             porcentaje_ganancia = COALESCE($3, porcentaje_ganancia),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
          [cantidad, nuevoCostoParaProducto, ganancia, producto_id]
      );
    }

    // 3. Eliminar la compra y sus detalles
    // (Asumiendo que detalles_compra se borra en cascada o lo borramos explícitamente)
    await client.query(`DELETE FROM detalles_compra WHERE compra_id = $1`, [id]);
    const compraResult = await client.query(`DELETE FROM compras WHERE id = $1 RETURNING *`, [id]);

    if (compraResult.rows.length === 0) {
      throw new Error("Compra no encontrada después de revertir.");
    }

    await client.query("COMMIT");
    res.json({ message: "Compra eliminada y stock/costo revertido con éxito" });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al eliminar compra y revertir:", error);
    res.status(500).json({ error: "Error al eliminar compra y revertir" });
  } finally {
    client.release();
  }
});

export default router;