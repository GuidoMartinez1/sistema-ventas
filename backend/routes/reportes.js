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

// backend/routes/reportes.js
router.get("/productos-vendidos", async (req, res) => {
  const { desde, hasta } = req.query; // Netlify/Frontend envía esto
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
       WHERE v.fecha >= $1 AND v.fecha <= $2  -- FILTRO CRÍTICO
       GROUP BY p.id, p.nombre, c.nombre
       ORDER BY cantidad_total DESC`,
      [desde, hasta]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en el ranking" });
  }
});

export default router