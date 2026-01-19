import pool from '../db.js';

async function checkUsersTable() {
  try {
    console.log('🔍 Verificando estructura de la tabla usuarios...');
    
    // Verificar si la tabla existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'usuarios'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ La tabla usuarios no existe. Creándola...');
      
      await pool.query(`
        CREATE TABLE usuarios (
          id SERIAL PRIMARY KEY,
          nombre VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('✅ Tabla usuarios creada exitosamente');
    } else {
      console.log('✅ La tabla usuarios ya existe');
    }
    
    // Verificar estructura de la tabla
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'usuarios'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Estructura de la tabla usuarios:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULL)'}`);
    });
    
    // Verificar si hay usuarios
    const userCount = await pool.query('SELECT COUNT(*) FROM usuarios');
    console.log(`\n👥 Total de usuarios: ${userCount.rows[0].count}`);
    
    if (userCount.rows[0].count === '0') {
      console.log('⚠️  No hay usuarios registrados. Puedes crear uno desde el frontend.');
    }
    
    console.log('\n✅ Verificación completada');
    
  } catch (error) {
    console.error('❌ Error verificando la tabla usuarios:', error);
  } finally {
    await pool.end();
  }
}

checkUsersTable();
