module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Creditos', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true
      },
      clienteId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Clientes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
      bancoId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Bancos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      financieraId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Financieras',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'  
      },
      monto: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      tasa: {
        type: Sequelize.STRING,
        allowNull: false
      },
      plazo: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      tipo: {
        type: Sequelize.STRING,
        allowNull: false
      },
      garantia: {
        type: Sequelize.STRING
      },
      estado: {
        type: Sequelize.ENUM(
          'Pendiente',
          'En Revisión',
          'Aprobado',
          'Desembolsado',
          'Activo',
          'Rechazado',
          'Documentos Pendientes'
        ),
        defaultValue: 'Pendiente'
      },
      fechaSolicitud: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      fechaAprobacion: {
        type: Sequelize.DATE
      },
      fechaVencimiento: {
        type: Sequelize.DATE
      },
      fechaRechazo: {
        type: Sequelize.DATE
      },
      observaciones: {
        type: Sequelize.TEXT
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
    await queryInterface.dropTable('Creditos');
  }
};
