'use strict';

module.exports = (sequelize, DataTypes) => {
  const Financiera = sequelize.define('Financiera', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  especializacion: {
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
  tasaPromedio: {
    type: DataTypes.DECIMAL(5, 2)
  },
  comisionfin: {
    type: DataTypes.STRING
  },
  descripcion: {
    type: DataTypes.TEXT
  },
  estado: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
  }, {
    tableName: 'Financieras',
    timestamps: true
  });

  Financiera.associate = function(models) {
    // Define aquí las asociaciones si las hay
  };

  return Financiera;
};