// backend/routes/bolsasAbiertas.js
import express from 'express';
import pool from '../db.js';

const router = express.Router();

// 📌 Obtener todas las bolsas abiertas
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ba.id, ba.producto_id, p.nombre AS producto_nombre, ba.fecha_apertura, ba.estado
      FROM bolsas_abiertas ba
      LEFT JOIN productos p ON p.id = ba.producto_id
      ORDER BY ba.fecha_apertura DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener bolsas abiertas:', error);
    res.status(500).json({ error: 'Error al obtener bolsas abiertas' });
  }
});

// 📌 Abrir una nueva bolsa
router.post('/', async (req, res) => {
  const { producto_id } = req.body;
  if (!producto_id) {
    return res.status(400).json({ error: 'El producto_id es obligatorio' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO bolsas_abiertas (producto_id) VALUES ($1) RETURNING *`,
      [producto_id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al abrir bolsa:', error);
    res.status(500).json({ error: 'Error al abrir bolsa' });
  }
});

// 📌 Cerrar una bolsa abierta
router.put('/:id/cerrar', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE bolsas_abiertas SET estado = 'cerrada' WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bolsa no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al cerrar bolsa:', error);
    res.status(500).json({ error: 'Error al cerrar bolsa' });
  }
});

// 📌 Eliminar una bolsa abierta
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`DELETE FROM bolsas_abiertas WHERE id = $1 RETURNING *`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bolsa no encontrada' });
    }
    res.json({ message: 'Bolsa eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar bolsa:', error);
    res.status(500).json({ error: 'Error al eliminar bolsa' });
  }
});

export default router;
