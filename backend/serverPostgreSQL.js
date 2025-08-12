// serverPostgreSQL.js
import express from 'express';
import cors from 'cors';
import pkg from 'pg';
const { Pool } = pkg;

// Configuración de conexión a Neon
const pool = new Pool({
  user: 'neondb_owner',
  host: 'ep-odd-voice-af0w64ag-pooler.c-2.us-west-2.aws.neon.tech',
  database: 'neondb',
  password: 'npg_BP8ac9emqiJZ',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

const app = express();
app.use(cors());
app.use(express.json());

// Probar conexión
pool.connect()
  .then(() => console.log('✅ Conectado a PostgreSQL (Neon)'))
  .catch(err => console.error('❌ Error de conexión a la BD:', err));

// Ruta raíz
app.get('/', (req, res) => {
  res.send('Servidor backend funcionando 🚀');
});

// Ejemplo de endpoint para probar DB
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS fecha');
    res.json({ ok: true, fecha: result.rows[0].fecha });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Error consultando la BD' });
  }
});

// Levantar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
