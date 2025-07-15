require('dotenv').config();

console.log('🔍 Verificando variables de entorno:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '[OCULTA]' : 'NO DEFINIDA');

// Probar la configuración de sequelize
const config = require('./sequelize.config.js');
console.log('\n📋 Configuración de Sequelize:');
console.log('Test env config:', JSON.stringify(config.test, null, 2));
