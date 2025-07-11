'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Función helper para verificar si una columna existe
    const columnExists = async (tableName, columnName) => {
      try {
        const tableInfo = await queryInterface.describeTable(tableName);
        return columnName in tableInfo;
      } catch (error) {
        return false;
      }
    };

    // Agregar campo telefono solo si no existe
    if (!(await columnExists('Users', 'telefono'))) {
      await queryInterface.addColumn('Users', 'telefono', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }

    // Agregar campo sucursal solo si no existe
    if (!(await columnExists('Users', 'sucursal'))) {
      await queryInterface.addColumn('Users', 'sucursal', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }

    // Agregar campo estado solo si no existe
    if (!(await columnExists('Users', 'estado'))) {
      await queryInterface.addColumn('Users', 'estado', {
        type: Sequelize.ENUM('activo', 'inactivo', 'suspendido'),
        defaultValue: 'activo',
        allowNull: false
      });
    }

    // Actualizar el campo theme para incluir 'system' (solo si es necesario)
    try {
      await queryInterface.changeColumn('Users', 'theme', {
        type: Sequelize.ENUM('light', 'dark', 'system'),
        defaultValue: 'system',
        allowNull: true
      });
    } catch (error) {
      console.log('Theme field may already be updated or not exist:', error.message);
    }

    // Lista de todos los permisos que necesitamos agregar
    const permissions = [
      'creditos_ver', 'creditos_editar', 'creditos_eliminar', 'creditos_modificar',
      'clientes_ver', 'clientes_editar', 'clientes_eliminar', 'clientes_modificar',
      'asesores_ver', 'asesores_editar', 'asesores_eliminar', 'asesores_modificar',
      'bancos_ver', 'bancos_editar', 'bancos_eliminar', 'bancos_modificar',
      'financieras_ver', 'financieras_editar', 'financieras_eliminar', 'financieras_modificar',
      'objetivos_ver', 'objetivos_editar', 'objetivos_eliminar', 'objetivos_modificar',
      'reportes_ver', 'reportes_editar', 'reportes_eliminar', 'reportes_modificar',
      'comisiones_ver', 'comisiones_editar', 'comisiones_eliminar', 'comisiones_modificar',
      'configuracion_ver', 'configuracion_editar', 'configuracion_eliminar', 'configuracion_modificar',
      'gestionUsuarios_ver', 'gestionUsuarios_editar', 'gestionUsuarios_eliminar', 'gestionUsuarios_modificar'
    ];

    // Agregar cada permiso solo si no existe
    for (const permission of permissions) {
      if (!(await columnExists('Users', permission))) {
        await queryInterface.addColumn('Users', permission, {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        });
      }
    }
  },

  async down (queryInterface, Sequelize) {
    // Eliminar permisos de Gestión de Usuarios
    await queryInterface.removeColumn('Users', 'gestionUsuarios_modificar');
    await queryInterface.removeColumn('Users', 'gestionUsuarios_eliminar');
    await queryInterface.removeColumn('Users', 'gestionUsuarios_editar');
    await queryInterface.removeColumn('Users', 'gestionUsuarios_ver');

    // Eliminar permisos de Configuración
    await queryInterface.removeColumn('Users', 'configuracion_modificar');
    await queryInterface.removeColumn('Users', 'configuracion_eliminar');
    await queryInterface.removeColumn('Users', 'configuracion_editar');
    await queryInterface.removeColumn('Users', 'configuracion_ver');

    // Eliminar permisos de Comisiones
    await queryInterface.removeColumn('Users', 'comisiones_modificar');
    await queryInterface.removeColumn('Users', 'comisiones_eliminar');
    await queryInterface.removeColumn('Users', 'comisiones_editar');
    await queryInterface.removeColumn('Users', 'comisiones_ver');

    // Eliminar permisos de Reportes
    await queryInterface.removeColumn('Users', 'reportes_modificar');
    await queryInterface.removeColumn('Users', 'reportes_eliminar');
    await queryInterface.removeColumn('Users', 'reportes_editar');
    await queryInterface.removeColumn('Users', 'reportes_ver');

    // Eliminar permisos de Objetivos
    await queryInterface.removeColumn('Users', 'objetivos_modificar');
    await queryInterface.removeColumn('Users', 'objetivos_eliminar');
    await queryInterface.removeColumn('Users', 'objetivos_editar');
    await queryInterface.removeColumn('Users', 'objetivos_ver');

    // Eliminar permisos de Financieras
    await queryInterface.removeColumn('Users', 'financieras_modificar');
    await queryInterface.removeColumn('Users', 'financieras_eliminar');
    await queryInterface.removeColumn('Users', 'financieras_editar');
    await queryInterface.removeColumn('Users', 'financieras_ver');

    // Eliminar permisos de Bancos
    await queryInterface.removeColumn('Users', 'bancos_modificar');
    await queryInterface.removeColumn('Users', 'bancos_eliminar');
    await queryInterface.removeColumn('Users', 'bancos_editar');
    await queryInterface.removeColumn('Users', 'bancos_ver');

    // Eliminar permisos de Asesores
    await queryInterface.removeColumn('Users', 'asesores_modificar');
    await queryInterface.removeColumn('Users', 'asesores_eliminar');
    await queryInterface.removeColumn('Users', 'asesores_editar');
    await queryInterface.removeColumn('Users', 'asesores_ver');

    // Eliminar permisos de Clientes
    await queryInterface.removeColumn('Users', 'clientes_modificar');
    await queryInterface.removeColumn('Users', 'clientes_eliminar');
    await queryInterface.removeColumn('Users', 'clientes_editar');
    await queryInterface.removeColumn('Users', 'clientes_ver');

    // Eliminar permisos de Créditos
    await queryInterface.removeColumn('Users', 'creditos_modificar');
    await queryInterface.removeColumn('Users', 'creditos_eliminar');
    await queryInterface.removeColumn('Users', 'creditos_editar');
    await queryInterface.removeColumn('Users', 'creditos_ver');

    // Revertir el campo theme
    await queryInterface.changeColumn('Users', 'theme', {
      type: Sequelize.ENUM('light', 'dark'),
      allowNull: true
    });

    // Eliminar campos básicos
    await queryInterface.removeColumn('Users', 'estado');
    await queryInterface.removeColumn('Users', 'sucursal');
    await queryInterface.removeColumn('Users', 'telefono');
  }
};
