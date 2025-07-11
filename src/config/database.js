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
} else {
  // Configuración con parámetros separados
  // En Railway (producción) usar host interno, en desarrollo usar host público
  const host = isRailway 
    ? 'mysql.railway.internal'  // Host interno para Railway
    : process.env.DB_HOST;      // Host público para desarrollo local
    
  const port = isRailway 
    ? 3306                      // Puerto interno para Railway
    : process.env.DB_PORT;      // Puerto público para desarrollo local

  sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: host,
    port: port,
    dialect: 'mysql',
    logging: false,
  });
}

const connectDB = async () => {
  try {
    console.log('✅ Conexión a MySQL establecida correctamente');
    console.log(`📊 Base de datos: ${config.database}`);
    console.log(`🖥️  Host: ${config.host}`);
    console.log(`🔌 Puerto: ${config.port}`);
    console.log(`👤 Usuario: ${config.username}`);
    console.log(`🌐 Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🚂 Railway Env: ${process.env.RAILWAY_ENVIRONMENT_NAME || 'No detectado'}`);
    
    await sequelize.authenticate();
    
    // Mostrar información detallada de la conexión
    const config = sequelize.config;

    // Verificar si es Railway
    if (config.host && (config.host.includes('railway') || config.host.includes('rlwy'))) {
      console.log('🚂 ¡Conectado a Railway Database!');
    }
    
    // Mostrar si está usando host interno o externo
    if (config.host === 'mysql.railway.internal') {
      console.log('🔗 Usando conexión INTERNA de Railway (Producción)');
    } else if (config.host && config.host.includes('rlwy')) {
      console.log('🌐 Usando conexión EXTERNA de Railway (Desarrollo local)');
    }
    
  } catch (error) {
    console.error('❌ Error al conectar a MySQL:', error);
    console.log('🔍 Información de debug:');
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`   RAILWAY_ENVIRONMENT_NAME: ${process.env.RAILWAY_ENVIRONMENT_NAME}`);
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? 'Configurada' : 'No configurada'}`);
    console.log(`   DB_HOST: ${process.env.DB_HOST}`);
    console.log(`   DB_PORT: ${process.env.DB_PORT}`);
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
    
    console.log('✅ Migraciones ejecutadas correctamente');
    console.log(stdout);
    
    // Mostrar tablas existentes
    const [results] = await sequelize.query('SHOW TABLES');
    console.log('📋 Tablas en la base de datos:');
    if (results.length === 0) {
      console.log('   ⚠️ No se encontraron tablas. Revisando configuración...');
      
      // Verificar si existen archivos de migración
      const fs = require('fs');
      const path = require('path');
      const migrationPath = path.join(process.cwd(), 'migrations');
      
      if (fs.existsSync(migrationPath)) {
        const migrationFiles = fs.readdirSync(migrationPath);
        console.log(`   📁 Archivos de migración encontrados: ${migrationFiles.length}`);
        migrationFiles.forEach((file, index) => {
          console.log(`      ${index + 1}. ${file}`);
        });
      } else {
        console.log('   ❌ No se encontró la carpeta migrations/');
      }
    } else {
      results.forEach((table, index) => {
        const tableName = Object.values(table)[0];
        console.log(`   ${index + 1}. ${tableName}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error ejecutando migraciones:', error.message);
    
    // Fallback: intentar con sync si las migraciones fallan
    console.log('🔄 Intentando crear tablas con sync como fallback...');
    try {
      await sequelize.sync({ force: false, alter: false });
      console.log('✅ Sync ejecutado como fallback');
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
    
    console.log('📊 Estado de la base de datos:');
    console.log(`   Versión MySQL: ${serverInfo[0].version}`);
    console.log(`   Base de datos actual: ${dbInfo[0].current_db}`);
    
    // Contar tablas
    const [tables] = await sequelize.query('SHOW TABLES');
    console.log(`   Total de tablas: ${tables.length}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error verificando base de datos:', error);
    return false;
  }
};

module.exports = { sequelize, connectDB, runMigrations, checkDatabaseStatus };