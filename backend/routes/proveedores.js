import express from 'express';
import pool from '../db.js';

const router = express.Router();

/**
 * Obtener todos los proveedores
 */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM proveedores ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo proveedores:', error);
    res.status(500).json({ error: 'Error obteniendo proveedores' });
  }
});

/**
 * Obtener proveedor por ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM proveedores WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error obteniendo proveedor:', error);
    res.status(500).json({ error: 'Error obteniendo proveedor' });
  }
});

/**
 * Crear proveedor
 */
router.post('/', async (req, res) => {
  try {
    const { nombre, email, telefono, direccion } = req.body;

    const query = `
      INSERT INTO proveedores (nombre, email, telefono, direccion)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;

    const values = [nombre, email || '', telefono || '', direccion || ''];

    const newProvider = await pool.query(query, values);
    res.json(newProvider.rows[0]);
  } catch (error) {
    console.error('Error creando proveedor:', error);
    res.status(500).json({ error: 'Error creando proveedor' });
  }
});

/**
 * Actualizar proveedor
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, telefono, direccion } = req.body;

    const query = `
      UPDATE proveedores
      SET nombre = $1, email = $2, telefono = $3, direccion = $4
      WHERE id = $5
      RETURNING *;
    `;

    const values = [nombre, email || '', telefono || '', direccion || '', id];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error actualizando proveedor:', error);
    res.status(500).json({ error: 'Error actualizando proveedor' });
  }
});

/**
 * Eliminar proveedor
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM proveedores WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    res.json({ message: 'Proveedor eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando proveedor:', error);
    res.status(500).json({ error: 'Error eliminando proveedor' });
  }
});

export default router;
