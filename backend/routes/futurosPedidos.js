// routes/futurosPedidos.js
import express from "express"
import pool from "../db.js"

const router = express.Router()

// GET /futuros-pedidos -> listar todos
router.get("/", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM futuros_pedidos ORDER BY id ASC")
        res.json(result.rows)
    } catch (err) {
        console.error("Error GET /futuros-pedidos:", err)
        res.status(500).json({ error: "Error obteniendo futuros pedidos" })
    }
})

// POST /futuros-pedidos -> crear nuevo
router.post("/", async (req, res) => {
    try {
        const { producto, cantidad } = req.body
        const result = await pool.query(
            "INSERT INTO futuros_pedidos (producto, cantidad) VALUES ($1, $2) RETURNING *",
            [producto, cantidad || null]
        )
        res.status(201).json(result.rows[0])
    } catch (err) {
        console.error("Error POST /futuros-pedidos:", err)
        res.status(500).json({ error: "Error creando futuro pedido" })
    }
})

// PUT /futuros-pedidos/:id -> actualizar
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params
        const { producto, cantidad } = req.body
        const result = await pool.query(
            "UPDATE futuros_pedidos SET producto=$1, cantidad=$2 WHERE id=$3 RETURNING *",
            [producto, cantidad || null, id]
        )
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Pedido no encontrado" })
        }
        res.json(result.rows[0])
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
