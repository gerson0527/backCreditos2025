'use strict';

module.exports = (sequelize, DataTypes) => {
  const Banco = sequelize.define('Banco', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tipo: {
    type: DataTypes.STRING
  },
  personaContacto: {
    type: DataTypes.STRING
  },
  telefono: {
    type: DataTypes.STRING
  },
  email: {
    type: DataTypes.STRING
  },
  tasaBase: {
    type: DataTypes.DECIMAL(5, 2)
  },
  comisionban: {
    type: DataTypes.STRING
  },
  direccion: {
    type: DataTypes.TEXT
  },
  estado: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
  }, {
    tableName: 'Bancos',
    timestamps: true
  });

  Banco.associate = function(models) {
    // Define aquí las asociaciones si las hay
  };

  return Banco;
};