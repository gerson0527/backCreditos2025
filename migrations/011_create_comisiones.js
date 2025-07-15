module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Comisions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      asesorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Asesor',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      bancoid: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Bancos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      financieraId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Financieras',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      tipoEntidad: {
        type: Sequelize.ENUM('Banco', 'Financiera'),
        allowNull: false
      },
      periodo: {
        type: Sequelize.STRING, // Formato: "2024-07" (año-mes)
        allowNull: false
      },
      creditosAprobados: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      montoTotalGestionado: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0
      },
      comisionBase: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      bonificaciones: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      deducciones: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      comisionTotal: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      estado: {
        type: Sequelize.ENUM('Pendiente', 'Pagado', 'Rechazado'),
        defaultValue: 'Pendiente'
      },
      fechaCalculo: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      fechaPago: {
        type: Sequelize.DATE,
        allowNull: true
      },
      metodoPago: {
        type: Sequelize.ENUM('Transferencia', 'Efectivo', 'Cheque'),
        allowNull: true
      },
      numeroTransferencia: {
        type: Sequelize.STRING,
        allowNull: true
      },
      observaciones: {
        type: Sequelize.TEXT,
        allowNull: true
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

    // Agregar índices para mejorar el rendimiento (con verificación de existencia)
    try {
      await queryInterface.addIndex('Comisions', ['asesorId'], {
        name: 'idx_comisions_asesor_id'
      });
    } catch (error) {
      if (!error.message.includes('Duplicate key name')) throw error;
    }
    
    try {
      await queryInterface.addIndex('Comisions', ['periodo'], {
        name: 'idx_comisions_periodo'
      });
    } catch (error) {
      if (!error.message.includes('Duplicate key name')) throw error;
    }
    
    try {
      await queryInterface.addIndex('Comisions', ['estado'], {
        name: 'idx_comisions_estado'
      });
    } catch (error) {
      if (!error.message.includes('Duplicate key name')) throw error;
    }
    
    try {
      await queryInterface.addIndex('Comisions', ['tipoEntidad'], {
        name: 'idx_comisions_tipo_entidad'
      });
    } catch (error) {
      if (!error.message.includes('Duplicate key name')) throw error;
    }
    
    try {
      await queryInterface.addIndex('Comisions', ['bancoid'], {
        name: 'idx_comisions_banco_id'
      });
    } catch (error) {
      if (!error.message.includes('Duplicate key name')) throw error;
    }
    
    try {
      await queryInterface.addIndex('Comisions', ['financieraId'], {
        name: 'idx_comisions_financiera_id'
      });
    } catch (error) {
      if (!error.message.includes('Duplicate key name')) throw error;
    }
    
    // Índice compuesto para consultas comunes
    try {
      await queryInterface.addIndex('Comisions', ['periodo', 'asesorId'], {
        name: 'idx_comisions_periodo_asesor'
      });
    } catch (error) {
      if (!error.message.includes('Duplicate key name')) throw error;
    }
    
    try {
      await queryInterface.addIndex('Comisions', ['periodo', 'estado'], {
        name: 'idx_comisions_periodo_estado'
      });
    } catch (error) {
      if (!error.message.includes('Duplicate key name')) throw error;
    }
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('Comisions');
  }
};