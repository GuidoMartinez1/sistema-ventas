import pool from '../db.js';

async function checkAdminUser() {
  try {
    console.log('🔍 Verificando si existe usuario administrador...');
    
    // Verificar si ya existe un admin
    const adminExists = await pool.query("SELECT * FROM usuarios WHERE rol = 'ADMIN'");
    
    if (adminExists.rows.length > 0) {
      console.log('✅ Ya existe un usuario administrador:');
      adminExists.rows.forEach(admin => {
        console.log(`  - ${admin.nombre} (${admin.email})`);
      });
    } else {
      console.log('⚠️  No existe ningún usuario administrador');
      console.log('💡 Ejecuta: node scripts/createAdminUser.js');
    }
    
    // Mostrar todos los usuarios
    const allUsers = await pool.query("SELECT id, nombre, email, rol, activo FROM usuarios ORDER BY created_at DESC");
    console.log(`\n👥 Total de usuarios: ${allUsers.rows.length}`);
    
    if (allUsers.rows.length > 0) {
      console.log('\n📋 Lista de usuarios:');
      allUsers.rows.forEach(user => {
        console.log(`  - ${user.nombre} (${user.email}) - Rol: ${user.rol} - Activo: ${user.activo}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error verificando usuarios:', error);
  } finally {
    await pool.end();
  }
}

checkAdminUser();
