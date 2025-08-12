// backend/routes/ventas.js
import express from "express";
import pool from "../db.js";

const router = express.Router();

// Obtener todas las ventas
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.*, c.nombre AS cliente_nombre
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

// Obtener venta por ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const ventaResult = await pool.query(
      `SELECT v.*, c.nombre AS cliente_nombre
       FROM ventas v
       LEFT JOIN clientes c ON v.cliente_id = c.id
       WHERE v.id = $1`,
      [id]
    );

    if (ventaResult.rows.length === 0) {
      return res.status(404).json({ error: "Venta no encontrada" });
    }

    const detallesResult = await pool.query(
      `SELECT dv.*, p.nombre AS producto_nombre
       FROM detalles_venta dv
       LEFT JOIN productos p ON dv.producto_id = p.id
       WHERE dv.venta_id = $1`,
      [id]
    );

    res.json({
      ...ventaResult.rows[0],
      detalles: detallesResult.rows,
    });
  } catch (error) {
    console.error("Error al obtener venta:", error);
    res.status(500).json({ error: "Error al obtener venta" });
  }
});

// Crear venta
router.post("/", async (req, res) => {
  const { cliente_id, productos, total, estado, metodo_pago } = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const ventaResult = await client.query(
      `INSERT INTO ventas (cliente_id, total, fecha, estado, metodo_pago)
       VALUES ($1, $2, NOW(), $3, $4)
       RETURNING *`,
      [cliente_id || null, total, estado || "pagada", metodo_pago || "efectivo"]
    );
    const venta = ventaResult.rows[0];

    for (const prod of productos) {
      // Obtener datos del producto
      const prodData = await client.query(
        "SELECT id, nombre, stock FROM productos WHERE id = $1",
        [prod.producto_id]
      );

      if (prodData.rows.length === 0) {
        throw new Error(`Producto con ID ${prod.producto_id} no encontrado`);
      }

      const { nombre, stock } = prodData.rows[0];

      // Si es "Sin producto", no controlamos stock
      if (nombre.toLowerCase() === "sin producto") {
        await client.query(
          `INSERT INTO detalles_venta (venta_id, producto_id, cantidad, precio_unitario, subtotal)
           VALUES ($1, $2, $3, $4, $5)`,
          [venta.id, prod.producto_id, prod.cantidad, prod.precio_unitario, prod.subtotal]
        );
        continue;
      }

      // Validar stock
      if (stock < prod.cantidad) {
        throw new Error(`Stock insuficiente para el producto "${nombre}"`);
      }

      // Descontar stock
      await client.query(
        "UPDATE productos SET stock = stock - $1 WHERE id = $2",
        [prod.cantidad, prod.producto_id]
      );

      // Insertar detalle
      await client.query(
        `INSERT INTO detalles_venta (venta_id, producto_id, cantidad, precio_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [venta.id, prod.producto_id, prod.cantidad, prod.precio_unitario, prod.subtotal]
      );
    }

    await client.query("COMMIT");
    res.status(201).json(venta);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al procesar venta:", error);
    res.status(500).json({ error: "Error al procesar venta" });
  } finally {
    client.release();
  }
});

export default router;
