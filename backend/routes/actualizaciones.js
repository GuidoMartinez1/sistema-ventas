// backend/routes/actualizaciones.js (o agregalo a tu server)
import express from "express";
import pool from "../db.js";

const router = express.Router();

// 1. OBTENER PENDIENTES
router.get("/", async (req, res) => {
  try {
    // Unimos historial_costos con productos y compras para tener toda la info
    const result = await pool.query(`
      SELECT
        h.id,
        h.producto_id,
        p.nombre as producto_nombre,
        h.precio_costo_anterior as costo_anterior,
        h.precio_costo_nuevo as costo_nuevo,
        p.precio as precio_venta_actual,
        c.fecha as fecha_detectado
      FROM historial_costos h
      JOIN productos p ON h.producto_id = p.id
      JOIN compras c ON h.compra_id = c.id
      ORDER BY c.fecha DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener actualizaciones" });
  }
});

// 2. RESOLVER (Actualizar precio venta y borrar alerta)
router.post("/:id/resolver", async (req, res) => {
  const { id } = req.params; // ID del historial
  const { precio } = req.body; // Nuevo precio de venta elegido por el usuario

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // A. Obtenemos el producto_id asociado a esta alerta
    const historial = await client.query("SELECT producto_id FROM historial_costos WHERE id = $1", [id]);

    if (historial.rows.length > 0) {
        const prodId = historial.rows[0].producto_id;

        // B. Actualizamos el precio de venta del producto
        await client.query("UPDATE productos SET precio = $1 WHERE id = $2", [precio, prodId]);

        // C. Borramos la alerta porque ya fue atendida
        await client.query("DELETE FROM historial_costos WHERE id = $1", [id]);
    }

    await client.query("COMMIT");
    res.json({ message: "Precio actualizado y alerta resuelta" });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Error al resolver" });
  } finally {
    client.release();
  }
});

// 3. ELIMINAR (Ignorar alerta)
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM historial_costos WHERE id = $1", [req.params.id]);
    res.json({ message: "Alerta descartada" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar alerta" });
  }
});

export default router;