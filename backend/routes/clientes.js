import express from "express";
import pool from "../db.js";

const router = express.Router();

/**
 * 📌 Obtener todos los clientes
 */
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM clientes ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener clientes:", err);
    res.status(500).json({ error: "Error al obtener clientes" });
  }
});

/**
 * 📌 Crear cliente
 */
router.post("/", async (req, res) => {
  let { nombre, email, telefono, direccion } = req.body;

  // Validación básica
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: "El nombre es obligatorio" });
  }

  // Normalizar valores vacíos a null
  nombre = nombre.trim();
  email = email?.trim() || null;
  telefono = telefono?.trim() || null;
  direccion = direccion?.trim() || null;

  try {
    const result = await pool.query(
      `INSERT INTO clientes (nombre, email, telefono, direccion)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [nombre, email, telefono, direccion]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error al crear cliente:", err);
    res.status(500).json({ error: "Error al crear cliente" });
  }
});

/**
 * 📌 Actualizar cliente
 */
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  let { nombre, email, telefono, direccion } = req.body;

  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: "El nombre es obligatorio" });
  }

  nombre = nombre.trim();
  email = email?.trim() || null;
  telefono = telefono?.trim() || null;
  direccion = direccion?.trim() || null;

  try {
    const result = await pool.query(
      `UPDATE clientes 
       SET nombre = $1, email = $2, telefono = $3, direccion = $4
       WHERE id = $5 RETURNING *`,
      [nombre, email, telefono, direccion, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error al actualizar cliente:", err);
    res.status(500).json({ error: "Error al actualizar cliente" });
  }
});

/**
 * 📌 Eliminar cliente
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM clientes WHERE id = $1",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json({ message: "Cliente eliminado" });
  } catch (err) {
    console.error("Error al eliminar cliente:", err);
    res.status(500).json({ error: "Error al eliminar cliente" });
  }
});

export default router;
