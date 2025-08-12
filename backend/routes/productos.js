// routes/productos.js
import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Obtener todos los productos
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM productos ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener productos:', err);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// Obtener productos con bajo stock (ej: menos de 5)
router.get('/bajo-stock', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM productos WHERE stock < 5 ORDER BY stock ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener productos con bajo stock:', err);
    res.status(500).json({ error: 'Error al obtener productos con bajo stock' });
  }
});

// Crear un producto
router.post('/', async (req, res) => {
  const { nombre, descripcion, precio, precio_costo, porcentaje_ganancia, stock, categoria_id, codigo } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO productos (nombre, descripcion, precio, precio_costo, porcentaje_ganancia, stock, categoria_id, codigo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [nombre, descripcion, precio, precio_costo, porcentaje_ganancia, stock, categoria_id, codigo]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al crear producto:', err);
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

// Actualizar un producto
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, precio_costo, porcentaje_ganancia, stock, categoria_id, codigo } = req.body;
  try {
    const result = await pool.query(
      `UPDATE productos SET nombre=$1, descripcion=$2, precio=$3, precio_costo=$4, porcentaje_ganancia=$5, stock=$6, categoria_id=$7, codigo=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [nombre, descripcion, precio, precio_costo, porcentaje_ganancia, stock, categoria_id, codigo, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al actualizar producto:', err);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

// Eliminar un producto
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM productos WHERE id=$1 RETURNING *', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    console.error('Error al eliminar producto:', err);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

export default router;
