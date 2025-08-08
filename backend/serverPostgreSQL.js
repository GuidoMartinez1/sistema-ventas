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
    const { nombre, descripcion, precio, precio_costo, porcentaje_ganancia, stock, categoria_id, codigo } = req.body;
    
    console.log('➕ Creando nuevo producto...');
    console.log(`📝 Datos del producto: ${nombre} - $${precio}`);
    
    if (!nombre || !precio) {
      console.error('❌ Validación fallida: Nombre y precio son requeridos');
      return res.status(400).json({ error: 'Nombre y precio son requeridos' });
    }

    // Generar código automáticamente si no se proporciona
    let codigoGenerado = codigo;
    if (!codigo || codigo.trim() === '') {
      const client = await pool.connect();
      try {
        // Obtener el último ID para generar un código único
        const lastIdResult = await client.query('SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM productos');
        const nextId = lastIdResult.rows[0].next_id;
        codigoGenerado = `PROD-${String(nextId).padStart(4, '0')}`;
        console.log(`🔢 Código generado automáticamente: ${codigoGenerado}`);
      } catch (error) {
        console.error('Error generando código:', error);
        codigoGenerado = `PROD-${Date.now()}`;
      } finally {
        client.release();
      }
    }

    // Calcular porcentaje de ganancia automáticamente si no se proporciona
    let porcentajeCalculado = porcentaje_ganancia;
    if (precio_costo && precio_costo > 0 && !porcentaje_ganancia) {
      porcentajeCalculado = Math.round(((precio - precio_costo) / precio_costo) * 100 * 100) / 100;
      console.log(`🧮 Porcentaje de ganancia calculado automáticamente: ${porcentajeCalculado.toFixed(2)}%`);
    } else if (!porcentaje_ganancia) {
      porcentajeCalculado = 30; // Valor por defecto
      console.log(`📊 Usando porcentaje de ganancia por defecto: ${porcentajeCalculado}%`);
    } else {
      porcentajeCalculado = Math.round(porcentaje_ganancia * 100) / 100;
    }
    
    const client = await pool.connect();
    const result = await client.query(`
      INSERT INTO productos (nombre, descripcion, precio, precio_costo, porcentaje_ganancia, stock, categoria_id, codigo) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *
    `, [nombre, descripcion, precio, precio_costo || 0, porcentajeCalculado, stock || 0, categoria_id, codigoGenerado]);
    client.release();
    
    console.log(`✅ Producto creado exitosamente con ID: ${result.rows[0].id}`);
    console.log(`🔢 Código asignado: ${codigoGenerado}`);
    console.log(`💰 Margen de ganancia: ${porcentajeCalculado.toFixed(2)}%`);
    
    res.status(201).json({ 
      ...result.rows[0],
      message: 'Producto creado exitosamente',
      porcentaje_ganancia: porcentajeCalculado
    });
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
    const { nombre, descripcion, precio, precio_costo, porcentaje_ganancia, stock, categoria_id, codigo } = req.body;

    console.log(`✏️ Actualizando producto con ID: ${id}`);
    console.log(`📝 Nuevos datos: ${nombre} - $${precio}`);

    // Calcular porcentaje de ganancia automáticamente si no se proporciona
    let porcentajeCalculado = porcentaje_ganancia;
    if (precio_costo && precio_costo > 0 && !porcentaje_ganancia) {
      porcentajeCalculado = Math.round(((precio - precio_costo) / precio_costo) * 100 * 100) / 100;
      console.log(`🧮 Porcentaje de ganancia calculado automáticamente: ${porcentajeCalculado.toFixed(2)}%`);
    } else if (!porcentaje_ganancia) {
      porcentajeCalculado = 30; // Valor por defecto
      console.log(`📊 Usando porcentaje de ganancia por defecto: ${porcentajeCalculado}%`);
    } else {
      porcentajeCalculado = Math.round(porcentaje_ganancia * 100) / 100;
    }
    
    const client = await pool.connect();
    const result = await client.query(`
      UPDATE productos 
      SET nombre = $1, descripcion = $2, precio = $3, precio_costo = $4, porcentaje_ganancia = $5, stock = $6, categoria_id = $7, codigo = $8, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $9 
      RETURNING *
    `, [nombre, descripcion, precio, precio_costo || 0, porcentajeCalculado, stock, categoria_id, codigo, id]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    console.log(`✅ Producto actualizado exitosamente. Filas afectadas: ${result.rows.length}`);
    console.log(`💰 Margen de ganancia actualizado: ${porcentajeCalculado.toFixed(2)}%`);
    
    res.json({ 
      ...result.rows[0],
      message: 'Producto actualizado exitosamente',
      porcentaje_ganancia: porcentajeCalculado
    });
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

// GET - Productos con bajo stock
app.get('/api/productos/bajo-stock', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM productos WHERE stock <= 4 ORDER BY stock ASC');
    client.release();
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener productos con bajo stock:', error);
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
      
      // Verificar stock
      const stockResult = await client.query('SELECT nombre, stock FROM productos WHERE id = $1', [id]);
      if (stockResult.rows.length === 0) {
        throw new Error('Producto no encontrado');
      }
      
      const producto = stockResult.rows[0];
      if (producto.stock <= 0) {
        throw new Error('No hay stock disponible para abrir');
      }
      
      // Actualizar stock
      await client.query('UPDATE productos SET stock = stock - 1 WHERE id = $1 AND stock > 0', [id]);
      
      // Crear bolsa abierta
      const bolsaResult = await client.query('INSERT INTO bolsas_abiertas (producto_id) VALUES ($1) RETURNING id', [id]);
      
      await client.query('COMMIT');
      res.json({ 
        message: 'Bolsa abierta correctamente',
        producto: producto.nombre,
        stock_restante: producto.stock - 1,
        bolsa_id: bolsaResult.rows[0].id
      });
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
      const result = await client.query('UPDATE bolsas_abiertas SET estado = $1 WHERE id = $2 AND estado = $3 RETURNING *', ['cerrada', id, 'abierta']);
      
      if (result.rows.length === 0) {
        throw new Error('Bolsa no encontrada o ya cerrada');
      }
      
      await client.query('COMMIT');
      res.json({ message: 'Bolsa cerrada correctamente', bolsa_id: id });
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

// GET - Obtener todos los clientes
app.get('/api/clientes', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM clientes ORDER BY nombre');
    client.release();
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST - Crear nuevo cliente
app.post('/api/clientes', async (req, res) => {
  try {
    const { nombre, email, telefono, direccion } = req.body;
    
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }
    
    const client = await pool.connect();
    const result = await client.query(`
      INSERT INTO clientes (nombre, email, telefono, direccion) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *
    `, [nombre, email, telefono, direccion]);
    client.release();
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT - Actualizar cliente
app.put('/api/clientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, telefono, direccion } = req.body;
    
    const client = await pool.connect();
    const result = await client.query(`
      UPDATE clientes SET nombre = $1, email = $2, telefono = $3, direccion = $4 WHERE id = $5 RETURNING *
    `, [nombre, email, telefono, direccion, id]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Eliminar cliente
app.delete('/api/clientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const client = await pool.connect();
    const result = await client.query('DELETE FROM clientes WHERE id = $1 RETURNING *', [id]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    
    res.json({ message: 'Cliente eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET - Obtener todos los proveedores
app.get('/api/proveedores', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM proveedores ORDER BY nombre');
    client.release();
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST - Crear nuevo proveedor
app.post('/api/proveedores', async (req, res) => {
  try {
    const { nombre, email, telefono, direccion } = req.body;
    
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }
    
    const client = await pool.connect();
    const result = await client.query(`
      INSERT INTO proveedores (nombre, email, telefono, direccion) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *
    `, [nombre, email, telefono, direccion]);
    client.release();
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT - Actualizar proveedor
app.put('/api/proveedores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, telefono, direccion } = req.body;
    
    const client = await pool.connect();
    const result = await client.query(`
      UPDATE proveedores SET nombre = $1, email = $2, telefono = $3, direccion = $4 WHERE id = $5 RETURNING *
    `, [nombre, email, telefono, direccion, id]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Eliminar proveedor
app.delete('/api/proveedores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const client = await pool.connect();
    const result = await client.query('DELETE FROM proveedores WHERE id = $1 RETURNING *', [id]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }
    
    res.json({ message: 'Proveedor eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar proveedor:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET - Obtener todas las compras
app.get('/api/compras', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT c.*, p.nombre as proveedor_nombre 
      FROM compras c 
      LEFT JOIN proveedores p ON c.proveedor_id = p.id 
      ORDER BY c.fecha DESC
    `);
    client.release();
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener compras:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST - Crear nueva compra
app.post('/api/compras', async (req, res) => {
  try {
    const { proveedor_id, productos, total } = req.body;
    
    console.log('📦 Procesando nueva compra...');
    console.log(`🏢 Proveedor ID: ${proveedor_id}`);
    console.log(`📦 Productos: ${productos.length} items`);
    console.log(`💵 Total: $${total}`);
    
    if (!proveedor_id) {
      return res.status(400).json({ error: 'Proveedor es requerido' });
    }

    if (!productos || productos.length === 0) {
      return res.status(400).json({ error: 'Productos son requeridos' });
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Crear compra
      const compraResult = await client.query(`
        INSERT INTO compras (proveedor_id, total) VALUES ($1, $2) RETURNING id
      `, [proveedor_id, total]);
      
      const compra_id = compraResult.rows[0].id;
      console.log(`✅ Compra creada con ID: ${compra_id}`);
      
      // Procesar productos
      for (let i = 0; i < productos.length; i++) {
        const producto = productos[i];
        
        let producto_id = producto.producto_id;
        
        // Si no hay producto_id, crear un producto automáticamente
        if (!producto_id || producto_id === null || producto_id === undefined) {
          console.log(`🆕 Creando producto automáticamente para item ${i + 1}...`);
          
          // Generar código único
          const lastIdResult = await client.query('SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM productos');
          const nextId = lastIdResult.rows[0].next_id;
          const codigoGenerado = `PROD-${String(nextId).padStart(4, '0')}`;
          
          // Crear producto con datos básicos
          const nuevoProductoResult = await client.query(`
            INSERT INTO productos (nombre, descripcion, precio, precio_costo, porcentaje_ganancia, stock, codigo) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) 
            RETURNING id
          `, [
            producto.nombre || `Producto ${codigoGenerado}`,
            producto.descripcion || 'Producto creado automáticamente',
            producto.precio_unitario * 1.3, // Precio de venta 30% más que costo
            producto.precio_unitario,
            30, // Margen por defecto
            0, // Stock inicial 0
            codigoGenerado
          ]);
          
          producto_id = nuevoProductoResult.rows[0].id;
          console.log(`✅ Producto creado automáticamente con ID: ${producto_id}, código: ${codigoGenerado}`);
        }
        
        // Insertar detalle de compra
        await client.query(`
          INSERT INTO detalles_compra (compra_id, producto_id, cantidad, precio_unitario, subtotal) 
          VALUES ($1, $2, $3, $4, $5)
        `, [compra_id, producto_id, producto.cantidad, producto.precio_unitario, producto.subtotal]);
        
        // Actualizar stock del producto
        await client.query(`
          UPDATE productos SET stock = stock + $1 WHERE id = $2
        `, [producto.cantidad, producto_id]);
        
        // Actualizar precio de costo y recalcular margen de ganancia
        const productoResult = await client.query('SELECT precio FROM productos WHERE id = $1', [producto_id]);
        if (productoResult.rows.length > 0 && productoResult.rows[0].precio > 0 && producto.precio_unitario > 0) {
          const nuevoMargen = ((productoResult.rows[0].precio - producto.precio_unitario) / producto.precio_unitario) * 100;
          await client.query(`
            UPDATE productos SET precio_costo = $1, porcentaje_ganancia = $2 WHERE id = $3
          `, [producto.precio_unitario, nuevoMargen, producto_id]);
          console.log(`✅ Margen de ganancia actualizado: ${nuevoMargen.toFixed(2)}%`);
        }
        
        console.log(`✅ Producto ${producto_id} actualizado: +${producto.cantidad} stock, precio_costo: $${producto.precio_unitario}`);
      }
      
      await client.query('COMMIT');
      console.log(`🎉 Compra completada exitosamente! ID: ${compra_id}, Total: $${total}`);
      res.json({ id: compra_id, message: 'Compra creada exitosamente' });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al crear compra:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET - Obtener compra por ID con detalles
app.get('/api/compras/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const client = await pool.connect();
    
    // Obtener compra
    const compraResult = await client.query(`
      SELECT c.*, p.nombre as proveedor_nombre 
      FROM compras c 
      LEFT JOIN proveedores p ON c.proveedor_id = p.id 
      WHERE c.id = $1
    `, [id]);
    
    if (compraResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: 'Compra no encontrada' });
    }
    
    // Obtener detalles
    const detallesResult = await client.query(`
      SELECT dc.*, p.nombre as producto_nombre 
      FROM detalles_compra dc 
      JOIN productos p ON dc.producto_id = p.id 
      WHERE dc.compra_id = $1
    `, [id]);
    
    client.release();
    
    res.json({ ...compraResult.rows[0], detalles: detallesResult.rows });
  } catch (error) {
    console.error('Error al obtener compra:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET - Obtener todas las ventas
app.get('/api/ventas', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT v.*, c.nombre as cliente_nombre 
      FROM ventas v 
      LEFT JOIN clientes c ON v.cliente_id = c.id 
      ORDER BY v.fecha DESC
    `);
    client.release();
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST - Crear nueva venta
app.post('/api/ventas', async (req, res) => {
  try {
    const { cliente_id, productos, total, estado = 'completada', metodo_pago = 'efectivo' } = req.body;
    
    console.log('💰 Procesando nueva venta...');
    console.log(`👤 Cliente ID: ${cliente_id}`);
    console.log(`📦 Productos: ${productos ? productos.length : 0} items`);
    console.log(`💵 Total: $${total}`);
    console.log(`📊 Estado: ${estado}`);
    console.log(`💳 Método de pago: ${metodo_pago}`);
    
    // Validaciones
    if (!productos || productos.length === 0) {
      if (!total || total <= 0) {
        return res.status(400).json({ error: 'Total es requerido para ventas sin productos' });
      }
    } else {
      for (let i = 0; i < productos.length; i++) {
        const producto = productos[i];
        if (!producto.producto_id || !producto.cantidad || !producto.precio_unitario || !producto.subtotal) {
          return res.status(400).json({ 
            error: `Producto ${i + 1} tiene datos incompletos. Verifique ID, cantidad, precio y subtotal.` 
          });
        }
      }
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Crear venta
      const ventaResult = await client.query(`
        INSERT INTO ventas (cliente_id, total, estado, metodo_pago) VALUES ($1, $2, $3, $4) RETURNING id
      `, [cliente_id, total, estado, metodo_pago]);
      
      const venta_id = ventaResult.rows[0].id;
      console.log(`✅ Venta creada con ID: ${venta_id}, estado: ${estado}, método: ${metodo_pago}`);
      
      // Si no hay productos, solo confirmar la venta
      if (!productos || productos.length === 0) {
        await client.query('COMMIT');
        console.log(`🎉 Venta sin productos completada exitosamente! ID: ${venta_id}, Total: $${total}`);
        res.json({ id: venta_id, message: 'Venta creada exitosamente', estado: estado, metodo_pago: metodo_pago });
        return;
      }
      
      // Procesar productos
      for (let i = 0; i < productos.length; i++) {
        const producto = productos[i];
        
        // Insertar detalle de venta
        await client.query(`
          INSERT INTO detalles_venta (venta_id, producto_id, cantidad, precio_unitario, subtotal) 
          VALUES ($1, $2, $3, $4, $5)
        `, [venta_id, producto.producto_id, producto.cantidad, producto.precio_unitario, producto.subtotal]);
        
        // Descontar stock
        await client.query(`
          UPDATE productos SET stock = stock - $1 WHERE id = $2
        `, [producto.cantidad, producto.producto_id]);
        
        console.log(`✅ Producto ${producto.producto_id} procesado: -${producto.cantidad} stock`);
      }
      
      await client.query('COMMIT');
      console.log(`🎉 Venta completada exitosamente! ID: ${venta_id}, Total: $${total}`);
      res.json({ id: venta_id, message: 'Venta creada exitosamente', estado: estado, metodo_pago: metodo_pago });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al crear venta:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET - Obtener venta por ID con detalles
app.get('/api/ventas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const client = await pool.connect();
    
    // Obtener venta
    const ventaResult = await client.query(`
      SELECT v.*, c.nombre as cliente_nombre 
      FROM ventas v 
      LEFT JOIN clientes c ON v.cliente_id = c.id 
      WHERE v.id = $1
    `, [id]);
    
    if (ventaResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: 'Venta no encontrada' });
    }
    
    // Obtener detalles
    const detallesResult = await client.query(`
      SELECT dv.*, p.nombre as producto_nombre 
      FROM detalles_venta dv 
      JOIN productos p ON dv.producto_id = p.id 
      WHERE dv.venta_id = $1
    `, [id]);
    
    client.release();
    
    res.json({ ...ventaResult.rows[0], detalles: detallesResult.rows });
  } catch (error) {
    console.error('Error al obtener venta:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET - Obtener deudas
app.get('/api/deudas', async (req, res) => {
  try {
    console.log('💰 Obteniendo lista de deudas...');
    
    const client = await pool.connect();
    
    // Obtener deudas
    const deudasResult = await client.query(`
      SELECT v.*, c.nombre as cliente_nombre, c.telefono, c.direccion
      FROM ventas v 
      LEFT JOIN clientes c ON v.cliente_id = c.id 
      WHERE v.estado = 'adeuda'
      ORDER BY v.fecha DESC
    `);
    
    // Para cada deuda, obtener los detalles
    const deudasConDetalles = await Promise.all(
      deudasResult.rows.map(async (deuda) => {
        const detallesResult = await client.query(`
          SELECT dv.*, p.nombre as producto_nombre 
          FROM detalles_venta dv 
          JOIN productos p ON dv.producto_id = p.id 
          WHERE dv.venta_id = $1
        `, [deuda.id]);
        
        return { ...deuda, detalles: detallesResult.rows };
      })
    );
    
    client.release();
    
    console.log(`✅ Deudas obtenidas: ${deudasConDetalles.length} deudas encontradas`);
    res.json(deudasConDetalles);
  } catch (error) {
    console.error('Error al obtener deudas:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT - Marcar deuda como pagada
app.put('/api/deudas/:id/pagar', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`💰 Marcando deuda ${id} como pagada...`);
    
    const client = await pool.connect();
    const result = await client.query(`
      UPDATE ventas SET estado = $1 WHERE id = $2 AND estado = $3 RETURNING *
    `, ['completada', id, 'adeuda']);
    client.release();
    
    if (result.rows.length === 0) {
      console.log(`⚠️ Deuda ${id} no encontrada o ya no está en estado 'adeuda'`);
      return res.status(404).json({ error: 'Deuda no encontrada o ya pagada' });
    }
    
    console.log(`✅ Deuda ${id} marcada como pagada exitosamente`);
    res.json({ message: 'Deuda marcada como pagada exitosamente' });
  } catch (error) {
    console.error('Error al marcar deuda como pagada:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET - Obtener estadísticas
app.get('/api/stats', async (req, res) => {
  try {
    console.log('📊 Obteniendo estadísticas del sistema...');
    
    const client = await pool.connect();
    
    // Total de productos
    const productosResult = await client.query('SELECT COUNT(*) as total FROM productos');
    const totalProductos = parseInt(productosResult.rows[0].total);
    
    // Productos con bajo stock
    const bajoStockResult = await client.query('SELECT COUNT(*) as total FROM productos WHERE stock < 10');
    const productosBajoStock = parseInt(bajoStockResult.rows[0].total);
    
    // Total de clientes
    const clientesResult = await client.query('SELECT COUNT(*) as total FROM clientes');
    const totalClientes = parseInt(clientesResult.rows[0].total);
    
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
      total_clientes: totalClientes,
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
    
    console.log('📈 Estadísticas obtenidas:');
    console.log(`   - Productos: ${stats.total_productos}`);
    console.log(`   - Clientes: ${stats.total_clientes}`);
    console.log(`   - Ventas (sin deudas): ${stats.total_ventas} ($${stats.total_ventas_monto})`);
    console.log(`   - Ventas (con deudas): ${stats.total_ventas_con_deudas} ($${stats.total_ventas_con_deudas_monto})`);
    console.log(`   - Compras: ${stats.total_compras} ($${stats.total_compras_monto})`);
    console.log(`   - Deudas: ${stats.total_deudas} ($${stats.total_deudas_monto})`);
    console.log(`   - Bolsas abiertas: ${stats.bolsas_abiertas}`);
    
    res.json(stats);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST - Calcular porcentaje de ganancia
app.post('/api/calcular-ganancia', async (req, res) => {
  try {
    const { precio_venta, precio_costo } = req.body;
    
    console.log('🧮 Calculando porcentaje de ganancia...');
    console.log(`💰 Precio de venta: $${precio_venta}`);
    console.log(`💸 Precio de costo: $${precio_costo}`);
    
    if (!precio_venta || !precio_costo) {
      return res.status(400).json({ error: 'Precio de venta y costo son requeridos' });
    }
    
    if (precio_costo <= 0) {
      return res.status(400).json({ error: 'Precio de costo debe ser mayor a 0' });
    }
    
    if (precio_venta <= precio_costo) {
      return res.status(400).json({ error: 'Precio de venta debe ser mayor al costo' });
    }
    
    const porcentajeGanancia = ((precio_venta - precio_costo) / precio_costo) * 100;
    const gananciaNeta = precio_venta - precio_costo;
    
    console.log(`✅ Porcentaje de ganancia calculado: ${porcentajeGanancia.toFixed(2)}%`);
    console.log(`💰 Ganancia neta: $${gananciaNeta.toFixed(2)}`);
    
    res.json({
      porcentaje_ganancia: parseFloat(porcentajeGanancia.toFixed(2)),
      ganancia_neta: parseFloat(gananciaNeta.toFixed(2)),
      precio_venta: parseFloat(precio_venta),
      precio_costo: parseFloat(precio_costo)
    });
  } catch (error) {
    console.error('Error al calcular ganancia:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Limpiar ventas huérfanas
app.delete('/api/ventas/limpiar-huérfanas', async (req, res) => {
  try {
    console.log('🧹 Limpiando ventas huérfanas...');
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Encontrar ventas sin detalles
      const ventasHuérfanasResult = await client.query(`
        SELECT v.id, v.total, v.fecha 
        FROM ventas v 
        LEFT JOIN detalles_venta dv ON v.id = dv.venta_id 
        WHERE dv.venta_id IS NULL
      `);
      
      if (ventasHuérfanasResult.rows.length === 0) {
        await client.query('ROLLBACK');
        console.log('✅ No se encontraron ventas huérfanas');
        return res.json({ message: 'No se encontraron ventas huérfanas' });
      }
      
      console.log(`🗑️ Encontradas ${ventasHuérfanasResult.rows.length} ventas huérfanas:`);
      ventasHuérfanasResult.rows.forEach(venta => {
        console.log(`   - Venta ID: ${venta.id}, Total: $${venta.total}, Fecha: ${venta.fecha}`);
      });
      
      // Eliminar ventas huérfanas
      const ids = ventasHuérfanasResult.rows.map(v => v.id);
      const result = await client.query(`DELETE FROM ventas WHERE id = ANY($1)`, [ids]);
      
      await client.query('COMMIT');
      
      console.log(`✅ ${result.rowCount} ventas huérfanas eliminadas exitosamente`);
      res.json({ 
        message: `${result.rowCount} ventas huérfanas eliminadas`,
        ventas_eliminadas: result.rowCount,
        detalles: ventasHuérfanasResult.rows
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al limpiar ventas huérfanas:', error);
    res.status(500).json({ error: error.message });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('\n🚀 ==========================================');
  console.log(`🚀 Servidor de Sistema de Ventas iniciado`);
  console.log(`🚀 Puerto: ${PORT}`);
  console.log(`🚀 URL: http://localhost:${PORT}`);
  console.log(`🚀 Base de datos: PostgreSQL`);
  console.log('🚀 ==========================================\n');
  console.log('📝 Logs de actividad habilitados');
  console.log('🔍 Monitoreando todas las peticiones...\n');
});

// Manejo de cierre graceful
process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando servidor...');
  const { closePool } = require('./config/database');
  await closePool();
  process.exit(0);
}); 