const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

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

// Base de datos
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err);
  } else {
    console.log('Conectado a la base de datos SQLite');
    initDatabase();
  }
});

// Inicializar base de datos
function initDatabase() {
  // Tabla de categorías
  db.run(`CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Tabla de productos
  db.run(`CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio REAL NOT NULL,
    precio_costo REAL DEFAULT 0,
    porcentaje_ganancia REAL DEFAULT 30,
    stock INTEGER DEFAULT 0,
    categoria_id INTEGER,
    codigo TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias (id)
  )`);

  // Tabla de clientes
  db.run(`CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT,
    telefono TEXT,
    direccion TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Tabla de ventas
  db.run(`CREATE TABLE IF NOT EXISTS ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER,
    total REAL NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado TEXT DEFAULT 'completada',
    FOREIGN KEY (cliente_id) REFERENCES clientes (id)
  )`);

  // Tabla de detalles de venta
  db.run(`CREATE TABLE IF NOT EXISTS detalles_venta (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venta_id INTEGER,
    producto_id INTEGER,
    cantidad INTEGER NOT NULL,
    precio_unitario REAL NOT NULL,
    subtotal REAL NOT NULL,
    FOREIGN KEY (venta_id) REFERENCES ventas (id),
    FOREIGN KEY (producto_id) REFERENCES productos (id)
  )`);

  console.log('Base de datos inicializada');
}

// Rutas de productos
app.get('/api/productos', (req, res) => {
  console.log('🔍 Obteniendo lista de productos...');
  db.all(`
    SELECT p.*, c.nombre as categoria_nombre 
    FROM productos p 
    LEFT JOIN categorias c ON p.categoria_id = c.id 
    ORDER BY p.nombre
  `, (err, rows) => {
    if (err) {
      console.error('❌ Error al obtener productos:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    console.log(`✅ Productos obtenidos: ${rows.length} productos encontrados`);
    res.json(rows);
  });
});

app.post('/api/productos', (req, res) => {
  const { nombre, descripcion, precio, precio_costo, porcentaje_ganancia, stock, categoria_id, codigo } = req.body;
  
  console.log('➕ Creando nuevo producto...');
  console.log(`📝 Datos del producto: ${nombre} - $${precio}`);
  
  if (!nombre || !precio) {
    console.error('❌ Validación fallida: Nombre y precio son requeridos');
    return res.status(400).json({ error: 'Nombre y precio son requeridos' });
  }

  // Calcular porcentaje de ganancia automáticamente si no se proporciona
  let porcentajeCalculado = porcentaje_ganancia;
  if (precio_costo && precio_costo > 0 && !porcentaje_ganancia) {
    porcentajeCalculado = ((precio - precio_costo) / precio_costo) * 100;
    console.log(`🧮 Porcentaje de ganancia calculado automáticamente: ${porcentajeCalculado.toFixed(2)}%`);
  } else if (!porcentaje_ganancia) {
    porcentajeCalculado = 30; // Valor por defecto
    console.log(`📊 Usando porcentaje de ganancia por defecto: ${porcentajeCalculado}%`);
  }

  db.run(
    'INSERT INTO productos (nombre, descripcion, precio, precio_costo, porcentaje_ganancia, stock, categoria_id, codigo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [nombre, descripcion, precio, precio_costo || 0, porcentajeCalculado, stock || 0, categoria_id, codigo],
    function(err) {
      if (err) {
        console.error('❌ Error al crear producto:', err.message);
        res.status(500).json({ error: err.message });
        return;
      }
      console.log(`✅ Producto creado exitosamente con ID: ${this.lastID}`);
      console.log(`💰 Margen de ganancia: ${porcentajeCalculado.toFixed(2)}%`);
      res.json({ 
        id: this.lastID, 
        message: 'Producto creado exitosamente',
        porcentaje_ganancia: porcentajeCalculado
      });
    }
  );
});

app.put('/api/productos/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, precio_costo, porcentaje_ganancia, stock, categoria_id, codigo } = req.body;

  console.log(`✏️ Actualizando producto con ID: ${id}`);
  console.log(`📝 Nuevos datos: ${nombre} - $${precio}`);

  // Calcular porcentaje de ganancia automáticamente si no se proporciona
  let porcentajeCalculado = porcentaje_ganancia;
  if (precio_costo && precio_costo > 0 && !porcentaje_ganancia) {
    porcentajeCalculado = ((precio - precio_costo) / precio_costo) * 100;
    console.log(`🧮 Porcentaje de ganancia calculado automáticamente: ${porcentajeCalculado.toFixed(2)}%`);
  } else if (!porcentaje_ganancia) {
    porcentajeCalculado = 30; // Valor por defecto
    console.log(`📊 Usando porcentaje de ganancia por defecto: ${porcentajeCalculado}%`);
  }

  db.run(
    'UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, precio_costo = ?, porcentaje_ganancia = ?, stock = ?, categoria_id = ?, codigo = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [nombre, descripcion, precio, precio_costo || 0, porcentajeCalculado, stock, categoria_id, codigo, id],
    function(err) {
      if (err) {
        console.error('❌ Error al actualizar producto:', err.message);
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        console.error(`❌ Producto con ID ${id} no encontrado`);
        return res.status(404).json({ error: 'Producto no encontrado' });
      }
      console.log(`✅ Producto actualizado exitosamente. Filas afectadas: ${this.changes}`);
      console.log(`💰 Margen de ganancia actualizado: ${porcentajeCalculado.toFixed(2)}%`);
      res.json({ 
        message: 'Producto actualizado exitosamente',
        porcentaje_ganancia: porcentajeCalculado
      });
    }
  );
});

app.delete('/api/productos/:id', (req, res) => {
  const { id } = req.params;

  console.log(`🗑️ Eliminando producto con ID: ${id}`);

  db.run('DELETE FROM productos WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('❌ Error al eliminar producto:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      console.error(`❌ Producto con ID ${id} no encontrado`);
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    console.log(`✅ Producto eliminado exitosamente. Filas afectadas: ${this.changes}`);
    res.json({ message: 'Producto eliminado exitosamente' });
  });
});

