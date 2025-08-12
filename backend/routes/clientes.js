import express from 'express';
import pool from '../db.js';

const router = express.Router();

/**
 * Obtener todos los clientes
 */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clientes ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    res.status(500).json({ error: 'Error obteniendo clientes' });
  }
});

/**
 * Obtener cliente por ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM clientes WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error obteniendo cliente:', error);
    res.status(500).json({ error: 'Error obteniendo cliente' });
  }
});

/**
 * Crear cliente
 */
router.post('/', async (req, res) => {
  try {
    const { nombre, email, telefono, direccion } = req.body;

    const query = `
      INSERT INTO clientes (nombre, email, telefono, direccion)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;

    const values = [nombre, email || '', telefono || '', direccion || ''];

    const newClient = await pool.query(query, values);
    res.json(newClient.rows[0]);
  } catch (error) {
    console.error('Error creando cliente:', error);
    res.status(500).json({ error: 'Error creando cliente' });
  }
});

/**
 * Actualizar cliente
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, telefono, direccion } = req.body;

    const query = `
      UPDATE clientes
      SET nombre = $1, email = $2, telefono = $3, direccion = $4
      WHERE id = $5
      RETURNING *;
    `;

    const values = [nombre, email || '', telefono || '', direccion || '', id];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error actualizando cliente:', error);
    res.status(500).json({ error: 'Error actualizando cliente' });
  }
});

/**
 * Eliminar cliente
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM clientes WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json({ message: 'Cliente eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando cliente:', error);
    res.status(500).json({ error: 'Error eliminando cliente' });
  }
});

export default router;
