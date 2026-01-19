import pool from '../db.js';
import bcrypt from 'bcrypt';

async function createAdminUser() {
  try {
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
      console.log('⚠️  El usuario administrador ya existe');
      console.log(`📧 Email: ${adminUser.email}`);
      console.log(`🔑 Contraseña: ${adminUser.password}`);
      console.log(`👑 Rol: ${adminUser.rol}`);
      return;
    }
    
    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(adminUser.password, salt);
    
    // Insertar usuario
    const result = await pool.query(
      'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, rol',
      [adminUser.nombre, adminUser.email, password_hash, adminUser.rol]
    );
    
    console.log('✅ Usuario administrador creado exitosamente');
    console.log(`👤 ID: ${result.rows[0].id}`);
    console.log(`📧 Email: ${adminUser.email}`);
    console.log(`🔑 Contraseña: ${adminUser.password}`);
    console.log(`👑 Rol: ${adminUser.rol}`);
    console.log('\n🚀 Puedes usar estas credenciales para hacer login como administrador');
    
  } catch (error) {
    console.error('❌ Error creando usuario administrador:', error);
  } finally {
    await pool.end();
  }
}

createAdminUser();
