import express from 'express'
import pool from '../db.js'

const router = express.Router()

// Obtener todos los clientes
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nombre, telefono, direccion, created_at FROM clientes ORDER BY id DESC'
    )
    res.json(result.rows)
  } catch (err) {
    console.error('Error al obtener clientes:', err)
    res.status(500).json({ error: 'Error al obtener clientes' })
  }
})

// Crear cliente
router.post('/', async (req, res) => {
  const { nombre, telefono, direccion } = req.body
  if (!nombre) {
    return res.status(400).json({ error: 'El nombre es obligatorio' })
  }

  try {
    const result = await pool.query(
      `INSERT INTO clientes (nombre, telefono, direccion)
       VALUES ($1, $2, $3) RETURNING id, nombre, telefono, direccion, created_at`,
      [nombre, telefono || null, direccion || null]
    )
    res.json(result.rows[0])
  } catch (err) {
    console.error('Error al crear cliente:', err)
    res.status(500).json({ error: 'Error al crear cliente' })
  }
})

// Actualizar cliente
router.put('/:id', async (req, res) => {
  const { id } = req.params
  const { nombre, telefono, direccion } = req.body
  if (!nombre) {
    return res.status(400).json({ error: 'El nombre es obligatorio' })
  }

  try {
    const result = await pool.query(
      `UPDATE clientes
       SET nombre = $1, telefono = $2, direccion = $3
       WHERE id = $4
       RETURNING id, nombre, telefono, direccion, created_at`,
      [nombre, telefono || null, direccion || null, id]
    )
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' })
    }
    res.json(result.rows[0])
  } catch (err) {
    console.error('Error al actualizar cliente:', err)
    res.status(500).json({ error: 'Error al actualizar cliente' })
  }
})

// Eliminar cliente
router.delete('/:id', async (req, res) => {
  const { id } = req.params
  try {
    const result = await pool.query('DELETE FROM clientes WHERE id = $1', [id])
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' })
    }
    res.json({ message: 'Cliente eliminado' })
  } catch (err) {
    console.error('Error al eliminar cliente:', err)
    res.status(500).json({ error: 'Error al eliminar cliente' })
  }
})

export default router
