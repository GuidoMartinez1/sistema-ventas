import express from "express";
import pool from "../db.js";

const router = express.Router();

// 1. Obtener solo alertas no revisadas y donde el precio REALMENTE cambió
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT h.id, h.producto_id, p.nombre as producto_nombre,
             h.precio_costo_anterior as costo_anterior, h.precio_costo_nuevo as costo_nuevo,
             p.precio as precio_venta_actual, c.fecha as fecha_detectado, pr.nombre as proveedor_nombre
      FROM historial_costos h
      JOIN productos p ON h.producto_id = p.id
      JOIN compras c ON h.compra_id = c.id
      JOIN proveedores pr ON c.proveedor_id = pr.id
      WHERE h.revisado = FALSE
      AND h.precio_costo_nuevo <> h.precio_costo_anterior
      ORDER BY c.fecha DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener actualizaciones" });
  }
});

// 2. Resolver: Actualiza producto (precio y ganancia) y archiva la alerta
router.post("/:id/resolver", async (req, res) => {
  const { id } = req.params;
  const { precio, porcentaje_ganancia } = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const historial = await client.query("SELECT producto_id FROM historial_costos WHERE id = $1", [id]);

    if (historial.rows.length > 0) {
      const prodId = historial.rows[0].producto_id;

      // Actualizamos precio y el nuevo porcentaje de ganancia
      await client.query(
        "UPDATE productos SET precio = $1, porcentaje_ganancia = $2, updated_at = NOW() WHERE id = $3",
        [precio, porcentaje_ganancia, prodId]
      );

      // Seteamos como revisado para que NO se borre
      await client.query("UPDATE historial_costos SET revisado = TRUE WHERE id = $1", [id]);
    }
    await client.query("COMMIT");
    res.json({ message: "Producto actualizado y alerta archivada" });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Error al resolver" });
  } finally {
    client.release();
  }
});

// 3. Ignorar/Eliminar: Solo archiva la alerta
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("UPDATE historial_costos SET revisado = TRUE WHERE id = $1", [req.params.id]);
    res.json({ message: "Alerta ignorada y archivada" });
  } catch (error) {
    res.status(500).json({ error: "Error al archivar alerta" });
  }
});

export default router;