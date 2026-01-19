import pool from '../db.js';
import bcrypt from 'bcrypt';

async function createTestUser() {
  try {
    console.log('🔧 Creando usuario de prueba...');
    
    const testUser = {
      nombre: 'Usuario Admin',
      email: 'admin@sistema.com',
      password: 'admin123'
    };
    
    // Verificar si el usuario ya existe
    const existingUser = await pool.query('SELECT * FROM usuarios WHERE email = $1', [testUser.email]);
    
    if (existingUser.rows.length > 0) {
      console.log('⚠️  El usuario de prueba ya existe');
      console.log(`📧 Email: ${testUser.email}`);
      console.log(`🔑 Contraseña: ${testUser.password}`);
      return;
    }
    
    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(testUser.password, salt);
    
    // Insertar usuario
    const result = await pool.query(
      'INSERT INTO usuarios (nombre, email, password_hash) VALUES ($1, $2, $3) RETURNING id, nombre, email',
      [testUser.nombre, testUser.email, password_hash]
    );
    
    console.log('✅ Usuario de prueba creado exitosamente');
    console.log(`👤 ID: ${result.rows[0].id}`);
    console.log(`📧 Email: ${testUser.email}`);
    console.log(`🔑 Contraseña: ${testUser.password}`);
    console.log('\n🚀 Puedes usar estas credenciales para hacer login');
    
  } catch (error) {
    console.error('❌ Error creando usuario de prueba:', error);
  } finally {
    await pool.end();
  }
}

createTestUser();
