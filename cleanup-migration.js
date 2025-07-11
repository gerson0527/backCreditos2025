const { Sequelize } = require('sequelize');
const config = require('./config/config.js');

const env = process.env.NODE_ENV || 'test';
const sequelize = new Sequelize(config[env]);

async function cleanupMigration() {
  try {
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida correctamente.');
    
    // Eliminar el registro problemático de SequelizeMeta
    await sequelize.query(
      "DELETE FROM SequelizeMeta WHERE name = '010_add_user_permissions_and_fields.js'"
    );
    
    console.log('Registro problemático eliminado de SequelizeMeta');
    
    await sequelize.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

cleanupMigration();