// Rutas de categorías
app.get('/api/categorias', (req, res) => {
  db.all('SELECT * FROM categorias ORDER BY nombre', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/categorias', (req, res) => {
  const { nombre, descripcion } = req.body;
  
  if (!nombre) {
    return res.status(400).json({ error: 'Nombre es requerido' });
  }

  db.run(
    'INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)',
    [nombre, descripcion],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, message: 'Categoría creada exitosamente' });
    }
  );
});

app.put('/api/categorias/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion } = req.body;

  db.run(
    'UPDATE categorias SET nombre = ?, descripcion = ? WHERE id = ?',
    [nombre, descripcion, id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Categoría no encontrada' });
      }
      res.json({ message: 'Categoría actualizada exitosamente' });
    }
  );
});

app.delete('/api/categorias/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM categorias WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }
    res.json({ message: 'Categoría eliminada exitosamente' });
  });
});

// Rutas de clientes
app.get('/api/clientes', (req, res) => {
  db.all('SELECT * FROM clientes ORDER BY nombre', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/clientes', (req, res) => {
  const { nombre, email, telefono, direccion } = req.body;
  
  if (!nombre) {
    return res.status(400).json({ error: 'Nombre es requerido' });
  }

  db.run(
    'INSERT INTO clientes (nombre, email, telefono, direccion) VALUES (?, ?, ?, ?)',
    [nombre, email, telefono, direccion],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, message: 'Cliente creado exitosamente' });
    }
  );
});

