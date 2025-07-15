const { User, Message } = require('../../models');
const { Op } = require('sequelize');

// Obtener todos los usuarios disponibles para chat (excluyendo el usuario actual)
const getUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    
    const users = await User.findAll({
      where: {
        id: { [Op.ne]: currentUserId }
      },
      attributes: ['id', 'nombres', 'apellidos', 'correo', 'role'],
      order: [['nombres', 'ASC']]
    });

    // Obtener usuarios conectados desde Socket.IO
    const connectedUsers = req.app.get('connectedUsers') || new Map();

    // Formatear la respuesta para el frontend
    const formattedUsers = users.map(user => ({
      id: user.id,
      nombre: user.nombres || 'Sin nombre',
      apellido: user.apellidos || '',
      email: user.correo || '',
      rol: user.role || 'user',
      isOnline: connectedUsers.has(user.id), // Estado real basado en Socket.IO
      lastSeen: connectedUsers.has(user.id) ? null : 'Desconectado'
    }));

    res.json({ users: formattedUsers });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener mensajes entre dos usuarios usando query parameters
const getMessages = async (req, res) => {
  try {
    const { user1, user2 } = req.query;
    const currentUserId = req.user.id;

    // Validar que uno de los usuarios sea el usuario actual
    if (parseInt(user1) !== currentUserId && parseInt(user2) !== currentUserId) {
      return res.status(403).json({ error: 'No autorizado para ver estos mensajes' });
    }

    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          {
            sender_id: parseInt(user1),
            receiver_id: parseInt(user2)
          },
          {
            sender_id: parseInt(user2),
            receiver_id: parseInt(user1)
          }
        ]
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'nombres', 'apellidos']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'nombres', 'apellidos']
        }
      ],
      order: [['timestamp', 'ASC']]
    });

    // Formatear mensajes para el frontend
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      senderId: msg.sender_id,
      receiverId: msg.receiver_id,
      content: msg.message,
      timestamp: msg.timestamp,
      isRead: msg.is_read
    }));

    res.json({ messages: formattedMessages });
  } catch (error) {
    console.error('Error obteniendo mensajes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Enviar un nuevo mensaje
const sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user.id;

    // Validaciones
    if (!receiverId || !content) {
      return res.status(400).json({ error: 'receiverId y content son requeridos' });
    }

    if (!content.trim()) {
      return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
    }

    // Verificar que el receptor existe
    const receiver = await User.findByPk(receiverId);
    if (!receiver) {
      return res.status(404).json({ error: 'Usuario receptor no encontrado' });
    }

    // Crear el mensaje
    const message = await Message.create({
      sender_id: senderId,
      receiver_id: receiverId,
      message: content.trim(),
      timestamp: new Date(),
      is_read: false
    });

    // Obtener el mensaje creado con las asociaciones
    const createdMessage = await Message.findByPk(message.id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'nombres', 'apellidos']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'nombres', 'apellidos']
        }
      ]
    });

    // Formatear respuesta
    const formattedMessage = {
      id: createdMessage.id,
      senderId: createdMessage.sender_id,
      receiverId: createdMessage.receiver_id,
      content: createdMessage.message,
      timestamp: createdMessage.timestamp,
      isRead: createdMessage.is_read
    };

    res.status(201).json({
      success: true,
      message: formattedMessage
    });
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Marcar mensajes como leídos
const markAsRead = async (req, res) => {
  try {
    const { senderId } = req.params;
    const receiverId = req.user.id;

    await Message.update(
      { is_read: true },
      {
        where: {
          sender_id: senderId,
          receiver_id: receiverId,
          is_read: false
        }
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error marcando mensajes como leídos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener conteo de mensajes no leídos por usuario
const getUnreadCounts = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const unreadCounts = await Message.findAll({
      attributes: [
        'sender_id',
        [Message.sequelize.fn('COUNT', Message.sequelize.col('id')), 'count']
      ],
      where: {
        receiver_id: currentUserId,
        is_read: false
      },
      group: ['sender_id']
    });

    // Formatear respuesta
    const counts = {};
    unreadCounts.forEach(item => {
      counts[item.sender_id] = parseInt(item.dataValues.count);
    });

    res.json(counts);
  } catch (error) {
    console.error('Error obteniendo conteo de mensajes no leídos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  getUsers,
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCounts
};
