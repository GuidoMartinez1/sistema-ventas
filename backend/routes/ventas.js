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
       FROM detalle_ventas dv
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

    // Si hay productos con nombre "Sin producto" y sin ID → buscar su ID
    for (let p of productos) {
      if (!p.producto_id && p.producto_nombre === "Sin producto") {
        const prodRes = await client.query(
          "SELECT id FROM productos WHERE nombre = $1 LIMIT 1",
          ["Sin producto"]
        );

        if (prodRes.rows.length > 0) {
          p.producto_id = prodRes.rows[0].id;
        } else {
          // Lo creo si no existe
          const insertRes = await client.query(
            `INSERT INTO productos (nombre, precio, stock, categoria_id, codigo)
             VALUES ($1, 0, 0, 1, 'SINPROD')
             RETURNING id`,
            ["Sin producto"]
          );
          p.producto_id = insertRes.rows[0].id;
        }
      }
    }

    const ventaResult = await client.query(
      `INSERT INTO ventas (cliente_id, total, estado, metodo_pago)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [cliente_id || null, total, estado || "completada", metodo_pago || "efectivo"]
    );

    const ventaId = ventaResult.rows[0].id;

    // Insertar detalles
    for (let p of productos) {
      await client.query(
        `INSERT INTO detalle_ventas
         (venta_id, producto_id, cantidad, precio_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          ventaId,
          p.producto_id,
          p.cantidad || 1,
          p.precio_unitario || total,
          p.subtotal || total,
        ]
      );

      // Descontar stock si corresponde
      if (p.producto_id && p.producto_nombre !== "Sin producto") {
        await client.query(
          "UPDATE productos SET stock = stock - $1 WHERE id = $2",
          [p.cantidad || 1, p.producto_id]
        );
      }
    }

    await client.query("COMMIT");
    res.json({ message: "Venta registrada correctamente" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al crear venta:", error);
    res.status(500).json({ error: "Error al procesar la venta" });
  } finally {
    client.release();
  }
});

export default router;
