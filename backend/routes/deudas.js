// backend/routes/deudas.js
import express from "express";
import pool from "../db.js";

const router = express.Router();

// Obtener todas las deudas con detalles
router.get("/", async (req, res) => {
  try {
    // Traemos ventas con estado = 'adeuda'
    const ventasResult = await pool.query(
      `SELECT v.id, v.total, v.fecha, v.estado, v.cliente_id,
              c.nombre AS cliente_nombre, c.telefono, c.direccion
       FROM ventas v
       LEFT JOIN clientes c ON v.cliente_id = c.id
       WHERE v.estado = 'adeuda'
       ORDER BY v.fecha DESC`
    );

    const deudas = [];

    for (const venta of ventasResult.rows) {
      // Traemos los detalles de cada venta
      const detallesResult = await pool.query(
        `SELECT dv.id, dv.producto_id, p.nombre AS producto_nombre,
                dv.cantidad, dv.precio_unitario, dv.subtotal
         FROM detalles_venta dv
         LEFT JOIN productos p ON dv.producto_id = p.id
         WHERE dv.venta_id = $1`,
        [venta.id]
      );

      deudas.push({
        ...venta,
        detalles: detallesResult.rows
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
    const { metodo_pago, tipoPago, montoParcial } = req.body;

    try {
        const ventaResult = await pool.query(`SELECT * FROM ventas WHERE id = $1`, [id]);

        if (ventaResult.rowCount === 0) {
            return res.status(404).json({ error: "Venta no encontrada" });
        }

        const venta = ventaResult.rows[0];

        if (tipoPago === "total") {
            // Pago total
            const result = await pool.query(
                `UPDATE ventas 
         SET estado = 'pagada', metodo_pago = $2
         WHERE id = $1 
         RETURNING *`,
                [id, metodo_pago]
            );
            return res.json({ message: "Deuda marcada como pagada", venta: result.rows[0] });
        }

        // Pago parcial
        if (montoParcial > venta.total) {
            return res.status(400).json({ error: "El monto parcial no puede ser mayor a la deuda" });
        }

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // 1. Crear nueva venta solo con el monto pagado
            const pagoResult = await client.query(
                `INSERT INTO ventas (cliente_id, total, estado, metodo_pago, fecha)
         VALUES ($1, $2, 'pagada', $3, NOW())
         RETURNING *`,
                [venta.cliente_id, montoParcial, metodo_pago]
            );

            // 2. Actualizar venta original con el nuevo total
            const nuevoTotal = venta.total - montoParcial;
            const nuevoEstado = nuevoTotal === 0 ? "completada" : "adeuda";

            const deudaResult = await client.query(
                `UPDATE ventas 
         SET total = $2, estado = $3
         WHERE id = $1
         RETURNING *`,
                [id, nuevoTotal, nuevoEstado]
            );

            await client.query("COMMIT");

            res.json({
                message: nuevoEstado === "completada"
                    ? "La deuda fue cancelada completamente"
                    : "Pago parcial registrado",
                pago: pagoResult.rows[0],   // nueva venta parcial
                deuda: deudaResult.rows[0]  // venta original actualizada
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
