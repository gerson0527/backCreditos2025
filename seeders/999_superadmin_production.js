'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Verificar si ya existe un usuario superadmin
    const existingUser = await queryInterface.sequelize.query(
      'SELECT id FROM Users WHERE role = "superadmin" LIMIT 1',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existingUser.length > 0) {
      console.log('⚠️ Ya existe un usuario superadmin. Saltando seeder.');
      return;
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Insertar usuario superadmin con todos los permisos
    await queryInterface.bulkInsert('Users', [{
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      nombres: 'Administrador',
      apellidos: 'Sistema',
      correo: 'admin@sistema.com',
      telefono: '+1234567890',
      sucursal: 'Principal',
      estado: 'activo',
      theme: 'light',
      
      // 🎯 TODOS LOS PERMISOS HABILITADOS
      // Permisos para Créditos
      creditos_ver: true,
      creditos_crear: true,
      creditos_editar: true,
      creditos_eliminar: true,
      
      // Permisos para Clientes
      clientes_ver: true,
      clientes_crear: true,
      clientes_editar: true,
      clientes_eliminar: true,
      
      // Permisos para Asesores
      asesores_ver: true,
      asesores_crear: true,
      asesores_editar: true,
      asesores_eliminar: true,
      
      // Permisos para Bancos
      bancos_ver: true,
      bancos_crear: true,
      bancos_editar: true,
      bancos_eliminar: true,
      
      // Permisos para Financieras
      financieras_ver: true,
      financieras_crear: true,
      financieras_editar: true,
      financieras_eliminar: true,
      
      // Permisos para Objetivos
      objetivos_ver: true,
      objetivos_crear: true,
      objetivos_editar: true,
      objetivos_eliminar: true,
      
      // Permisos para Reportes
      reportes_ver: true,
      reportes_crear: true,
      reportes_editar: true,
      reportes_eliminar: true,
      
      // Permisos para Comisiones
      comisiones_ver: true,
      comisiones_crear: true,
      comisiones_editar: true,
      comisiones_eliminar: true,
      
      // Permisos para Configuración
      configuracion_ver: true,
      configuracion_crear: true,
      configuracion_editar: true,
      configuracion_eliminar: true,
      
      // Permisos para Gestión de Usuarios
      gestionUsuarios_ver: true,
      gestionUsuarios_crear: true,
      gestionUsuarios_editar: true,
      gestionUsuarios_eliminar: true,
      
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});

    console.log('✅ Usuario superadmin creado exitosamente');
    console.log('👤 Usuario: admin');
    console.log('🔑 Contraseña: admin123');
    console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer login');
  },

  async down (queryInterface, Sequelize) {
    // Eliminar el usuario superadmin
    await queryInterface.bulkDelete('Users', {
      username: 'admin',
      role: 'superadmin'
    }, {});
    
    console.log('🗑️ Usuario superadmin eliminado');
  }
};
