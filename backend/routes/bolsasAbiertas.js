// backend/routes/bolsas_abiertas.js
import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Listar bolsas abiertas
router.get('/', async (req, res) => {
  try {
    // Primero, obtenemos la cuenta de bolsas abiertas por producto
    const countResult = await pool.query(`
      SELECT producto_id, COUNT(id) as count
      FROM bolsas_abiertas
      WHERE estado = 'abierta'
      GROUP BY producto_id
    `);

    // Mapeamos el resultado a un objeto de fácil acceso: { producto_id: count }
    const counts = countResult.rows.reduce((acc, row) => {
      acc[row.producto_id] = parseInt(row.count, 10);
      return acc;
    }, {});

    // Luego, obtenemos el listado de bolsas completo
    const result = await pool.query(`
      SELECT b.*, p.nombre AS producto_nombre, p.stock AS stock_actual
      FROM bolsas_abiertas b
      LEFT JOIN productos p ON b.producto_id = p.id
      WHERE b.estado = 'abierta'
      ORDER BY b.producto_id, b.fecha_apertura ASC 
      -- 👆 Ordenamos por producto y luego por fecha ASC (la más antigua primero)
    `);

    // Combinamos la información: agregamos el campo 'is_duplicate' a cada bolsa
    const bolsasConConteo = result.rows.map(bolsa => ({
      ...bolsa,
      is_duplicate: counts[bolsa.producto_id] > 1,
      total_open_bags: counts[bolsa.producto_id]
    }));

    // Devolvemos el array enriquecido
    res.json(bolsasConConteo);
  } catch (error) {
    console.error('Error al obtener bolsas abiertas:', error);
    res.status(500).json({ error: 'Error al obtener bolsas abiertas' });
  }
});

// Eliminar bolsa abierta (No cambia)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM bolsas_abiertas WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bolsa no encontrada' });
    }
    res.json({ message: 'Bolsa cerrada/eliminada' });
  } catch (error) {
    console.error('Error al eliminar bolsa:', error);
    res.status(500).json({ error: 'Error al eliminar bolsa' });
  }
});

export default router;