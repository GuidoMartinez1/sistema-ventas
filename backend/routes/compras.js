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

    // Insertar detalles y actualizar stock
    for (const prod of productos) {
      await client.query(
        `INSERT INTO detalles_compra (compra_id, producto_id, cantidad, precio_unitario, subtotal) 
         VALUES ($1, $2, $3, $4, $5)`,
        [compraId, prod.producto_id, prod.cantidad, prod.precio_unitario, prod.subtotal]
      );

      // Actualizar stock del producto
      await client.query(
        `UPDATE productos 
         SET stock = stock + $1, 
             precio_costo = $2, 
             updated_at = CURRENT_TIMESTAMP 
         WHERE id = $3`,
        [prod.cantidad, prod.precio_unitario, prod.producto_id]
      );
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

export default router;
