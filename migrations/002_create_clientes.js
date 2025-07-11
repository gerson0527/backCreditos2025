module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Clientes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      nombre: {
        type: Sequelize.STRING,
        allowNull: false
      },
      apellido: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      telefono: {
        type: Sequelize.STRING
      },
      dni: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      ingresosmessuales:{
        type: Sequelize.FLOAT

      },
      fechanacimiento: {
        type: Sequelize.DATE
      },
      creditosActivos: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      ingresosMensuales: {
        type: Sequelize.FLOAT
      },
      estado: {
        type: Sequelize.ENUM('Activo', 'Pendiente', 'Inactivo'),
        defaultValue: 'Activo'
      },
      direccion: {
        type: Sequelize.STRING
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('Clientes');
  }
};