import express from "express";
import pool from "../db.js";

const router = express.Router();

// Obtener todas las deudas con detalles y pagos parciales
router.get("/", async (req, res) => {
    try {
        // Obtenemos solo las ventas que siguen en estado 'adeuda'
        // Si una venta se pagó (estado = 'pagada'), ya no sale aquí.
        const ventasResult = await pool.query(`
        SELECT v.id, v.total, v.fecha, v.estado, v.cliente_id,
               c.nombre AS cliente_nombre, c.telefono, c.direccion
        FROM ventas v
                 LEFT JOIN clientes c ON v.cliente_id = c.id
        WHERE v.estado = 'adeuda' AND v.venta_origen_id IS NULL
        ORDER BY v.fecha DESC
    `);

        const deudas = [];

        for (const venta of ventasResult.rows) {
            // Detalles
            const detallesResult = await pool.query(`
        SELECT dv.id, dv.producto_id, p.nombre AS producto_nombre,
               dv.cantidad, dv.precio_unitario, dv.subtotal
        FROM detalles_venta dv
        LEFT JOIN productos p ON dv.producto_id = p.id
        WHERE dv.venta_id = $1
      `, [venta.id]);

            // Pagos parciales
            const pagosParcialesResult = await pool.query(`
        SELECT id, total, estado, metodo_pago, fecha
        FROM ventas
        WHERE venta_origen_id = $1
        ORDER BY fecha ASC
      `, [venta.id]);

            deudas.push({
                ...venta,
                detalles: detallesResult.rows,
                pagosParciales: pagosParcialesResult.rows
            });
        }

        res.json(deudas);

    } catch (error) {
        console.error("Error al obtener deudas:", error);
        res.status(500).json({ error: "Error al obtener deudas" });
    }
});

// Marcar deuda como pagada y actualizar método de pago
router.put("/:id/pagar", async (req, res) => {
    const { id } = req.params;
    let { metodo_pago, tipoPago, montoParcial } = req.body;

    try {
        montoParcial = Number(montoParcial);

        const ventaResult = await pool.query(
            `SELECT * FROM ventas WHERE id = $1`,
            [id]
        );

        if (ventaResult.rowCount === 0) {
            return res.status(404).json({ error: "Venta no encontrada" });
        }

        const venta = ventaResult.rows[0];

        // --- CASO 1: PAGO TOTAL ---
        if (tipoPago === "total") {
            const result = await pool.query(
                `UPDATE ventas
                 SET estado = 'pagada', metodo_pago = $2, total = 0
                 WHERE id = $1
                 RETURNING *`,
                [id, metodo_pago]
            );
            return res.json({ message: "Deuda marcada como pagada", venta: result.rows[0] });
        }

        // --- CASO 2: PAGO PARCIAL ---
        if (montoParcial > venta.total) {
            return res.status(400).json({ error: "El monto parcial no puede ser mayor a la deuda" });
        }

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // 1. Crear el registro del pago (una "venta" hija)
            const pagoResult = await client.query(
                `INSERT INTO ventas (cliente_id, total, estado, metodo_pago, fecha, venta_origen_id)
                 VALUES ($1, $2, 'pagada', $3, NOW(), $4)
                 RETURNING *`,
                [venta.cliente_id, montoParcial, metodo_pago, id]
            );

            // 2. Calcular nuevo saldo de la deuda original
            let nuevoTotal = Number(venta.total) - montoParcial;

            // Corrección de decimales y estado
            // Si el saldo es casi 0, lo forzamos a 0 y estado pagada
            let nuevoEstado = 'adeuda'; // Por defecto sigue debiendo

            if (nuevoTotal < 0.1) {
                nuevoTotal = 0;
                nuevoEstado = 'pagada'; // ¡Aquí es donde desaparece de la lista!
            }

            // 3. Actualizar la venta original
            const deudaResult = await client.query(
                `UPDATE ventas
                 SET total = $2, estado = $3
                 WHERE id = $1
                 RETURNING *`,
                [id, nuevoTotal, nuevoEstado]
            );

            await client.query("COMMIT");

            res.json({
                message: nuevoEstado === "pagada"
                    ? "La deuda fue cancelada completamente"
                    : "Pago parcial registrado",
                pago: pagoResult.rows[0],
                deuda: deudaResult.rows[0]
            });

        } catch (err) {
            await client.query("ROLLBACK");
            console.error("Error en pago parcial:", err);
            res.status(500).json({ error: "Error al registrar pago parcial" });
        } finally {
            client.release();
        }

    } catch (err) {
        console.error("Error al procesar pago:", err);
        res.status(500).json({ error: "Error al procesar pago" });
    }
});

export default router;