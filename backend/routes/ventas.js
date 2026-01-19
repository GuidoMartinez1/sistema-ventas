import express from "express";
import pool from "../db.js";

const router = express.Router();

// Obtener todas las ventas
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.id, v.cliente_id, c.nombre AS cliente_nombre, v.total, v.fecha, v.estado, v.metodo_pago
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      ORDER BY v.fecha DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener ventas:", error);
    res.status(500).json({ error: "Error al obtener ventas" });
  }
});

// Obtener venta por ID con detalles y pagos parciales
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Venta original
    const ventaResult = await pool.query(`
      SELECT v.id, v.cliente_id, c.nombre AS cliente_nombre, v.total, v.fecha, v.estado, v.metodo_pago
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      WHERE v.id = $1
    `, [id]);

    if (ventaResult.rows.length === 0) {
      return res.status(404).json({ error: "Venta no encontrada" });
    }

    const venta = ventaResult.rows[0];

    // Detalles de la venta
    const detallesResult = await pool.query(`
      SELECT dv.id, dv.producto_id, p.nombre AS producto_nombre, dv.descripcion, dv.cantidad, dv.precio_unitario, dv.subtotal
      FROM detalles_venta dv
      LEFT JOIN productos p ON dv.producto_id = p.id
      WHERE dv.venta_id = $1
    `, [id]);

    // Traer todos los pagos parciales asociados a la venta original
    const pagosParcialesResult = await pool.query(`
      SELECT v.id, v.total, v.fecha, v.estado, v.metodo_pago
      FROM ventas v
      WHERE v.venta_origen_id = $1
      ORDER BY v.fecha ASC
    `, [id]);

    res.json({
      ...venta,
      detalles: detallesResult.rows,
      pagosParciales: pagosParcialesResult.rows
    });

  } catch (error) {
    console.error("Error al obtener venta:", error);
    res.status(500).json({ error: "Error al obtener venta" });
  }
});

// Crear nueva venta
router.post("/", async (req, res) => {
  const { cliente_id, productos, total, estado, metodo_pago, venta_origen_id } = req.body;

  if (!productos || productos.length === 0) {
    return res.status(400).json({ error: "No hay productos en la venta" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Insertar venta
    const ventaResult = await client.query(`
      INSERT INTO ventas (cliente_id, total, estado, metodo_pago, venta_origen_id)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, [cliente_id || null, total, estado || "completada", metodo_pago || "efectivo", venta_origen_id || null]);

    const ventaId = ventaResult.rows[0].id;

    // Insertar detalles
    for (const producto of productos) {
      await client.query(`
        INSERT INTO detalles_venta (venta_id, producto_id, cantidad, precio_unitario, subtotal, descripcion)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        ventaId,
        producto.producto_id,
        producto.cantidad,
        producto.precio_unitario,
        producto.subtotal,
          producto.descripcion || null
      ]);

      // Si no es "Sin producto" (ID null o 0), actualizar stock
      if (producto.producto_id && producto.producto_id !== 0) {
        await client.query(`
          UPDATE productos SET stock = stock - $1 WHERE id = $2
        `, [producto.cantidad, producto.producto_id]);
      }
    }

    await client.query("COMMIT");
    res.status(201).json({ message: "Venta creada exitosamente", ventaId });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al procesar venta:", error);
    res.status(500).json({ error: "Error al procesar venta" });
  } finally {
    client.release();
  }
});

// Marcar deuda como pagada (total o parcial)
router.put("/:id/pagar", async (req, res) => {
  const { id } = req.params;
  const { monto } = req.body;

  if (!monto || monto <= 0) {
    return res.status(400).json({ error: "Debe ingresar un monto válido" });
  }

  try {
    const ventaResult = await pool.query(`SELECT * FROM ventas WHERE id = $1`, [id]);

    if (ventaResult.rows.length === 0) {
      return res.status(404).json({ error: "Venta no encontrada" });
    }

    const venta = ventaResult.rows[0];

    if (venta.estado === "pagada") {
      return res.status(400).json({ error: "La venta ya está pagada" });
    }

    if (monto > venta.total) {
      return res.status(400).json({ error: "El monto ingresado supera la deuda" });
    }

    const nuevoTotal = venta.total - monto;
    const nuevoEstado = nuevoTotal === 0 ? "completada" : "pendiente";

    const updateResult = await pool.query(`
      UPDATE ventas SET total = $1, estado = $2 WHERE id = $3 RETURNING *
    `, [nuevoTotal, nuevoEstado, id]);

    res.json({
      message: nuevoEstado === "completada"
          ? "Venta pagada completamente"
          : "Pago parcial registrado",
      venta: updateResult.rows[0]
    });
  } catch (error) {
    console.error("Error al registrar pago:", error);
    res.status(500).json({ error: "Error al registrar pago" });
  }
});

// Editar venta
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { metodo_pago, estado, total } = req.body;

  try {
    const result = await pool.query(`
      UPDATE ventas
      SET metodo_pago = COALESCE($1, metodo_pago),
          estado = COALESCE($2, estado),
          total = COALESCE($3, total)
      WHERE id = $4 RETURNING *
    `, [metodo_pago, estado, total, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Venta no encontrada" });
    }

    res.json({ message: "Venta actualizada", venta: result.rows[0] });
  } catch (error) {
    console.error("Error al editar venta:", error);
    res.status(500).json({ error: "Error al editar venta" });
  }
});

// Eliminar venta
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const detalles = await client.query(`
      SELECT producto_id, cantidad FROM detalles_venta WHERE venta_id = $1
    `, [id]);

    for (const det of detalles.rows) {
      if (det.producto_id && det.producto_id !== 0) {
        await client.query(`
          UPDATE productos SET stock = stock + $1 WHERE id = $2
        `, [det.cantidad, det.producto_id]);
      }
    }

    await client.query(`DELETE FROM detalles_venta WHERE venta_id = $1`, [id]);

    const result = await client.query(`DELETE FROM ventas WHERE id = $1 RETURNING *`, [id]);

    await client.query("COMMIT");

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Venta no encontrada" });
    }

    res.json({ message: "Venta eliminada correctamente" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al eliminar venta:", error);
    res.status(500).json({ error: "Error al eliminar venta" });
  } finally {
    client.release();
  }
});

export default router;