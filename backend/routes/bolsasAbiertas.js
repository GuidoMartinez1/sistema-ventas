// routes/bolsasAbiertas.js
import express from "express";
import pool from "../db.js";

const router = express.Router();

// Obtener todas las bolsas abiertas
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ba.id, 
             ba.producto_id, 
             p.nombre AS producto_nombre, 
             ba.fecha_apertura, 
             ba.estado
      FROM bolsas_abiertas ba
      LEFT JOIN productos p ON ba.producto_id = p.id
      ORDER BY ba.fecha_apertura DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener bolsas abiertas:", error);
    res.status(500).json({ error: "Error al obtener bolsas abiertas" });
  }
});

// Crear una nueva bolsa abierta
router.post("/", async (req, res) => {
  try {
    const { producto_id, estado } = req.body;

    const result = await pool.query(
      `INSERT INTO bolsas_abiertas (producto_id, estado) 
       VALUES ($1, $2) 
       RETURNING *`,
      [producto_id, estado || "abierta"]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear bolsa abierta:", error);
    res.status(500).json({ error: "Error al crear bolsa abierta" });
  }
});

// Actualizar bolsa abierta
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { producto_id, estado } = req.body;

    const result = await pool.query(
      `UPDATE bolsas_abiertas 
       SET producto_id = $1, estado = $2 
       WHERE id = $3 
       RETURNING *`,
      [producto_id, estado, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Bolsa abierta no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar bolsa abierta:", error);
    res.status(500).json({ error: "Error al actualizar bolsa abierta" });
  }
});

// Eliminar bolsa abierta
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM bolsas_abiertas WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Bolsa abierta no encontrada" });
    }

    res.json({ message: "Bolsa abierta eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar bolsa abierta:", error);
    res.status(500).json({ error: "Error al eliminar bolsa abierta" });
  }
});

export default router;
