const { Pool } = require('pg');
require('dotenv').config();

// Configuración de la base de datos PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'sistema_ventas',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'tu_password',
  max: 20, // máximo número de conexiones en el pool
  idleTimeoutMillis: 30000, // tiempo máximo que una conexión puede estar inactiva
  connectionTimeoutMillis: 2000, // tiempo máximo para establecer una conexión
});

// Evento cuando se conecta un cliente
pool.on('connect', () => {
  console.log('✅ Conectado a PostgreSQL');
});

// Evento cuando hay un error
pool.on('error', (err) => {
  console.error('❌ Error en el pool de PostgreSQL:', err);
});

// Función para probar la conexión
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Conexión a PostgreSQL exitosa');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Error conectando a PostgreSQL:', error.message);
    return false;
  }
};

// Función para cerrar el pool
const closePool = async () => {
  await pool.end();
  console.log('🔌 Pool de PostgreSQL cerrado');
};

module.exports = {
  pool,
  testConnection,
  closePool
}; 