import pool from '../db.js';

async function updateUsersTable() {
  try {
    console.log('🔧 Actualizando tabla usuarios para roles...');
    
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
    
    console.log('✅ Tabla usuarios actualizada con roles');
    
    // Mostrar estructura actual
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'usuarios'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Estructura actualizada de la tabla usuarios:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULL)'} ${col.column_default ? `DEFAULT: ${col.column_default}` : ''}`);
    });
    
  } catch (error) {
    console.error('❌ Error actualizando tabla usuarios:', error);
  } finally {
    await pool.end();
  }
}

updateUsersTable();
