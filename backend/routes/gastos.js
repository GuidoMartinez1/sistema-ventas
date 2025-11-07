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
        // 🆕 Ahora recibimos 'categoria'
        const { concepto, monto, fecha, moneda, categoria } = req.body // Ya no recibimos cotizacion

        // Validación básica de categoría
        if (!categoria) {
            return res.status(400).json({ error: "Debe seleccionar una categoría para el gasto." });
        }

        // 1. Obtener la cotización del día para la fecha del gasto
        let cotizacion_usada = 1; // Default para ARS

        if (moneda === 'USD') {
            const cotizacionResult = await pool.query(
                "SELECT valor FROM cotizaciones WHERE fecha = $1", [fecha]
            );

            if (cotizacionResult.rowCount === 0) {
                return res.status(400).json({ error: "No existe una cotización USD registrada para la fecha: " + fecha });
            }
            cotizacion_usada = Number(cotizacionResult.rows[0].valor);
        }

        // 2. Lógica de normalización
        const monto_ars = Number(monto) * cotizacion_usada;

        // 3. Insertar
        // 🆕 Añadimos $6 para la categoría
        const newGasto = await pool.query(
            "INSERT INTO gastos (concepto, monto, fecha, moneda, monto_ars, categoria) VALUES($1, $2, $3, $4, $5, $6) RETURNING *",
            [concepto, monto, fecha, moneda, monto_ars, categoria] // Nota: Agregamos categoria
        )
        res.json(newGasto.rows[0])
    } catch (err) {
        console.error(err.message)
        res.status(500).send("Error del Servidor")
    }
})

// 🆕 PUT: Actualizar un gasto existente por ID
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Recibimos todos los campos que pueden ser editados:
        const { concepto, monto, fecha, moneda, categoria } = req.body;

        if (!categoria) {
            return res.status(400).json({ error: "Debe seleccionar una categoría para el gasto." });
        }

        // 1. Obtener la cotización del día para la fecha del gasto
        let cotizacion_usada = 1;

        if (moneda === 'USD') {
            const cotizacionResult = await pool.query(
                "SELECT valor FROM cotizaciones WHERE fecha = $1", [fecha]
            );

            if (cotizacionResult.rowCount === 0) {
                return res.status(400).json({ error: "No existe una cotización USD registrada para la fecha: " + fecha });
            }
            cotizacion_usada = Number(cotizacionResult.rows[0].valor);
        }

        // 2. Lógica de normalización
        const monto_ars = Number(monto) * cotizacion_usada;

        // 3. Actualizar la base de datos
        const updatedGasto = await pool.query(
            "UPDATE gastos SET concepto = $1, monto = $2, fecha = $3, moneda = $4, monto_ars = $5, categoria = $6 WHERE id = $7 RETURNING *",
            [concepto, monto, fecha, moneda, monto_ars, categoria, id]
        );

        if (updatedGasto.rowCount === 0) {
            return res.status(404).json({ error: "Gasto no encontrado." });
        }
        res.json(updatedGasto.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Error del Servidor");
    }
});

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