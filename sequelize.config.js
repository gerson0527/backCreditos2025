require('dotenv').config();

// Configuración dinámica basada en el entorno
const isProduction = process.env.NODE_ENV === 'production';
const isRailway = process.env.RAILWAY_ENVIRONMENT_NAME !== undefined;

let config;

if (process.env.DATABASE_URL) {
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
  // Configuración con parámetros separados
  let host, port, database, username, password;
  
  if (isRailway) {
    // En Railway, usar variables de entorno
    host = process.env.MYSQLHOST || 'localhost';
    port = process.env.MYSQLPORT || 3306;
    database = process.env.MYSQLDATABASE || 'test';
    username = process.env.MYSQLUSER || 'root';
    password = process.env.MYSQLPASSWORD || '';
  } else {
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

module.exports = {
  development: config,
  test: config,
  production: config
};