const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Message = sequelize.define('Message', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'sender_id'
    },
    receiver_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'receiver_id'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_read'
    }
  }, {
    tableName: 'messages',
    timestamps: false, // Desactivar timestamps automáticos ya que usamos 'timestamp'
    underscored: true,
    indexes: [
      {
        fields: ['sender_id']
      },
      {
        fields: ['receiver_id']
      },
      {
        fields: ['timestamp']
      },
      {
        fields: ['is_read']
      },
      {
        fields: ['sender_id', 'receiver_id']
      }
    ]
  });

  // Asociaciones
  Message.associate = function(models) {
    // Un mensaje pertenece a un usuario emisor
    Message.belongsTo(models.User, {
      foreignKey: 'sender_id',
      as: 'sender'
    });

    // Un mensaje pertenece a un usuario receptor
    Message.belongsTo(models.User, {
      foreignKey: 'receiver_id',
      as: 'receiver'
    });
  };

  return Message;
};
