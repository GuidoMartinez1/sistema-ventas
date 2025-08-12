// backend/db.js
import pg from "pg";

const pool = new pg.Pool({
  connectionString: "postgresql://neondb_owner:npg_BP8ac9emqiJZ@ep-odd-voice-af0w64ag-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  ssl: { rejectUnauthorized: false }
});

// Mantener la conexión activa para evitar cortes en Neon
setInterval(async () => {
  try {
    await pool.query("SELECT 1");
    console.log("Keep-alive ejecutado");
  } catch (err) {
    console.error("Error en keep-alive:", err.message);
  }
}, 5000);

export default pool;