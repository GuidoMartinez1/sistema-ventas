import express from 'express';
import pg from 'pg';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const { Pool } = pg;

// Configuración de conexión a PostgreSQL usando variables de entorno
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false } // Requerido por Neon
});

// Conectar a la base de datos
pool.connect()
  .then(() => {
    console.log('✅ Conectado a PostgreSQL (Neon)');
  })
  .catch(err => {
    console.error('❌ Error conectando a PostgreSQL:', err);
  });

// Ejemplo de ruta raíz
app.get('/', (req, res) => {
  res.send('Servidor backend funcionando con Neon 🚀');
});

// Aquí deberías importar y usar tus rutas originales
// Ejemplo:
// import ventasRoutes from './routes/ventas.js';
// app.use('/api/ventas', ventasRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});

export default pool;
