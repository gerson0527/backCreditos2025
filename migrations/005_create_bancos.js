module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Bancos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nombre: {
        type: Sequelize.STRING,
        allowNull: false
      },
      tipo: {
        type: Sequelize.STRING
      },
      personaContacto: {
        type: Sequelize.STRING
      },
      telefono: {
        type: Sequelize.STRING
      },
      email: {
        type: Sequelize.STRING
      },
      tasaBase: {
        type: Sequelize.DECIMAL(5, 2)
      },
      comisionban: {
        type: Sequelize.STRING
      },
      direccion: {
        type: Sequelize.TEXT
      },
      estado: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('Bancos');
  }
};