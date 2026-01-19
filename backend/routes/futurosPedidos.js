import express from "express"
import pool from "../db.js"

const router = express.Router()

// SQL LIMPIO: Sin comentarios internos para evitar errores de sintaxis
const baseQuery = `
    SELECT
        fp.id,
        fp.producto,
        fp.cantidad,
        fp.creado_en,
        fp.producto_id,
        p.nombre AS producto_nombre,
        p.precio_costo
    FROM
        futuros_pedidos fp
            LEFT JOIN
        productos p ON fp.producto_id = p.id
`

// GET /futuros-pedidos -> listar todos
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(`${baseQuery} ORDER BY fp.id DESC`)
        res.json(result.rows)
    } catch (err) {
        // Este console.error aparecerá en los logs de Render si falla
        console.error("Error GET /futuros-pedidos:", err)
        res.status(500).json({ error: "Error obteniendo futuros pedidos" })
    }
})

// POST /futuros-pedidos -> crear nuevo
router.post("/", async (req, res) => {
    try {
        const { producto, cantidad, producto_id } = req.body

        const result = await pool.query(
            "INSERT INTO futuros_pedidos (producto, cantidad, producto_id) VALUES ($1, $2, $3) RETURNING *",
            [producto || null, cantidad || null, producto_id || null]
        )

        // Obtenemos el registro completo usando la baseQuery para devolver el nombre/costo al front
        const newPedido = (await pool.query(`${baseQuery} WHERE fp.id = $1`, [result.rows[0].id])).rows[0]
        res.status(201).json(newPedido)
    } catch (err) {
        console.error("Error POST /futuros-pedidos:", err)
        res.status(500).json({ error: "Error creando futuro pedido" })
    }
})

// PUT /futuros-pedidos/:id -> actualizar
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params
        const { producto, cantidad, producto_id } = req.body

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

        values.push(id)

        const updateQuery = `
            UPDATE futuros_pedidos
            SET ${fields.join(', ')}
            WHERE id=$${paramIndex}
                RETURNING id`

        const result = await pool.query(updateQuery, values)

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Pedido no encontrado" })
        }

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