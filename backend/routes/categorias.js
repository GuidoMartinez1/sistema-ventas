import express from 'express';
import pool from '../db.js';

const router = express.Router();

/**
 * Obtener todas las categorías
 */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categorias ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({ error: 'Error obteniendo categorías' });
  }
});

/**
 * Obtener categoría por ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM categorias WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error obteniendo categoría:', error);
    res.status(500).json({ error: 'Error obteniendo categoría' });
  }
});

/**
 * Crear categoría
 */
router.post('/', async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    const query = `
      INSERT INTO categorias (nombre, descripcion)
      VALUES ($1, $2)
      RETURNING *;
    `;

    const values = [nombre, descripcion || ''];

    const newCategory = await pool.query(query, values);
    res.json(newCategory.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
    }
    console.error('Error creando categoría:', error);
    res.status(500).json({ error: 'Error creando categoría' });
  }
});

/**
 * Actualizar categoría
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;

    const query = `
      UPDATE categorias
      SET nombre = $1, descripcion = $2
      WHERE id = $3
      RETURNING *;
    `;

    const values = [nombre, descripcion || '', id];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
    }
    console.error('Error actualizando categoría:', error);
    res.status(500).json({ error: 'Error actualizando categoría' });
  }
});

/**
 * Eliminar categoría
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM categorias WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    res.json({ message: 'Categoría eliminada correctamente' });
  } catch (error) {
    console.error('Error eliminando categoría:', error);
    res.status(500).json({ error: 'Error eliminando categoría' });
  }
});

export default router;
