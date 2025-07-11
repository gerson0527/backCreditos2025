'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Array de módulos para aplicar los cambios
      const modules = [
        'creditos', 'clientes', 'asesores', 'bancos', 
        'financieras', 'objetivos', 'reportes', 'comisiones', 
        'configuracion', 'gestionUsuarios'
      ];

      // Para cada módulo, agregar columna _crear y eliminar columna _modificar
      for (const module of modules) {
        // Agregar columna _crear
        await queryInterface.addColumn('Users', `${module}_crear`, {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false
        }, { transaction });

        // Eliminar columna _modificar (si existe)
        try {
          await queryInterface.removeColumn('Users', `${module}_modificar`, { transaction });
        } catch (error) {
          console.log(`Column ${module}_modificar doesn't exist, skipping...`);
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Array de módulos para revertir los cambios
      const modules = [
        'creditos', 'clientes', 'asesores', 'bancos', 
        'financieras', 'objetivos', 'reportes', 'comisiones', 
        'configuracion', 'gestionUsuarios'
      ];

      // Para cada módulo, eliminar columna _crear y agregar columna _modificar
      for (const module of modules) {
        // Eliminar columna _crear
        try {
          await queryInterface.removeColumn('Users', `${module}_crear`, { transaction });
        } catch (error) {
          console.log(`Column ${module}_crear doesn't exist, skipping...`);
        }

        // Agregar columna _modificar
        await queryInterface.addColumn('Users', `${module}_modificar`, {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false
        }, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
