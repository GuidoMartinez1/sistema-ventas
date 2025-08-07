const { pool } = require('./config/database');

const initDatabase = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🗄️  Inicializando base de datos PostgreSQL...');
    
    // Crear tabla categorias
    await client.query(`
      CREATE TABLE IF NOT EXISTS categorias (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) UNIQUE NOT NULL,
        descripcion TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla categorias creada');

    // Crear tabla productos
    await client.query(`
      CREATE TABLE IF NOT EXISTS productos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        descripcion TEXT,
        precio DECIMAL(10,2) NOT NULL,
        precio_costo DECIMAL(10,2) DEFAULT 0,
        porcentaje_ganancia DECIMAL(5,2) DEFAULT 30,
        stock INTEGER DEFAULT 0,
        categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
        codigo VARCHAR(100) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla productos creada');

    // Crear tabla clientes
    await client.query(`
      CREATE TABLE IF NOT EXISTS clientes (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        telefono VARCHAR(50),
        direccion TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla clientes creada');

    // Crear tabla proveedores
    await client.query(`
      CREATE TABLE IF NOT EXISTS proveedores (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        telefono VARCHAR(50),
        direccion TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla proveedores creada');

    // Crear tabla ventas
    await client.query(`
      CREATE TABLE IF NOT EXISTS ventas (
        id SERIAL PRIMARY KEY,
        cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
        total DECIMAL(10,2) NOT NULL,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        estado VARCHAR(50) DEFAULT 'completada',
        metodo_pago VARCHAR(50) DEFAULT 'efectivo'
      )
    `);
    console.log('✅ Tabla ventas creada');

    // Crear tabla detalles_venta
    await client.query(`
      CREATE TABLE IF NOT EXISTS detalles_venta (
        id SERIAL PRIMARY KEY,
        venta_id INTEGER REFERENCES ventas(id) ON DELETE CASCADE,
        producto_id INTEGER REFERENCES productos(id) ON DELETE SET NULL,
        cantidad INTEGER NOT NULL,
        precio_unitario DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL
      )
    `);
    console.log('✅ Tabla detalles_venta creada');

    // Crear tabla compras
    await client.query(`
      CREATE TABLE IF NOT EXISTS compras (
        id SERIAL PRIMARY KEY,
        proveedor_id INTEGER REFERENCES proveedores(id) ON DELETE SET NULL,
        total DECIMAL(10,2) NOT NULL,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        estado VARCHAR(50) DEFAULT 'completada'
      )
    `);
    console.log('✅ Tabla compras creada');

    // Crear tabla detalles_compra
    await client.query(`
      CREATE TABLE IF NOT EXISTS detalles_compra (
        id SERIAL PRIMARY KEY,
        compra_id INTEGER REFERENCES compras(id) ON DELETE CASCADE,
        producto_id INTEGER REFERENCES productos(id) ON DELETE SET NULL,
        cantidad INTEGER NOT NULL,
        precio_unitario DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL
      )
    `);
    console.log('✅ Tabla detalles_compra creada');

    // Crear tabla bolsas_abiertas
    await client.query(`
      CREATE TABLE IF NOT EXISTS bolsas_abiertas (
        id SERIAL PRIMARY KEY,
        producto_id INTEGER REFERENCES productos(id) ON DELETE CASCADE,
        fecha_apertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        estado VARCHAR(50) DEFAULT 'abierta'
      )
    `);
    console.log('✅ Tabla bolsas_abiertas creada');

    // Crear índices para mejorar performance
    await client.query('CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_productos_codigo ON productos(codigo)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_ventas_cliente ON ventas(cliente_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_ventas_estado ON ventas(estado)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_detalles_venta_venta ON detalles_venta(venta_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_detalles_venta_producto ON detalles_venta(producto_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_compras_proveedor ON compras(proveedor_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_compras_fecha ON compras(fecha)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_detalles_compra_compra ON detalles_compra(compra_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_detalles_compra_producto ON detalles_compra(producto_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_bolsas_abiertas_producto ON bolsas_abiertas(producto_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_bolsas_abiertas_estado ON bolsas_abiertas(estado)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_bolsas_abiertas_fecha ON bolsas_abiertas(fecha_apertura)');
    
    console.log('✅ Índices creados para optimizar consultas');

    console.log('🎉 Base de datos PostgreSQL inicializada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error inicializando la base de datos:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('✅ Script de inicialización completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en el script:', error);
      process.exit(1);
    });
}

module.exports = { initDatabase }; 