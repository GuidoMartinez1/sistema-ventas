// backend/routes/actualizaciones.js (o agregalo a tu server)
import express from "express";
import pool from "../db.js";

const router = express.Router();

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
        WHERE h.revisado = FALSE  -- <--- CAMBIO CRÍTICO: Solo lo pendiente
        ORDER BY c.fecha DESC
      `);
      res.json(result.rows);
    }catch (error) {
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
      const historial = await client.query("SELECT producto_id FROM historial_costos WHERE id = $1", [id]);

      if (historial.rows.length > 0) {
          const prodId = historial.rows[0].producto_id;
          await client.query("UPDATE productos SET precio = $1 WHERE id = $2", [precio, prodId]);

          // UPDATE en lugar de DELETE
          await client.query("UPDATE historial_costos SET revisado = TRUE WHERE id = $1", [id]);
      }
      await client.query("COMMIT");
      res.json({ message: "Precio actualizado y alerta archivada" });
    }catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Error al resolver" });
  } finally {
    client.release();
  }
});

// 3. ELIMINAR (Ignorar alerta)
router.delete("/:id", async (req, res) => {
  try {
      // CAMBIO AQUÍ: UPDATE en lugar de DELETE
      await pool.query("UPDATE historial_costos SET revisado = TRUE WHERE id = $1", [req.params.id]);
      res.json({ message: "Alerta archivada" });
  }catch (error) {
    res.status(500).json({ error: "Error al eliminar alerta" });
  }
});

export default router;