// backend/routes/ventas.js
import express from "express";
import pool from "../db.js";

const router = express.Router();

// Obtener todas las ventas
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.*, c.nombre as cliente_nombre
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

// Obtener una venta por ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const ventaResult = await pool.query(
      `SELECT v.*, c.nombre as cliente_nombre
       FROM ventas v
       LEFT JOIN clientes c ON v.cliente_id = c.id
       WHERE v.id = $1`,
      [id]
    );

    if (ventaResult.rows.length === 0) {
      return res.status(404).json({ error: "Venta no encontrada" });
    }

    const detallesResult = await pool.query(
      `SELECT dv.*, p.nombre as producto_nombre
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

// Crear una nueva venta
router.post("/", async (req, res) => {
  const { cliente_id, productos, total, estado, metodo_pago } = req.body;

  try {
    await pool.query("BEGIN");

    // Si no hay productos en la venta → usar "Sin producto"
    let productosFinal = productos;
    if (!productos || productos.length === 0) {
      const sinProd = await pool.query(
        "SELECT id FROM productos WHERE nombre = 'Sin producto' LIMIT 1"
      );

      if (sinProd.rows.length === 0) {
        throw new Error(
          "No se encontró el producto 'Sin producto'. Crealo en la base de datos."
        );
      }

      productosFinal = [
        {
          producto_id: sinProd.rows[0].id,
          cantidad: 1,
          precio_unitario: total,
          subtotal: total,
        },
      ];
    }

    // Insertar venta
    const ventaResult = await pool.query(
      `INSERT INTO ventas (cliente_id, total, estado, metodo_pago)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [cliente_id || null, total, estado || "completada", metodo_pago || "efectivo"]
    );
    const ventaId = ventaResult.rows[0].id;

    // Insertar detalles
    for (const prod of productosFinal) {
      await pool.query(
        `INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [ventaId, prod.producto_id, prod.cantidad, prod.precio_unitario, prod.subtotal]
      );

      // Si no es "Sin producto", descontar stock
      const prodInfo = await pool.query(
        "SELECT nombre FROM productos WHERE id = $1",
        [prod.producto_id]
      );
      if (prodInfo.rows[0].nombre !== "Sin producto") {
        await pool.query(
          "UPDATE productos SET stock = stock - $1 WHERE id = $2",
          [prod.cantidad, prod.producto_id]
        );
      }
    }

    await pool.query("COMMIT");
    res.json({ message: "Venta creada exitosamente" });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error al procesar venta:", error);
    res.status(500).json({ error: "Error al procesar venta" });
  }
});

export default router;
