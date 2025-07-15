require('dotenv').config();
const mysql = require('mysql2/promise');

async function setupDatabase() {
  console.log('🔍 Verificando conexión a MySQL...');
  
  try {
    // Primero intentar conectar sin especificar base de datos
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });
    
    console.log('✅ Conexión a MySQL exitosa');
    
    // Crear base de datos si no existe
    const dbName = process.env.DB_NAME || 'creditos_db_prueba';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✅ Base de datos '${dbName}' creada o ya existe`);
    
    await connection.end();
    
    // Ahora probar conexión con la base de datos específica
    const dbConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: dbName
    });
    
    console.log(`✅ Conexión a base de datos '${dbName}' exitosa`);
    
    // Mostrar tablas existentes
    const [tables] = await dbConnection.query('SHOW TABLES');
    console.log(`📊 Tablas existentes: ${tables.length}`);
    if (tables.length > 0) {
      tables.forEach(table => {
        console.log(`  - ${Object.values(table)[0]}`);
      });
    }
    
    await dbConnection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Sugerencia: Verifica que MySQL esté ejecutándose');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 Sugerencia: Verifica las credenciales de MySQL');
    }
  }
}

setupDatabase();
