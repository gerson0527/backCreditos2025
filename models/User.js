'use strict';

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('superadmin','admin', 'user'),
    defaultValue: 'user'
  },
  nombres: {
    type: DataTypes.STRING,
    allowNull: true
  },
  apellidos: {
    type: DataTypes.STRING,
    allowNull: true
  },
  correo: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  theme: {
    type: DataTypes.ENUM('light', 'dark', 'system'),
    defaultValue: 'system',
    allowNull: true
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sucursal: {
    type: DataTypes.STRING,
    allowNull: true
  },
  estado: {
    type: DataTypes.ENUM('activo', 'inactivo', 'suspendido'),
    defaultValue: 'activo',
    allowNull: false
  },
  refreshToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // 🎯 PERMISOS GRANULARES POR MÓDULO
  // Permisos para Créditos
  creditos_ver: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  creditos_crear: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  creditos_editar: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  creditos_eliminar: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Permisos para Clientes
  clientes_ver: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  clientes_crear: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  clientes_editar: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  clientes_eliminar: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Permisos para Asesores
  asesores_ver: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  asesores_crear: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  asesores_editar: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  asesores_eliminar: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Permisos para Bancos
  bancos_ver: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  bancos_crear: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  bancos_editar: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  bancos_eliminar: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Permisos para Financieras
  financieras_ver: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  financieras_crear: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  financieras_editar: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  financieras_eliminar: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Permisos para Objetivos
  objetivos_ver: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  objetivos_crear: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  objetivos_editar: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  objetivos_eliminar: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Permisos para Reportes
  reportes_ver: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  reportes_crear: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  reportes_editar: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  reportes_eliminar: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Permisos para Comisiones
  comisiones_ver: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  comisiones_crear: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  comisiones_editar: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  comisiones_eliminar: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Permisos para Configuración
  configuracion_ver: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  configuracion_crear: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  configuracion_editar: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  configuracion_eliminar: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Permisos para Gestión de Usuarios
  gestionUsuarios_ver: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  gestionUsuarios_crear: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  gestionUsuarios_editar: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  gestionUsuarios_eliminar: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
  });

  User.associate = function(models) {
    // Define aquí las asociaciones si las hay
    
    // Un usuario puede enviar muchos mensajes
    User.hasMany(models.Message, {
      foreignKey: 'sender_id',
      as: 'sentMessages'
    });

    // Un usuario puede recibir muchos mensajes
    User.hasMany(models.Message, {
      foreignKey: 'receiver_id',
      as: 'receivedMessages'
    });
  };

  return User;
};