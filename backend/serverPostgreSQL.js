const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { pool, testConnection } = require('./config/database');
const { initDatabase } = require('./initPostgreSQL');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de logging personalizado
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n🕐 [${timestamp}] ${req.method} ${req.path}`);
  console.log(`📤 Headers:`, req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`📦 Body:`, JSON.stringify(req.body, null, 2));
  }
  
  // Interceptar la respuesta para loggear
  const originalSend = res.send;
  res.send = function(data) {
    console.log(`📥 Response Status: ${res.statusCode}`);
    if (data) {
      try {
        const parsedData = JSON.parse(data);
        console.log(`📥 Response Data:`, JSON.stringify(parsedData, null, 2));
      } catch {
        console.log(`📥 Response Data:`, data);
      }
    }
    console.log(`✅ Request completed\n`);
    originalSend.call(this, data);
  };
  
  next();
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inicializar base de datos PostgreSQL
async function initializeApp() {
  try {
    console.log('🚀 Iniciando servidor con PostgreSQL...');
    
    // Probar conexión
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ No se pudo conectar a PostgreSQL');
      process.exit(1);
    }
    
    // Inicializar tablas
    await initDatabase();
    
    console.log('✅ Base de datos PostgreSQL inicializada correctamente');
  } catch (error) {
    console.error('❌ Error inicializando la aplicación:', error);
    process.exit(1);
  }
}

// Inicializar la aplicación
initializeApp();

// ==================== ENDPOINTS ====================

// GET - Obtener todas las categorías
app.get('/api/categorias', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM categorias ORDER BY nombre');
    client.release();
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST - Crear nueva categoría
app.post('/api/categorias', async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }
    
    const client = await pool.connect();
    const result = await client.query(
      'INSERT INTO categorias (nombre, descripcion) VALUES ($1, $2) RETURNING *',
      [nombre, descripcion]
    );
    client.release();
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear categoría:', error);
    if (error.code === '23505') { // Unique violation
      res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// PUT - Actualizar categoría
app.put('/api/categorias/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;
    
    const client = await pool.connect();
    const result = await client.query(
      'UPDATE categorias SET nombre = $1, descripcion = $2 WHERE id = $3 RETURNING *',
      [nombre, descripcion, id]
    );
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Eliminar categoría
app.delete('/api/categorias/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const client = await pool.connect();
    const result = await client.query('DELETE FROM categorias WHERE id = $1 RETURNING *', [id]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }
    
    res.json({ message: 'Categoría eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET - Obtener todos los productos
app.get('/api/productos', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT p.*, c.nombre as categoria_nombre 
      FROM productos p 
      LEFT JOIN categorias c ON p.categoria_id = c.id 
      ORDER BY p.nombre
    `);
    client.release();
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST - Crear nuevo producto
app.post('/api/productos', async (req, res) => {
  try {
    const { nombre, descripcion, precio, stock, categoria_id, codigo } = req.body;
    
    if (!nombre || !precio) {
      return res.status(400).json({ error: 'Nombre y precio son obligatorios' });
    }
    
    const client = await pool.connect();
    const result = await client.query(`
      INSERT INTO productos (nombre, descripcion, precio, stock, categoria_id, codigo) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *
    `, [nombre, descripcion, precio, stock || 0, categoria_id, codigo]);
    client.release();
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear producto:', error);
    if (error.code === '23505') { // Unique violation
      res.status(400).json({ error: 'Ya existe un producto con ese código' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// PUT - Actualizar producto
app.put('/api/productos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, stock, categoria_id, codigo } = req.body;
    
    const client = await pool.connect();
    const result = await client.query(`
      UPDATE productos 
      SET nombre = $1, descripcion = $2, precio = $3, stock = $4, categoria_id = $5, codigo = $6, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $7 
      RETURNING *
    `, [nombre, descripcion, precio, stock, categoria_id, codigo, id]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Eliminar producto
app.delete('/api/productos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const client = await pool.connect();
    const result = await client.query('DELETE FROM productos WHERE id = $1 RETURNING *', [id]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST - Abrir bolsa de producto
app.post('/api/productos/:id/abrir-bolsa', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Actualizar stock
      await client.query('UPDATE productos SET stock = stock - 1 WHERE id = $1 AND stock > 0', [id]);
      
      // Crear bolsa abierta
      await client.query('INSERT INTO bolsas_abiertas (producto_id) VALUES ($1)', [id]);
      
      await client.query('COMMIT');
      res.json({ message: 'Bolsa abierta correctamente' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al abrir bolsa:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET - Obtener todas las bolsas abiertas
app.get('/api/bolsas-abiertas', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT ba.*, p.nombre as producto_nombre, p.stock as stock_actual
      FROM bolsas_abiertas ba
      JOIN productos p ON ba.producto_id = p.id
      WHERE ba.estado = 'abierta'
      ORDER BY ba.fecha_apertura DESC
    `);
    client.release();
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener bolsas abiertas:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Cerrar bolsa abierta
app.delete('/api/bolsas-abiertas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Marcar bolsa como cerrada
      await client.query('UPDATE bolsas_abiertas SET estado = $1 WHERE id = $2', ['cerrada', id]);
      
      await client.query('COMMIT');
      res.json({ message: 'Bolsa cerrada correctamente' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al cerrar bolsa:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET - Obtener estadísticas
app.get('/api/stats', async (req, res) => {
  try {
    const client = await pool.connect();
    
    // Total de productos
    const productosResult = await client.query('SELECT COUNT(*) as total FROM productos');
    const totalProductos = parseInt(productosResult.rows[0].total);
    
    // Productos con bajo stock
    const bajoStockResult = await client.query('SELECT COUNT(*) as total FROM productos WHERE stock < 10');
    const productosBajoStock = parseInt(bajoStockResult.rows[0].total);
    
    // Total de ventas (sin deudas)
    const ventasResult = await client.query('SELECT COUNT(*) as total, COALESCE(SUM(total), 0) as monto FROM ventas WHERE estado != $1', ['adeuda']);
    const totalVentas = parseInt(ventasResult.rows[0].total);
    const totalVentasMonto = parseFloat(ventasResult.rows[0].monto);
    
    // Total de ventas con deudas
    const ventasConDeudasResult = await client.query('SELECT COUNT(*) as total, COALESCE(SUM(total), 0) as monto FROM ventas');
    const totalVentasConDeudas = parseInt(ventasConDeudasResult.rows[0].total);
    const totalVentasConDeudasMonto = parseFloat(ventasConDeudasResult.rows[0].monto);
    
    // Total de deudas
    const deudasResult = await client.query('SELECT COUNT(*) as total, COALESCE(SUM(total), 0) as monto FROM ventas WHERE estado = $1', ['adeuda']);
    const totalDeudas = parseInt(deudasResult.rows[0].total);
    const totalDeudasMonto = parseFloat(deudasResult.rows[0].monto);
    
    // Total de compras
    const comprasResult = await client.query('SELECT COUNT(*) as total, COALESCE(SUM(total), 0) as monto FROM compras');
    const totalCompras = parseInt(comprasResult.rows[0].total);
    const totalComprasMonto = parseFloat(comprasResult.rows[0].monto);
    
    // Bolsas abiertas
    const bolsasResult = await client.query('SELECT COUNT(*) as total FROM bolsas_abiertas WHERE estado = $1', ['abierta']);
    const bolsasAbiertas = parseInt(bolsasResult.rows[0].total);
    
    client.release();
    
    const stats = {
      total_productos: totalProductos,
      productos_bajo_stock: productosBajoStock,
      total_ventas: totalVentas,
      total_ventas_monto: totalVentasMonto,
      total_ventas_con_deudas: totalVentasConDeudas,
      total_ventas_con_deudas_monto: totalVentasConDeudasMonto,
      total_deudas: totalDeudas,
      total_deudas_monto: totalDeudasMonto,
      total_compras: totalCompras,
      total_compras_monto: totalComprasMonto,
      bolsas_abiertas: bolsasAbiertas
    };
    
    console.log('📊 Estadísticas calculadas:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: error.message });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 API disponible en http://localhost:${PORT}/api`);
});

// Manejo de cierre graceful
process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando servidor...');
  const { closePool } = require('./config/database');
  await closePool();
  process.exit(0);
}); 