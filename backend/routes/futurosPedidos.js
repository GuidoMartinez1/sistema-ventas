import express from 'express'
import pool from '../db.js' // conexión a PostgreSQL

const router = express.Router()

// GET todos los futuros pedidos
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM futuros_pedidos ORDER BY creado_en DESC')
        res.json(result.rows)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Error al obtener futuros pedidos' })
    }
})

// POST crear un nuevo futuro pedido
router.post('/', async (req, res) => {
    const { producto, cantidad } = req.body
    if (!producto) {
        return res.status(400).json({ error: 'El producto es obligatorio' })
    }
    try {
        const result = await pool.query(
            'INSERT INTO futuros_pedidos (producto, cantidad) VALUES ($1, $2) RETURNING *',
            [producto, cantidad]
        )
        res.status(201).json(result.rows[0])
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Error al crear futuro pedido' })
    }
})

// DELETE eliminar un futuro pedido
router.delete('/:id', async (req, res) => {
    const { id } = req.params
    try {
        await pool.query('DELETE FROM futuros_pedidos WHERE id = $1', [id])
        res.json({ message: 'Futuro pedido eliminado' })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Error al eliminar futuro pedido' })
    }
})

export default router
