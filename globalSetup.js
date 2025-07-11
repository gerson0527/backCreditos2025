// Este archivo se ejecuta ANTES de cualquier test
const path = require('path');

module.exports = async () => {
  // Cargar variables de entorno desde el archivo .env
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
  
  // Configurar NODE_ENV para tests
  process.env.NODE_ENV = 'test';
  
  // Asegurar que las variables críticas estén definidas
  if (!process.env.DB_HOST) process.env.DB_HOST = 'localhost';
  if (!process.env.DB_PORT) process.env.DB_PORT = '3306';
  if (!process.env.DB_USER) process.env.DB_USER = 'root';
  if (!process.env.DB_PASSWORD) process.env.DB_PASSWORD = '';
  if (!process.env.DB_NAME_TEST) process.env.DB_NAME_TEST = 'fullproject_test';
  if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'test-secret-key-for-jwt';
  
  console.log('Global setup completed. Environment variables loaded.');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_NAME_TEST:', process.env.DB_NAME_TEST);
};