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
  const { desde, hasta } = req.query;

  try {
    const result = await pool.query(
      `SELECT
        p.nombre,
        p.codigo,
        SUM(dv.cantidad) as cantidad_total,
        SUM(dv.subtotal) as monto_total
       FROM detalles_venta dv
       JOIN ventas v ON dv.venta_id = v.id
       JOIN productos p ON dv.producto_id = p.id
       WHERE v.fecha BETWEEN $1 AND $2
       GROUP BY p.id, p.nombre, p.codigo
       ORDER BY cantidad_total DESC`,
      [desde, hasta]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener ranking de productos:", error);
    res.status(500).json({ error: "Error al obtener ranking" });
  }
});

export default router