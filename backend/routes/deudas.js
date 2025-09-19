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
  const { id } = req.params
  const { metodo_pago, tipoPago, montoParcial } = req.body

  try {
    if (tipoPago === "total") {
      // Pago total: marcar como pagada
      const result = await pool.query(
          `UPDATE ventas 
         SET estado = 'pagada', metodo_pago = $2
         WHERE id = $1 
         RETURNING *`,
          [id, metodo_pago]
      )

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Venta no encontrada" })
      }

      return res.json({ message: "Deuda marcada como pagada", venta: result.rows[0] })
    } else {
      // Pago parcial: descontar del total y mantener estado = 'adeuda'
      const venta = await pool.query(`SELECT total FROM ventas WHERE id = $1`, [id])
      if (venta.rowCount === 0) {
        return res.status(404).json({ error: "Venta no encontrada" })
      }

      const nuevoTotal = venta.rows[0].total - montoParcial

      const result = await pool.query(
          `UPDATE ventas 
         SET total = $2, metodo_pago = $3
         WHERE id = $1 
         RETURNING *`,
          [id, nuevoTotal, metodo_pago]
      )

      return res.json({ message: "Pago parcial registrado", venta: result.rows[0] })
    }
  } catch (error) {
    console.error("Error al registrar pago:", error)
    res.status(500).json({ error: "Error al registrar pago" })
  }
})

export default router;
