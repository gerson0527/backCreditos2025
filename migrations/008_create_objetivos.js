module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Objetivos', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      titulo: {
        type: Sequelize.STRING,
        allowNull: false
      },
      tipo: {
        type: Sequelize.STRING,
        allowNull: false
      },
      unidad: {
        type: Sequelize.STRING
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      meta: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      fechaInicio: {
        type: Sequelize.DATE,
        allowNull: false
      },
      fechaFin: {
        type: Sequelize.DATE,
        allowNull: false
      },
      asesorId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Asesor',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      prioridad: {
        type: Sequelize.STRING
      },
      estado: {
        type: Sequelize.ENUM('PENDIENTE', 'EN_PROGRESO', 'COMPLETADO', 'CANCELADO'),
        defaultValue: 'PENDIENTE'
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
    await queryInterface.dropTable('Objetivos');
  }
};
