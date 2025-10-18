// backend/routes/gastos.js
import express from 'express'
import pool from '../db.js' // Asumiendo que esta es tu conexión a la DB

const router = express.Router()

// GET: Obtener todos los gastos
router.get('/', async (req, res) => {
    try {
        const allGastos = await pool.query("SELECT * FROM gastos ORDER BY fecha DESC, created_at DESC")
        res.json(allGastos.rows)
    } catch (err) {
        console.error(err.message)
        res.status(500).send("Error del Servidor")
    }
})

// POST: Crear un nuevo gasto
router.post('/', async (req, res) => {
    try {
        const { concepto, monto, fecha } = req.body
        if (!concepto || !monto || !fecha) {
            return res.status(400).json({ error: "Faltan campos requeridos." })
        }

        const newGasto = await pool.query(
            "INSERT INTO gastos (concepto, monto, fecha) VALUES($1, $2, $3) RETURNING *",
            [concepto, monto, fecha]
        )
        res.json(newGasto.rows[0])
    } catch (err) {
        console.error(err.message)
        res.status(500).send("Error del Servidor")
    }
})

// DELETE: Eliminar un gasto (opcional pero muy útil)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleteGasto = await pool.query("DELETE FROM gastos WHERE id = $1 RETURNING *", [id]);
        if (deleteGasto.rowCount === 0) {
            return res.status(404).json({ error: "Gasto no encontrado." });
        }
        res.json({ message: "Gasto eliminado correctamente." });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Error del Servidor");
    }
});

export default router