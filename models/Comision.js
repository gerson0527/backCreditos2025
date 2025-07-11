'use strict';

module.exports = (sequelize, DataTypes) => {
  const Comision = sequelize.define('Comision', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    asesorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Asesores',
        key: 'id'
      }
    },
    bancoid: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Bancos',
        key: 'id'
      }
    },
    financieraId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Financieras',
        key: 'id'
      }
    },
    tipoEntidad: {
      type: DataTypes.ENUM('Banco', 'Financiera'),
      allowNull: false
    },
    periodo: {
      type: DataTypes.STRING, // Formato: "2024-07" (año-mes)
      allowNull: false
    },
    creditosAprobados: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    montoTotalGestionado: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    comisionBase: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    bonificaciones: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    deducciones: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    comisionTotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    estado: {
      type: DataTypes.ENUM('Pendiente', 'Aprobado', 'Pagado', 'Rechazado'),
      defaultValue: 'Pendiente'
    },
    fechaCalculo: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    fechaPago: {
      type: DataTypes.DATE,
      allowNull: true
    },
    metodoPago: {
      type: DataTypes.ENUM('Transferencia', 'Efectivo', 'Cheque'),
      allowNull: true
    },
    numeroTransferencia: {
      type: DataTypes.STRING,
      allowNull: true
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'Comisions',
    timestamps: true
  });

  Comision.associate = function(models) {
    Comision.belongsTo(models.Asesor, {
      foreignKey: 'asesorId',
      as: 'asesor'
    });
    
    Comision.belongsTo(models.Banco, {
      foreignKey: 'bancoid',
      as: 'banco'
    });
    
    Comision.belongsTo(models.Financiera, {
      foreignKey: 'financieraId',
      as: 'financiera'
    });
  };

  return Comision;
};