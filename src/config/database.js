const { Sequelize } = require('sequelize');

// Configuración flexible: puede usar URL completa o parámetros separados
const sequelize = process.env.DATABASE_URL 
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'mysql',
      logging: false,
    })
  : new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: 'mysql',
      logging: false,
    });

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    
    // Mostrar información detallada de la conexión
    const config = sequelize.config;
    console.log('✅ Conexión a MySQL establecida correctamente');
    console.log(`📊 Base de datos: ${config.database}`);
    console.log(`🖥️  Host: ${config.host}`);
    console.log(`🔌 Puerto: ${config.port}`);
    console.log(`👤 Usuario: ${config.username}`);
    console.log(`🌐 Entorno: ${process.env.NODE_ENV || 'development'}`);
    
    // Verificar si es Railway
    if (config.host && (config.host.includes('railway') || config.host.includes('rlwy'))) {
      console.log('🚂 ¡Conectado a Railway Database!');
    }
    
  } catch (error) {
    console.error('❌ Error al conectar a MySQL:', error);
    process.exit(1);
  }
};

// Función para ejecutar migraciones automáticamente
const runMigrations = async () => {
  try {
    console.log('🔄 Ejecutando migraciones...');
    
    // Sincronizar modelos (crear tablas si no existen)
    await sequelize.sync({ force: false, alter: false });
    
    console.log('✅ Migraciones ejecutadas correctamente');
    
    // Mostrar tablas existentes
    const [results] = await sequelize.query('SHOW TABLES');
    console.log('📋 Tablas en la base de datos:');
    results.forEach((table, index) => {
      const tableName = Object.values(table)[0];
      console.log(`   ${index + 1}. ${tableName}`);
    });
    
  } catch (error) {
    console.error('❌ Error ejecutando migraciones:', error);
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