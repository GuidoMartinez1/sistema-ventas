// backend/routes/cotizaciones.js
import express from 'express'
import pool from '../db.js'

const router = express.Router()

// GET: Obtener todas las cotizaciones (para el listado)
router.get('/', async (req, res) => {
    try {
        const allCotizaciones = await pool.query("SELECT * FROM cotizaciones ORDER BY fecha DESC")
        res.json(allCotizaciones.rows)
    } catch (err) {
        res.status(500).send("Error del Servidor al obtener cotizaciones")
    }
})

// GET: Obtener la cotización por fecha (para el formulario de gastos)
router.get('/fecha/:fecha', async (req, res) => {
    try {
        const { fecha } = req.params;
        const cotizacion = await pool.query("SELECT valor FROM cotizaciones WHERE fecha = $1", [fecha]);
        if (cotizacion.rowCount === 0) {
            // Devolvemos 1 si no se encuentra (para que el cálculo en ARS no falle si es ARS)
            return res.json({ valor: 1 });
        }
        res.json(cotizacion.rows[0]);
    } catch (err) {
        res.status(500).send("Error del Servidor al obtener cotización por fecha")
    }
})

// POST: Crear una nueva cotización
router.post('/', async (req, res) => {
    try {
        const { fecha, valor } = req.body
        const newCotizacion = await pool.query(
            "INSERT INTO cotizaciones (fecha, valor) VALUES($1, $2) ON CONFLICT (fecha) DO UPDATE SET valor = EXCLUDED.valor RETURNING *",
            [fecha, valor]
        )
        res.json(newCotizacion.rows[0])
    } catch (err) {
        // Error 23505 (violación de clave única) si intenta insertar dos veces la misma fecha
        res.status(500).json({ error: "Error al guardar la cotización. Asegúrese de que la fecha no esté duplicada." })
    }
})

export default router