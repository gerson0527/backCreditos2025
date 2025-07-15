require('dotenv').config();

// Función para parsear DATABASE_URL
const parseDBUrl = (url) => {
  if (!url) return null;
  
  try {
    // Formato: mysql://username:password@host:port/database
    const regex = /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
    const match = url.match(regex);
    
    if (match) {
      return {
        username: match[1],
        password: match[2],
        host: match[3],
        port: parseInt(match[4]),
        database: match[5]
      };
    }
  } catch (error) {
    console.error('Error parsing DATABASE_URL:', error);
  }
  
  return null;
};

// Configuración base
const baseConfig = {
  dialect: 'mysql',
  logging: false
};

// Parsear DATABASE_URL si existe
const dbUrlConfig = parseDBUrl(process.env.DATABASE_URL);

// Configuración para desarrollo
const developmentConfig = dbUrlConfig || {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT
};

// Configuración para producción
const productionConfig = dbUrlConfig || {
  username: process.env.DB_USER || process.env.MYSQLUSER,
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,
  database: process.env.DB_NAME || process.env.MYSQLDATABASE,
  host: process.env.DB_HOST || process.env.MYSQLHOST,
  port: process.env.DB_PORT || process.env.MYSQLPORT
};

module.exports = {
  development: {
    ...baseConfig,
    ...developmentConfig,
    logging: console.log
  },
  test: {
    ...baseConfig,
    ...developmentConfig
  },
  production: {
    ...baseConfig,
    ...productionConfig
  }
};
