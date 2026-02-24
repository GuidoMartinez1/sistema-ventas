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

export default router