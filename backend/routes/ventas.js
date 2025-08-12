// backend/routes/ventas.js
import express from "express";
import pool from "../db.js";

const router = express.Router();

// 📌 Obtener todas las ventas
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT v.*, c.nombre AS cliente_nombre
       FROM ventas v
       LEFT JOIN clientes c ON v.cliente_id = c.id
       ORDER BY v.fecha DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al obtener ventas:", error);
    res.status(500).json({ error: "Error al obtener ventas" });
  }
});

// 📌 Obtener venta por ID (con detalles)
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const ventaResult = await pool.query(
      `SELECT v.*, c.nombre AS cliente_nombre
       FROM ventas v
       LEFT JOIN clientes c ON v.cliente_id = c.id
       WHERE v.id = $1`,
      [id]
    );

    if (ventaResult.rows.length === 0) {
      return res.status(404).json({ error: "Venta no encontrada" });
    }

    const detallesResult = await pool.query(
      `SELECT dv.*, p.nombre AS producto_nombre
       FROM detalles_venta dv
       JOIN productos p ON dv.producto_id = p.id
       WHERE dv.venta_id = $1`,
      [id]
    );

    res.json({
      ...ventaResult.rows[0],
      detalles: detallesResult.rows
    });
  } catch (error) {
    console.error("❌ Error al obtener venta:", error);
    res.status(500).json({ error: "Error al obtener venta" });
  }
});

// 📌 Crear nueva venta (con o sin productos)
router.post("/", async (req, res) => {
  const { cliente_id, productos, total, estado, metodo_pago } = req.body;

  // Si no hay productos y no hay total, error
  if ((!productos || productos.length === 0) && (!total || isNaN(parseFloat(total)))) {
    return res.status(400).json({ error: "Debe enviar productos o un importe total válido" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Si no hay productos, es una venta rápida
    if (!productos || productos.length === 0) {
      const ventaRapida = await client.query(
        `INSERT INTO ventas (cliente_id, total, estado, metodo_pago) 
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [cliente_id || null, parseFloat(total), estado || "pagada", metodo_pago || "efectivo"]
      );

      await client.query("COMMIT");
      return res.status(201).json({
        message: "Venta rápida registrada con éxito",
        venta: ventaRapida.rows[0]
      });
    }

    // Si hay productos, procesar venta normal
    const ventaResult = await client.query(
      `INSERT INTO ventas (cliente_id, total, estado, metodo_pago) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [
        cliente_id || null,
        parseFloat(total),
        estado || "pagada",
        metodo_pago || "efectivo"
      ]
    );

    const ventaId = ventaResult.rows[0].id;

    for (const prod of productos) {
      const productoId = prod.producto_id || prod.id;
      const precioUnitario = parseFloat(prod.precio_unitario);
      const subtotal = parseFloat(prod.subtotal);

      await client.query(
        `INSERT INTO detalles_venta (venta_id, producto_id, cantidad, precio_unitario, subtotal) 
         VALUES ($1, $2, $3, $4, $5)`,
        [ventaId, productoId, prod.cantidad, precioUnitario, subtotal]
      );

      await client.query(
        `UPDATE productos 
         SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2`,
        [prod.cantidad, productoId]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Venta registrada con éxito",
      venta: ventaResult.rows[0]
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error al registrar venta:", error);
    res.status(500).json({ error: "Error al procesar venta", detalle: error.message });
  } finally {
    client.release();
  }
});

export default router;

