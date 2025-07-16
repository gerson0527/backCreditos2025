require('dotenv').config();

// Configuración dinámica basada en el entorno
const isProduction = process.env.NODE_ENV === 'production';
const isRailway = process.env.RAILWAY_ENVIRONMENT_NAME !== undefined;

console.log('🔍 Variables de entorno en sequelize.config.js:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- RAILWAY_ENVIRONMENT_NAME:', process.env.RAILWAY_ENVIRONMENT_NAME);
console.log('- DATABASE_URL existe:', !!process.env.DATABASE_URL);
console.log('- MYSQL_URL existe:', !!process.env.MYSQL_URL);
console.log('- isProduction:', isProduction);
console.log('- isRailway:', isRailway);

let config;

if (process.env.DATABASE_URL) {
  console.log('📝 Usando DATABASE_URL para configuración');
  // Si hay DATABASE_URL, úsala directamente
  config = {
    url: process.env.DATABASE_URL,
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  };
} else if (process.env.MYSQL_URL) {
  console.log('📝 Usando MYSQL_URL para configuración');
  // Railway proporciona MYSQL_URL automáticamente
  config = {
    url: process.env.MYSQL_URL,
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  };
} else {
  console.log('📝 Usando configuración por defecto');
  // Configuración con parámetros separados
  let host, port, database, username, password;
  
  if (isRailway) {
    console.log('📝 Configuración Railway con parámetros separados');
    // En Railway, usar variables de entorno
    host = process.env.MYSQLHOST || 'localhost';
    port = process.env.MYSQLPORT || 3306;
    database = process.env.MYSQLDATABASE || 'test';
    username = process.env.MYSQLUSER || 'root';
    password = process.env.MYSQLPASSWORD || '';
  } else {
    console.log('📝 Configuración local de desarrollo');
    // Desarrollo local
    host = process.env.DB_HOST || 'localhost';
    port = process.env.DB_PORT || 3306;
    database = process.env.DB_NAME || 'test';
    username = process.env.DB_USER || 'root';
    password = process.env.DB_PASSWORD || '';
  }
  
  config = {
    username: username,
    password: password,
    database: database,
    host: host,
    port: parseInt(port),
    dialect: 'mysql',
    logging: false
  };
}

console.log('✅ Configuración final de sequelize.config.js:', {
  dialect: config.dialect || 'mysql',
  hasUrl: !!config.url,
  hasHost: !!config.host,
  hasUsername: !!config.username,
  hasSSL: !!(config.dialectOptions && config.dialectOptions.ssl)
});

module.exports = {
  development: config,
  test: config,
  production: config
};