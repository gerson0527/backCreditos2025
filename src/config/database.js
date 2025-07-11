const { Sequelize } = require('sequelize');

// Configuración dinámica basada en el entorno
const isProduction = process.env.NODE_ENV === 'production';
const isRailway = process.env.RAILWAY_ENVIRONMENT_NAME !== undefined;

let sequelize;

if (process.env.DATABASE_URL) {
  // Si hay DATABASE_URL, úsala directamente
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'mysql',
    logging: false,
  });
} else if (process.env.MYSQL_URL) {
  // Railway proporciona MYSQL_URL automáticamente
  sequelize = new Sequelize(process.env.MYSQL_URL, {
    dialect: 'mysql',
    logging: false,
  });
} else {
  // Configuración con parámetros separados
  
  // Si no hay variables de Railway configuradas, usar valores por defecto para pruebas
  let host, port, database, username, password;
  
  if (isRailway) {
    // En Railway, si no hay variables automáticas, usar valores por defecto
    host = process.env.MYSQLHOST || 'trolley.proxy.rlwy.net';  // Host público como fallback
    port = process.env.MYSQLPORT || 54383;                     // Puerto público como fallback
    database = process.env.MYSQLDATABASE || 'railway';
    username = process.env.MYSQLUSER || 'root';
    password = process.env.MYSQLPASSWORD || 'FVYQliIvPzAhKbTnAlhZnCnPuGKJZalV';
  } else {
    // Desarrollo local
    host = process.env.DB_HOST;
    port = process.env.DB_PORT;
    database = process.env.DB_NAME;
    username = process.env.DB_USER;
    password = process.env.DB_PASSWORD;
  }

  sequelize = new Sequelize(database, username, password, {
    host: host,
    port: port,
    dialect: 'mysql',
    logging: false,
  });
}

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a MySQL establecida correctamente');  
  } catch (error) {
    console.error('❌ Error al conectar a MySQL:', error);
    process.exit(1);
  }
};

// Función para ejecutar migraciones automáticamente
const runMigrations = async () => {
  try {
    console.log('🔄 Ejecutando migraciones...');
    
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    // Ejecutar migraciones reales usando sequelize-cli
    const { stdout, stderr } = await execAsync('npx sequelize-cli db:migrate', {
      cwd: process.cwd()
    });
    
    if (stderr && !stderr.includes('warning')) {
      console.error('⚠️ Warnings en migraciones:', stderr);
    }
    
    // Mostrar tablas existentes
    const [results] = await sequelize.query('SHOW TABLES');
    if (results.length === 0) {
      // Verificar si existen archivos de migración
      const fs = require('fs');
      const path = require('path');
      const migrationPath = path.join(process.cwd(), 'migrations');
      
      if (fs.existsSync(migrationPath)) {
        const migrationFiles = fs.readdirSync(migrationPath);
      }
    }
    
  } catch (error) {
    console.error('❌ Error ejecutando migraciones:', error.message);
    
    // Fallback: intentar con sync si las migraciones fallan
    try {
      await sequelize.sync({ force: false, alter: false });
    } catch (syncError) {
      console.error('❌ Error en sync fallback:', syncError.message);
    }
  }
};

// Función para verificar el estado de la base de datos
const checkDatabaseStatus = async () => {
  try {
    // Verificar conexión
    await sequelize.authenticate();
    
    // Obtener información del servidor
    const [serverInfo] = await sequelize.query('SELECT VERSION() as version');
    const [dbInfo] = await sequelize.query(`SELECT DATABASE() as current_db`);
    
    // Contar tablas
    const [tables] = await sequelize.query('SHOW TABLES');
    
    return true;
  } catch (error) {
    console.error('❌ Error verificando base de datos:', error);
    return false;
  }
};

module.exports = { sequelize, connectDB, runMigrations, checkDatabaseStatus };