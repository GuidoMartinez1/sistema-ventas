// backend/db.js
import pg from "pg";

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false }
});

// Keep-alive para Neon (evita que cierre la conexión por inactividad)
setInterval(async () => {
  try {
    await pool.query("SELECT 1");
    console.log("✅ Keep-alive ejecutado");
  } catch (err) {
    console.error("❌ Error en keep-alive:", err.message);
  }
}, 60000);

export default pool;