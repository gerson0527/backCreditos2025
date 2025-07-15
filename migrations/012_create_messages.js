'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('messages', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      sender_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      receiver_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Índices para mejorar el rendimiento (con verificación de existencia)
    try {
      await queryInterface.addIndex('messages', ['sender_id'], {
        name: 'idx_messages_sender_id'
      });
    } catch (error) {
      if (!error.message.includes('Duplicate key name')) throw error;
    }
    
    try {
      await queryInterface.addIndex('messages', ['receiver_id'], {
        name: 'idx_messages_receiver_id'
      });
    } catch (error) {
      if (!error.message.includes('Duplicate key name')) throw error;
    }
    
    try {
      await queryInterface.addIndex('messages', ['timestamp'], {
        name: 'idx_messages_timestamp'
      });
    } catch (error) {
      if (!error.message.includes('Duplicate key name')) throw error;
    }
    
    try {
      await queryInterface.addIndex('messages', ['is_read'], {
        name: 'idx_messages_is_read'
      });
    } catch (error) {
      if (!error.message.includes('Duplicate key name')) throw error;
    }
    
    // Índice compuesto para consultas de conversaciones
    try {
      await queryInterface.addIndex('messages', ['sender_id', 'receiver_id'], {
        name: 'idx_messages_conversation'
      });
    } catch (error) {
      if (!error.message.includes('Duplicate key name')) throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('messages');
  }
};