// Rutas de ventas
app.get('/api/ventas', (req, res) => {
  db.all(`
    SELECT v.*, c.nombre as cliente_nombre 
    FROM ventas v 
    LEFT JOIN clientes c ON v.cliente_id = c.id 
    ORDER BY v.fecha DESC
  `, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/ventas', (req, res) => {
  const { cliente_id, productos, total } = req.body;
  
  console.log('💰 Procesando nueva venta...');
  console.log(`👤 Cliente ID: ${cliente_id}`);
  console.log(`📦 Productos: ${productos.length} items`);
  console.log(`💵 Total: $${total}`);
  console.log('📋 Detalle de productos:');
  productos.forEach((prod, index) => {
    console.log(`   ${index + 1}. ${prod.producto_nombre || 'Sin nombre'} - Cantidad: ${prod.cantidad} - Precio: $${prod.precio_unitario} - Subtotal: $${prod.subtotal}`);
  });
  
  // Validaciones mejoradas
  if (!productos || productos.length === 0) {
    console.error('❌ Validación fallida: Productos son requeridos');
    return res.status(400).json({ error: 'Productos son requeridos' });
  }

  // Validar que todos los productos tengan datos válidos
  for (let i = 0; i < productos.length; i++) {
    const producto = productos[i];
    if (!producto.producto_id || !producto.cantidad || !producto.precio_unitario || !producto.subtotal) {
      console.error(`❌ Validación fallida: Producto ${i + 1} tiene datos incompletos`);
      console.error(`   ID: ${producto.producto_id}, Cantidad: ${producto.cantidad}, Precio: ${producto.precio_unitario}, Subtotal: ${producto.subtotal}`);
      return res.status(400).json({ 
        error: `Producto ${i + 1} tiene datos incompletos. Verifique ID, cantidad, precio y subtotal.` 
      });
    }
  }

  db.serialize(() => {
    console.log('🔄 Iniciando transacción de venta...');
    db.run('BEGIN TRANSACTION');
    
    db.run(
      'INSERT INTO ventas (cliente_id, total) VALUES (?, ?)',
      [cliente_id, total],
      function(err) {
        if (err) {
          console.error('❌ Error al crear venta:', err.message);
          db.run('ROLLBACK', (rollbackErr) => {
            if (rollbackErr) {
              console.error('❌ Error al hacer ROLLBACK:', rollbackErr.message);
            } else {
              console.log('✅ ROLLBACK ejecutado correctamente');
            }
          });
          return res.status(500).json({ error: err.message });
        }
        
        const venta_id = this.lastID;
        console.log(`✅ Venta creada con ID: ${venta_id}`);
        let completed = 0;
        let hasError = false;

        productos.forEach((producto, index) => {
          console.log(`📝 Procesando producto ${index + 1}/${productos.length}: ${producto.producto_nombre || 'Sin nombre'}`);
          
          db.run(
            'INSERT INTO detalles_venta (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)',
            [venta_id, producto.producto_id, producto.cantidad, producto.precio_unitario, producto.subtotal],
            function(err) {
              if (err && !hasError) {
                hasError = true;
                console.error('❌ Error al insertar detalle de venta:', err.message);
                console.log('🔄 Ejecutando ROLLBACK...');
                db.run('ROLLBACK', (rollbackErr) => {
                  if (rollbackErr) {
                    console.error('❌ Error al hacer ROLLBACK:', rollbackErr.message);
                  } else {
                    console.log('✅ ROLLBACK ejecutado correctamente - Venta cancelada');
                  }
                });
                return res.status(500).json({ 
                  error: `Error al procesar producto ${producto.producto_nombre || 'Sin nombre'}: ${err.message}` 
                });
              }
              
              // Actualizar stock solo si no hay error
              if (!hasError) {
                db.run(
                  'UPDATE productos SET stock = stock - ? WHERE id = ?',
                  [producto.cantidad, producto.producto_id],
                  function(err) {
                    if (err) {
                      console.error(`❌ Error al actualizar stock del producto ${producto.producto_id}:`, err.message);
                    } else {
                      console.log(`✅ Stock actualizado para producto ${producto.producto_id}: -${producto.cantidad} unidades`);
                    }
                  }
                );
              }
              
              completed++;
              console.log(`✅ Producto ${index + 1} procesado (${completed}/${productos.length})`);
              
              if (completed === productos.length && !hasError) {
                db.run('COMMIT', (commitErr) => {
                  if (commitErr) {
                    console.error('❌ Error al hacer COMMIT:', commitErr.message);
                    return res.status(500).json({ error: 'Error al confirmar la venta' });
                  } else {
                    console.log(`🎉 Venta completada exitosamente! ID: ${venta_id}, Total: $${total}`);
                    res.json({ id: venta_id, message: 'Venta creada exitosamente' });
                  }
                });
              }
            }
          );
        });
      }
    );
  });
});

// Ruta para obtener detalles de una venta
app.get('/api/ventas/:id', (req, res) => {
  const { id } = req.params;
  
  db.get(`
    SELECT v.*, c.nombre as cliente_nombre 
    FROM ventas v 
    LEFT JOIN clientes c ON v.cliente_id = c.id 
    WHERE v.id = ?
  `, [id], (err, venta) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!venta) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    db.all(`
      SELECT dv.*, p.nombre as producto_nombre 
      FROM detalles_venta dv 
      JOIN productos p ON dv.producto_id = p.id 
      WHERE dv.venta_id = ?
    `, [id], (err, detalles) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ ...venta, detalles });
    });
  });
});

