import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Obtener todos los productos
router.get('/', async (req, res) => {
    try {
        // 💡 Seleccionamos también la nueva columna 'kilos'
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
    let {
        nombre,
        descripcion,
        precio,
        precio_kg,
        precio_costo,
        porcentaje_ganancia,
        stock,
        categoria_id,
        codigo,
        kilos
    } = req.body;

    try {
        // --- Sanitización de datos para PostgreSQL ---

        const precioFinal = precio || precio === 0 ? precio : null;
        const precioKgFinal = precio_kg || precio_kg === 0 ? precio_kg : null;
        const precioCostoFinal = precio_costo || precio_costo === 0 ? precio_costo : null;
        const porcentajeGananciaFinal = porcentaje_ganancia || porcentaje_ganancia === 0 ? porcentaje_ganancia : null;

        // 💡 Sanitización para KILOS
        const kilosFinal = kilos || kilos === 0 ? kilos : null;

        const stockFinal = stock || stock === 0 ? stock : 0;
        const categoriaIdFinal = categoria_id ? parseInt(categoria_id) : null;
        const descripcionFinal = descripcion || null;

        let codigoFinal = codigo;
        if (!codigoFinal || codigoFinal.trim() === '') {
            // Generar código único automáticamente
            codigoFinal = `P-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        }
        // --- Fin de Sanitización ---

        const result = await pool.query(
            // Añadimos 'kilos' al INSERT (total 10 campos)
            `INSERT INTO productos
             (nombre, descripcion, precio, precio_kg, precio_costo, porcentaje_ganancia, stock, categoria_id, codigo, kilos)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                 RETURNING *`,
            [
                nombre,
                descripcionFinal,
                precioFinal,
                precioKgFinal,
                precioCostoFinal,
                porcentajeGananciaFinal,
                stockFinal,
                categoriaIdFinal,
                codigoFinal,
                kilosFinal
            ]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al crear producto:', error);
        console.error('Error detallado de DB:', error.message);
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
        codigo,
        // 💡 NUEVO CAMPO
        kilos
    } = req.body;

    try {
        // 💡 El valor de kilos viene directamente del req.body (si no se envía, será undefined/null y se actualizará a eso)
        const result = await pool.query(
            // Añadimos 'kilos' al UPDATE (total 11 parámetros, siendo $11 el id)
            `UPDATE productos
             SET nombre=$1, descripcion=$2, precio=$3, precio_kg=$4, precio_costo=$5, porcentaje_ganancia=$6, stock=$7, categoria_id=$8, codigo=$9, kilos=$10, updated_at=NOW()
             WHERE id=$11
                 RETURNING *`,
            [nombre, descripcion, precio, precio_kg, precio_costo, porcentaje_ganancia, stock, categoria_id, codigo, kilos, id] // 💡 NUEVO VALOR: kilos es $10
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