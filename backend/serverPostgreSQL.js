// serverPostgreSQL.js
import express from 'express'
import cors from 'cors'
import 'dotenv/config'

// importa pool central (asegúrate que ./db.js existe y exporta `pool`)
import pool from './db.js'

// importa rutas (asegúrate que existen en ./routes/*.js y usan el mismo pool de ./db.js)
import categoriasRoutes from './routes/categorias.js'
import productosRoutes from './routes/productos.js'
import clientesRoutes from './routes/clientes.js'
import proveedoresRoutes from './routes/proveedores.js'
import bolsasAbiertasRoutes from './routes/bolsasAbiertas.js'
import comprasRoutes from './routes/compras.js'
import ventasRoutes from './routes/ventas.js'

const app = express()

/**
 * CORS:
 * - Si defines FRONTEND_URL en el entorno lo usamos como origen único.
 * - Si no lo defines, aceptamos cualquier origen (útil mientras pruebas).
 */
const FRONTEND_URL = process.env.FRONTEND_URL || null

const corsOptions = {
  origin: FRONTEND_URL ? FRONTEND_URL : true, // true => reflect request origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
}

app.use(cors(corsOptions))
app.options('*', cors(corsOptions)) // preflight handler
app.use(express.json())

// Log sencillo de peticiones (útil para debug)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`)
  next()
})

// Health / test endpoints
app.get('/', (req, res) => res.send('Servidor backend funcionando 🚀'))
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS fecha')
    res.json({ ok: true, fecha: result.rows[0].fecha })
  } catch (err) {
    console.error('Error test-db:', err)
    res.status(500).json({ ok: false, error: 'Error consultando la BD' })
  }
})
// compatibilidad con frontend que usa /api/test
app.get('/api/test', (req, res) => res.json({ message: 'Conexión exitosa 🚀' }))

/**
 * MOUNT ROUTES
 * Para mantener compatibilidad con lo que tu front está llamando,
 * montamos cada router en:
 *   /<recurso>
 * y en:
 *   /api/<recurso>
 *
 * Ej: /productos  y /api/productos  -> ambos responden.
 */
const mount = (prefix) => {
  app.use(`${prefix}/categorias`, categoriasRoutes)
  app.use(`${prefix}/productos`, productosRoutes)
  app.use(`${prefix}/clientes`, clientesRoutes)
  app.use(`${prefix}/proveedores`, proveedoresRoutes)
  app.use(`${prefix}/bolsas-abiertas`, bolsasAbiertasRoutes)
  app.use(`${prefix}/compras`, comprasRoutes)
  app.use(`${prefix}/ventas`, ventasRoutes)
}

mount('')     // sin prefijo
mount('/api') // con prefijo /api

// Middleware de manejo de errores (dev-friendly)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && (err.stack || err.message || err))
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
})

// Levantar servidor
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`)
  console.log(`CORS origin: ${FRONTEND_URL || 'ANY'}`)
})

export default app
