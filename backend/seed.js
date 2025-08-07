const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err);
    return;
  }
  console.log('Conectado a la base de datos SQLite');
  initDatabase();
});

// Inicializar base de datos
function initDatabase() {
  console.log('🔧 Inicializando base de datos...');
  
  // Tabla de categorías
  db.run(`CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error al crear tabla categorias:', err);
    } else {
      console.log('✅ Tabla categorias creada');
    }
  });

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
  )`, (err) => {
    if (err) {
      console.error('Error al crear tabla productos:', err);
    } else {
      console.log('✅ Tabla productos creada');
    }
  });

  // Tabla de clientes
  db.run(`CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT,
    telefono TEXT,
    direccion TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error al crear tabla clientes:', err);
    } else {
      console.log('✅ Tabla clientes creada');
    }
  });

  // Tabla de ventas
  db.run(`CREATE TABLE IF NOT EXISTS ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER,
    total REAL NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado TEXT DEFAULT 'completada',
    FOREIGN KEY (cliente_id) REFERENCES clientes (id)
  )`, (err) => {
    if (err) {
      console.error('Error al crear tabla ventas:', err);
    } else {
      console.log('✅ Tabla ventas creada');
    }
  });

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
  )`, (err) => {
    if (err) {
      console.error('Error al crear tabla detalles_venta:', err);
    } else {
      console.log('✅ Tabla detalles_venta creada');
    }
  });

  // Cerrar la conexión después de crear las tablas
  setTimeout(() => {
    console.log('🎉 Base de datos inicializada exitosamente!');
    console.log('📊 Tablas creadas: categorias, productos, clientes, ventas, detalles_venta');
    db.close();
  }, 1000);
}