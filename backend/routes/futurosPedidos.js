// routes/futurosPedidos.js
import express from "express"
import pool from "../db.js"

const router = express.Router()

// Función de consulta mejorada para obtener el nombre del producto (JOIN opcional)
const baseQuery = `
    SELECT 
        fp.id, 
        fp.producto, 
        fp.cantidad, 
        fp.creado_en, 
        fp.producto_id,
        p.nombre AS producto_nombre
    FROM 
        futuros_pedidos fp
    LEFT JOIN 
        productos p ON fp.producto_id = p.id
    ORDER BY DESC 
`

// GET /futuros-pedidos -> listar todos
router.get("/", async (req, res) => {
    try {
        // Uso de la consulta base para incluir el nombre del producto
        const result = await pool.query(`${baseQuery} ORDER BY fp.id ASC`)
        res.json(result.rows)
    } catch (err) {
        console.error("Error GET /futuros-pedidos:", err)
        res.status(500).json({ error: "Error obteniendo futuros pedidos" })
    }
})

// POST /futuros-pedidos -> crear nuevo (Maneja producto Y producto_id)
router.post("/", async (req, res) => {
    try {
        // Recibe producto (string) O producto_id (integer)
        const { producto, cantidad, producto_id } = req.body

        const result = await pool.query(
            "INSERT INTO futuros_pedidos (producto, cantidad, producto_id) VALUES ($1, $2, $3) RETURNING *",
            [producto || null, cantidad || null, producto_id || null]
        )
        // Opcional: Ejecutar otra query para obtener el nombre completo y retornarlo
        const newPedido = (await pool.query(`${baseQuery} WHERE fp.id = $1`, [result.rows[0].id])).rows[0]
        res.status(201).json(newPedido)
    } catch (err) {
        console.error("Error POST /futuros-pedidos:", err)
        res.status(500).json({ error: "Error creando futuro pedido" })
    }
})

// PUT /futuros-pedidos/:id -> actualizar (Maneja producto Y producto_id)
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params
        // Recibe producto (string) Y/O producto_id (integer)
        const { producto, cantidad, producto_id } = req.body

        // Construir la consulta de forma dinámica para manejar qué campos actualizar
        const fields = []
        const values = []
        let paramIndex = 1

        if (producto !== undefined) {
            fields.push(`producto = $${paramIndex++}`)
            values.push(producto || null)
        }
        if (cantidad !== undefined) {
            fields.push(`cantidad = $${paramIndex++}`)
            values.push(cantidad || null)
        }
        if (producto_id !== undefined) {
            fields.push(`producto_id = $${paramIndex++}`)
            values.push(producto_id || null)
        }

        if (fields.length === 0) {
            return res.status(400).json({ error: "No hay campos para actualizar" })
        }

        values.push(id) // El ID es el último parámetro

        const updateQuery = `
            UPDATE futuros_pedidos 
            SET ${fields.join(', ')} 
            WHERE id=$${paramIndex} 
            RETURNING id` // Solo necesitamos el ID para la siguiente query

        const result = await pool.query(updateQuery, values)

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Pedido no encontrado" })
        }

        // Obtener el registro completo con el nombre del producto
        const updatedPedido = (await pool.query(`${baseQuery} WHERE fp.id = $1`, [id])).rows[0]

        res.json(updatedPedido)
    } catch (err) {
        console.error("Error PUT /futuros-pedidos:", err)
        res.status(500).json({ error: "Error actualizando futuro pedido" })
    }
})

// DELETE /futuros-pedidos/:id -> eliminar
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params
        const result = await pool.query("DELETE FROM futuros_pedidos WHERE id=$1 RETURNING *", [id])
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Pedido no encontrado" })
        }
        res.json({ ok: true })
    } catch (err) {
        console.error("Error DELETE /futuros-pedidos:", err)
        res.status(500).json({ error: "Error eliminando futuro pedido" })
    }
})

export default router