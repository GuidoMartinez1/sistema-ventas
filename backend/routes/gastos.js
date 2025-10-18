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
        const { concepto, monto, fecha, moneda } = req.body // Ya no recibimos cotizacion

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
        const newGasto = await pool.query(
            "INSERT INTO gastos (concepto, monto, fecha, moneda, monto_ars) VALUES($1, $2, $3, $4, $5) RETURNING *",
            [concepto, monto, fecha, moneda, monto_ars] // Nota: Insertamos el monto original y el monto normalizado
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