// Ruta para obtener estadísticas
app.get('/api/stats', (req, res) => {
  console.log('📊 Obteniendo estadísticas del sistema...');
  
  db.get('SELECT COUNT(*) as total_productos FROM productos', (err, productos) => {
    if (err) {
      console.error('❌ Error al obtener estadísticas de productos:', err.message);
      return res.status(500).json({ error: err.message });
    }

    db.get('SELECT COUNT(*) as total_clientes FROM clientes', (err, clientes) => {
      if (err) {
        console.error('❌ Error al obtener estadísticas de clientes:', err.message);
        return res.status(500).json({ error: err.message });
      }

      db.get('SELECT COUNT(*) as total_ventas FROM ventas', (err, ventas) => {
        if (err) {
          console.error('❌ Error al obtener estadísticas de ventas:', err.message);
          return res.status(500).json({ error: err.message });
        }

        db.get('SELECT SUM(total) as total_ventas_monto FROM ventas', (err, ventas_monto) => {
          if (err) {
            console.error('❌ Error al obtener monto total de ventas:', err.message);
            return res.status(500).json({ error: err.message });
          }

          const stats = {
            total_productos: productos.total_productos,
            total_clientes: clientes.total_clientes,
            total_ventas: ventas.total_ventas,
            total_ventas_monto: ventas_monto.total_ventas_monto || 0
          };
          
          console.log('📈 Estadísticas obtenidas:');
          console.log(`   - Productos: ${stats.total_productos}`);
          console.log(`   - Clientes: ${stats.total_clientes}`);
          console.log(`   - Ventas: ${stats.total_ventas}`);
          console.log(`   - Monto total: $${stats.total_ventas_monto}`);
          
          res.json(stats);
        });
      });
    });
  });
});

// Ruta para productos con bajo stock
app.get('/api/productos/bajo-stock', (req, res) => {
  db.all('SELECT * FROM productos WHERE stock <= 4 ORDER BY stock ASC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Ruta para calcular porcentaje de ganancia
app.post('/api/calcular-ganancia', (req, res) => {
  const { precio_venta, precio_costo } = req.body;
  
  console.log('🧮 Calculando porcentaje de ganancia...');
  console.log(`💰 Precio de venta: $${precio_venta}`);
  console.log(`💸 Precio de costo: $${precio_costo}`);
  
  if (!precio_venta || !precio_costo) {
    console.error('❌ Validación fallida: Precio de venta y costo son requeridos');
    return res.status(400).json({ error: 'Precio de venta y costo son requeridos' });
  }
  
  if (precio_costo <= 0) {
    console.error('❌ Validación fallida: Precio de costo debe ser mayor a 0');
    return res.status(400).json({ error: 'Precio de costo debe ser mayor a 0' });
  }
  
  if (precio_venta <= precio_costo) {
    console.error('❌ Validación fallida: Precio de venta debe ser mayor al costo');
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
});

// Ruta para limpiar ventas huérfanas (ventas sin detalles)
app.delete('/api/ventas/limpiar-huérfanas', (req, res) => {
  console.log('🧹 Limpiando ventas huérfanas...');
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // Encontrar ventas sin detalles
    db.all(`
      SELECT v.id, v.total, v.fecha 
      FROM ventas v 
      LEFT JOIN detalles_venta dv ON v.id = dv.venta_id 
      WHERE dv.venta_id IS NULL
    `, (err, ventasHuérfanas) => {
      if (err) {
        console.error('❌ Error al buscar ventas huérfanas:', err.message);
        db.run('ROLLBACK');
        return res.status(500).json({ error: err.message });
      }
      
      if (ventasHuérfanas.length === 0) {
        console.log('✅ No se encontraron ventas huérfanas');
        db.run('ROLLBACK');
        return res.json({ message: 'No se encontraron ventas huérfanas' });
      }
      
      console.log(`🗑️ Encontradas ${ventasHuérfanas.length} ventas huérfanas:`);
      ventasHuérfanas.forEach(venta => {
        console.log(`   - Venta ID: ${venta.id}, Total: $${venta.total}, Fecha: ${venta.fecha}`);
      });
      
      // Eliminar ventas huérfanas
      const ids = ventasHuérfanas.map(v => v.id).join(',');
      db.run(`DELETE FROM ventas WHERE id IN (${ids})`, function(err) {
        if (err) {
          console.error('❌ Error al eliminar ventas huérfanas:', err.message);
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }
        
        db.run('COMMIT', (commitErr) => {
          if (commitErr) {
            console.error('❌ Error al hacer COMMIT:', commitErr.message);
            return res.status(500).json({ error: 'Error al confirmar la limpieza' });
          }
          
          console.log(`✅ ${this.changes} ventas huérfanas eliminadas exitosamente`);
          res.json({ 
            message: `${this.changes} ventas huérfanas eliminadas`,
            ventas_eliminadas: this.changes,
            detalles: ventasHuérfanas
          });
        });
      });
    });
  });
});

app.listen(PORT, () => {
  console.log('\n🚀 ==========================================');
  console.log(`🚀 Servidor de Sistema de Ventas iniciado`);
  console.log(`🚀 Puerto: ${PORT}`);
  console.log(`🚀 URL: http://localhost:${PORT}`);
  console.log(`🚀 Base de datos: SQLite`);
  console.log('🚀 ==========================================\n');
  console.log('📝 Logs de actividad habilitados');
  console.log('🔍 Monitoreando todas las peticiones...\n');
}); 