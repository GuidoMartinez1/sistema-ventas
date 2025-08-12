// backend/routes/ventas.js
import express from "express";
import pool from "../db.js";

const router = express.Router();

// Obtener todas las ventas
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT v.id, v.cliente_id, c.nombre AS cliente_nombre, v.total, v.fecha, v.estado, v.metodo_pago
       FROM ventas v
       LEFT JOIN clientes c ON v.cliente_id = c.id
       ORDER BY v.fecha DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener ventas:", error);
    res.status(500).json({ error: "Error al obtener ventas" });
  }
});

// Obtener venta por ID con detalles
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const ventaResult = await pool.query(
      `SELECT v.id, v.cliente_id, c.nombre AS cliente_nombre, v.total, v.fecha, v.estado, v.metodo_pago
       FROM ventas v
       LEFT JOIN clientes c ON v.cliente_id = c.id
       WHERE v.id = $1`,
      [id]
    );

    if (ventaResult.rows.length === 0) {
      return res.status(404).json({ error: "Venta no encontrada" });
    }

    const detallesResult = await pool.query(
      `SELECT dv.id, dv.producto_id, p.nombre AS producto_nombre, dv.cantidad, dv.precio_unitario, dv.subtotal
       FROM detalle_ventas dv
       LEFT JOIN productos p ON dv.producto_id = p.id
       WHERE dv.venta_id = $1`,
      [id]
    );

    res.json({
      ...ventaResult.rows[0],
      detalles: detallesResult.rows
    });
  } catch (error) {
    console.error("Error al obtener venta:", error);
    res.status(500).json({ error: "Error al obtener venta" });
  }
});

// Crear nueva venta
router.post("/", async (req, res) => {
  const { cliente_id, productos, total, estado, metodo_pago } = req.body;

  if (!productos || productos.length === 0) {
    return res.status(400).json({ error: "No hay productos en la venta" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const ventaResult = await client.query(
      `INSERT INTO ventas (cliente_id, total, estado, metodo_pago)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [cliente_id || null, total, estado || "pagada", metodo_pago || "efectivo"]
    );

    const ventaId = ventaResult.rows[0].id;

    for (const producto of productos) {
      await client.query(
        `INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          ventaId,
          producto.producto_id,
          producto.cantidad,
          producto.precio_unitario,
          producto.subtotal
        ]
      );

      await client.query(
        `UPDATE productos SET stock = stock - $1 WHERE id = $2`,
        [producto.cantidad, producto.producto_id]
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ message: "Venta creada exitosamente", ventaId });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al procesar venta:", error);
    res.status(500).json({ error: "Error al procesar venta" });
  } finally {
    client.release();
  }
});

export default router;

