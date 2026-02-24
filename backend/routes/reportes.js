// backend/routes/reportes.js
import express from 'express'
import pool from '../db.js'

const router = express.Router()

router.get('/diarios', async (req, res) => {
  const { desde, hasta } = req.query

  try {
    const result = await pool.query(
      `SELECT
        fecha,
        total_ventas,
        total_compras,
        cantidad_ventas,
        cantidad_compras,
        utilidad_neta
       FROM reportes_diarios
       WHERE fecha BETWEEN $1 AND $2
       ORDER BY fecha DESC`,
      [desde, hasta]
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Error obteniendo reportes diarios:', error)
    res.status(500).json({ error: 'Error al obtener reportes' })
  }
})

router.get("/productos-vendidos", async (req, res) => {
  const { desde, hasta } = req.query;
  try {
    const result = await pool.query(
      `SELECT
        p.nombre,
        c.nombre as categoria,
        SUM(dv.cantidad) as cantidad_total
       FROM detalles_venta dv
       JOIN ventas v ON dv.venta_id = v.id
       JOIN productos p ON dv.producto_id = p.id
       LEFT JOIN categorias c ON p.categoria_id = c.id
       WHERE v.fecha BETWEEN $1 AND $2
       GROUP BY p.id, p.nombre, c.nombre
       ORDER BY c.nombre ASC, cantidad_total DESC`,
      [desde, hasta]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener ranking" });
  }
});

export default router