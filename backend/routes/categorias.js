// routes/categorias.js
import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Obtener todas las categorías
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categorias ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener categorías:', err);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

// Crear nueva categoría (evitar duplicados)
router.post('/', async (req, res) => {
  const { nombre, descripcion } = req.body;
  try {
    // Verificar si ya existe
    const existe = await pool.query('SELECT 1 FROM categorias WHERE nombre = $1', [nombre]);
    if (existe.rowCount > 0) {
      return res.status(400).json({ error: 'La categoría ya existe' });
    }

    const result = await pool.query(
      'INSERT INTO categorias (nombre, descripcion) VALUES ($1, $2) RETURNING *',
      [nombre, descripcion]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al crear categoría:', err);
    res.status(500).json({ error: 'Error al crear categoría' });
  }
});

// Actualizar una categoría
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion } = req.body;
  try {
    // Verificar si el nombre ya está en otra categoría
    const existe = await pool.query('SELECT 1 FROM categorias WHERE nombre = $1 AND id != $2', [nombre, id]);
    if (existe.rowCount > 0) {
      return res.status(400).json({ error: 'Ya existe otra categoría con ese nombre' });
    }

    const result = await pool.query(
      'UPDATE categorias SET nombre = $1, descripcion = $2 WHERE id = $3 RETURNING *',
      [nombre, descripcion, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al actualizar categoría:', err);
    res.status(500).json({ error: 'Error al actualizar categoría' });
  }
});

// Eliminar una categoría
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM categorias WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.json({ message: 'Categoría eliminada' });
  } catch (err) {
    console.error('Error al eliminar categoría:', err);
    res.status(500).json({ error: 'Error al eliminar categoría' });
  }
});

export default router;
