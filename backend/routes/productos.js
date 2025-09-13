import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Obtener todos los productos
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, c.nombre AS categoria_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      ORDER BY p.nombre ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// Obtener productos bajo stock
router.get('/bajo-stock', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, c.nombre AS categoria_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.stock <= 5
      ORDER BY p.stock ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener productos bajo stock:', error);
    res.status(500).json({ error: 'Error al obtener productos bajo stock' });
  }
});

// Crear producto
router.post('/', async (req, res) => {
  const {
    nombre,
    descripcion,
    precio,
    precio_kg,
    precio_costo,
    porcentaje_ganancia,
    stock,
    categoria_id,
    codigo
  } = req.body;

  try {
    let codigoFinal = codigo;
    if (!codigoFinal || codigoFinal.trim() === '') {
      // Generar código único automáticamente
      codigoFinal = `P-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }

    const result = await pool.query(
      `INSERT INTO productos
      (nombre, descripcion, precio, precio_kg, precio_costo, porcentaje_ganancia, stock, categoria_id, codigo)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [nombre, descripcion, precio, precio_kg, precio_costo, porcentaje_ganancia, stock, categoria_id, codigoFinal]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

// Actualizar producto
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    nombre,
    descripcion,
    precio,
    precio_kg,
    precio_costo,
    porcentaje_ganancia,
    stock,
    categoria_id,
    codigo
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE productos
      SET nombre=$1, descripcion=$2, precio=$3, precio_kg=$4, precio_costo=$5, porcentaje_ganancia=$6, stock=$7, categoria_id=$8, codigo=$9, updated_at=NOW()
      WHERE id=$10
      RETURNING *`,
      [nombre, descripcion, precio, precio_kg, precio_costo, porcentaje_ganancia, stock, categoria_id, codigo, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

// Eliminar producto
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM productos WHERE id=$1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

// Abrir bolsa
router.post('/:id/abrir-bolsa', async (req, res) => {
  const { id } = req.params;
  try {
    const stockCheck = await pool.query('SELECT stock FROM productos WHERE id = $1', [id]);
    if (stockCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    if (stockCheck.rows[0].stock <= 0) {
      return res.status(400).json({ error: 'No hay stock suficiente' });
    }

    // Descontar stock
    await pool.query('UPDATE productos SET stock = stock - 1 WHERE id = $1', [id]);

    // Insertar en bolsas_abiertas
    const result = await pool.query(
      'INSERT INTO bolsas_abiertas (producto_id) VALUES ($1) RETURNING *',
      [id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al abrir bolsa:', error);
    res.status(500).json({ error: 'Error al abrir bolsa' });
  }
});

export default router;
