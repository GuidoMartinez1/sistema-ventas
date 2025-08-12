import express from 'express';
import pool from '../db.js';

const router = express.Router();

/**
 * Obtener todos los productos
 */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM productos ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json({ error: 'Error obteniendo productos' });
  }
});

/**
 * Obtener productos con bajo stock
 */
router.get('/bajo-stock', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM productos WHERE stock < 5 ORDER BY stock ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo productos con bajo stock:', error);
    res.status(500).json({ error: 'Error obteniendo productos con bajo stock' });
  }
});

/**
 * Obtener producto por ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM productos WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error obteniendo producto:', error);
    res.status(500).json({ error: 'Error obteniendo producto' });
  }
});

/**
 * Crear producto
 */
router.post('/', async (req, res) => {
  try {
    let { nombre, descripcion, precio, precio_costo, porcentaje_ganancia, stock, categoria_id, codigo } = req.body;

    // Si no hay código, lo generamos
    if (!codigo) {
      const resultSeq = await pool.query(`SELECT nextval('productos_id_seq') AS next_id`);
      const nextId = resultSeq.rows[0].next_id;
      codigo = `P${String(nextId).padStart(6, '0')}`;
    }

    const query = `
      INSERT INTO productos
        (nombre, descripcion, precio, precio_costo, porcentaje_ganancia, stock, categoria_id, codigo)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;

    const values = [
      nombre,
      descripcion || '',
      precio,
      precio_costo || 0,
      porcentaje_ganancia || 30,
      stock || 0,
      categoria_id || null,
      codigo
    ];

    const newProduct = await pool.query(query, values);
    res.json(newProduct.rows[0]);
  } catch (error) {
    console.error('Error creando producto:', error);
    res.status(500).json({ error: 'Error creando producto' });
  }
});

/**
 * Actualizar producto
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, precio_costo, porcentaje_ganancia, stock, categoria_id, codigo } = req.body;

    const query = `
      UPDATE productos
      SET nombre = $1, descripcion = $2, precio = $3, precio_costo = $4,
          porcentaje_ganancia = $5, stock = $6, categoria_id = $7, codigo = $8,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *;
    `;

    const values = [
      nombre,
      descripcion || '',
      precio,
      precio_costo || 0,
      porcentaje_ganancia || 30,
      stock || 0,
      categoria_id || null,
      codigo,
      id
    ];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error actualizando producto:', error);
    res.status(500).json({ error: 'Error actualizando producto' });
  }
});

/**
 * Eliminar producto
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM productos WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando producto:', error);
    res.status(500).json({ error: 'Error eliminando producto' });
  }
});

export default router;
