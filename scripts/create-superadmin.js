const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');


// Configurar conexión a la base de datos usando las variables de entorno
let sequelize;

if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'mysql',
    logging: false,
  });
} else {
  console.error('❌ DATABASE_URL no configurada');
  process.exit(1);
}

const createSuperAdmin = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a la base de datos');

    // Verificar si ya existe un superadmin
    const [existingUsers] = await sequelize.query(
      'SELECT id, username FROM Users WHERE role = "superadmin" LIMIT 1'
    );

    if (existingUsers.length > 0) {
      console.log('⚠️ Ya existe un usuario superadmin:', existingUsers[0].username);
      console.log('🚫 No se creará otro usuario superadmin');
      return;
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const now = new Date();

    // Insertar usuario superadmin
    await sequelize.query(`
      INSERT INTO Users (
        username, password, role, nombres, apellidos, correo, telefono, sucursal, estado, theme,
        creditos_ver, creditos_crear, creditos_editar, creditos_eliminar,
        clientes_ver, clientes_crear, clientes_editar, clientes_eliminar,
        asesores_ver, asesores_crear, asesores_editar, asesores_eliminar,
        bancos_ver, bancos_crear, bancos_editar, bancos_eliminar,
        financieras_ver, financieras_crear, financieras_editar, financieras_eliminar,
        objetivos_ver, objetivos_crear, objetivos_editar, objetivos_eliminar,
        reportes_ver, reportes_crear, reportes_editar, reportes_eliminar,
        comisiones_ver, comisiones_crear, comisiones_editar, comisiones_eliminar,
        configuracion_ver, configuracion_crear, configuracion_editar, configuracion_eliminar,
        gestionUsuarios_ver, gestionUsuarios_crear, gestionUsuarios_editar, gestionUsuarios_eliminar,
        createdAt, updatedAt
      ) VALUES (
        'admin', ?, 'superadmin', 'Administrador', 'light', 'admin@sistema.com', '+1234567890', 'Principal', 'activo', 'system',
        1, 1, 1, 1,
        1, 1, 1, 1,
        1, 1, 1, 1,
        1, 1, 1, 1,
        1, 1, 1, 1,
        1, 1, 1, 1,
        1, 1, 1, 1,
        1, 1, 1, 1,
        1, 1, 1, 1,
        1, 1, 1, 1,
        ?, ?
      )
    `, {
      replacements: [hashedPassword, now, now]
    });

    console.log('✅ Usuario superadmin creado exitosamente');
    console.log('📝 Credenciales de acceso:');
    console.log('   👤 Usuario: admin');
    console.log('   🔑 Contraseña: admin123');
    console.log('');
    console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer login');
    console.log('🎯 El usuario tiene TODOS los permisos habilitados');

  } catch (error) {
    console.error('❌ Error al crear usuario superadmin:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

// Ejecutar solo si se llama directamente
if (require.main === module) {
  createSuperAdmin();
}

module.exports = createSuperAdmin;
