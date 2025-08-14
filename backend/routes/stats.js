import express from 'express'
import pool from '../db.js' // Asegúrate que este es tu archivo de conexión a la base de datos

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    // Totales de ventas
    const totalVentasMonto = await pool.query(`
      SELECT COALESCE(SUM(total), 0) AS total
      FROM ventas
    `)

    // Totales de compras
    const totalComprasMonto = await pool.query(`
      SELECT COALESCE(SUM(total), 0) AS total
      FROM compras
    `)

    // Total de deudas (ventas pendientes)
    const totalDeudasMonto = await pool.query(`
      SELECT COALESCE(SUM(total), 0) AS total
      FROM ventas
      WHERE estado = 'adeuda'
    `)

    // Contar total de productos
    const totalProductos = await pool.query(`
      SELECT COUNT(*) AS total
      FROM productos
    `)

    // Contar total de clientes
    const totalClientes = await pool.query(`
      SELECT COUNT(*) AS total
      FROM clientes
    `)

    // Contar total de ventas
    const totalVentas = await pool.query(`
      SELECT COUNT(*) AS total
      FROM ventas
    `)

    // Contar total de compras
    const totalCompras = await pool.query(`
      SELECT COUNT(*) AS total
      FROM compras
    `)

    res.json({
      total_ventas_monto: Number(totalVentasMonto.rows[0].total),
      total_compras_monto: Number(totalComprasMonto.rows[0].total),
      total_deudas_monto: Number(totalDeudasMonto.rows[0].total),
      total_productos: Number(totalProductos.rows[0].total),
      total_clientes: Number(totalClientes.rows[0].total),
      total_ventas: Number(totalVentas.rows[0].total),
      total_compras: Number(totalCompras.rows[0].total)
    })
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error)
    res.status(500).json({ error: 'Error al obtener estadísticas' })
  }
})

export default router
