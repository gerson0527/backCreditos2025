'use strict';

module.exports = (sequelize, DataTypes) => {
  const Objetivo = sequelize.define('Objetivo', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    titulo: {
      type: DataTypes.STRING,
      allowNull: false
    },
    tipo: {
      type: DataTypes.STRING,
      allowNull: false
    },
    unidad: {
      type: DataTypes.STRING
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    meta: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    fechaInicio: {
      type: DataTypes.DATE,
      allowNull: false
    },
    fechaFin: {
      type: DataTypes.DATE,
      allowNull: false
    },
    asesorId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Asesores',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    prioridad: {
      type: DataTypes.STRING
    },
    estado: {
      type: DataTypes.ENUM('PENDIENTE', 'EN_PROGRESO', 'COMPLETADO', 'CANCELADO'),
      defaultValue: 'PENDIENTE'
    }
  }, {
    tableName: 'Objetivos',
    timestamps: true
  });

  Objetivo.associate = function(models) {
    Objetivo.belongsTo(models.Asesor, {
      foreignKey: 'asesorId',
      as: 'asesor'
    });
  };

  return Objetivo;
};