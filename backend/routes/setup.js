import express from "express";
import pool from "../db.js";
import bcrypt from "bcrypt";

const router = express.Router();

// Endpoint para configurar la base de datos (solo en producción)
router.post("/setup-database", async (req, res) => {
  try {
    // Solo permitir en producción
    if (process.env.NODE_ENV !== 'production') {
      return res.status(403).json({ error: 'Solo disponible en producción' });
    }

    console.log('🔧 Configurando base de datos...');

    // Actualizar valores de rol existentes
    await pool.query(`
      UPDATE usuarios 
      SET rol = 'EMPLEADO' 
      WHERE rol = 'usuario' OR rol IS NULL
    `);

    // Agregar constraint para validar roles
    await pool.query(`
      ALTER TABLE usuarios 
      DROP CONSTRAINT IF EXISTS usuarios_rol_check
    `);

    await pool.query(`
      ALTER TABLE usuarios 
      ADD CONSTRAINT usuarios_rol_check CHECK (rol IN ('ADMIN', 'EMPLEADO'))
    `);

    // Agregar columna activo si no existe
    await pool.query(`
      ALTER TABLE usuarios 
      ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true
    `);

    console.log('✅ Base de datos configurada');

    res.json({ message: 'Base de datos configurada exitosamente' });
  } catch (error) {
    console.error('❌ Error configurando base de datos:', error);
    res.status(500).json({ error: 'Error configurando base de datos' });
  }
});

// Endpoint para crear usuario admin (solo en producción)
router.post("/create-admin", async (req, res) => {
  try {
    // Solo permitir en producción
    if (process.env.NODE_ENV !== 'production') {
      return res.status(403).json({ error: 'Solo disponible en producción' });
    }

    console.log('🔧 Creando usuario administrador...');

    const adminUser = {
      nombre: 'Administrador',
      email: 'admin@sistema.com',
      password: 'admin123',
      rol: 'ADMIN'
    };

    // Verificar si el usuario ya existe
    const existingUser = await pool.query('SELECT * FROM usuarios WHERE email = $1', [adminUser.email]);

    if (existingUser.rows.length > 0) {
      return res.json({ 
        message: 'Usuario administrador ya existe',
        email: adminUser.email,
        password: adminUser.password
      });
    }

    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(adminUser.password, salt);

    // Insertar usuario
    const result = await pool.query(
      'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, rol',
      [adminUser.nombre, adminUser.email, password_hash, adminUser.rol]
    );

    console.log('✅ Usuario administrador creado');

    res.json({
      message: 'Usuario administrador creado exitosamente',
      user: {
        id: result.rows[0].id,
        nombre: result.rows[0].nombre,
        email: result.rows[0].email,
        rol: result.rows[0].rol
      },
      credentials: {
        email: adminUser.email,
        password: adminUser.password
      }
    });
  } catch (error) {
    console.error('❌ Error creando usuario administrador:', error);
    res.status(500).json({ error: 'Error creando usuario administrador' });
  }
});

export default router;
