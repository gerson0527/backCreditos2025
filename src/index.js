const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
require('dotenv').config();
const frases = require('./frases');
const { sequelize, connectDB, runMigrations } = require('./config/database');
const db = require('../models');
const app = express();
const server = http.createServer(app);

// Importar rutas
const authRoutes = require('./routes/authRoutes'); 
const clienteRoutes = require('./routes/clienteRoutes');
const asesorRoutes = require('./routes/asesorRoutes');
const bancoRoutes = require('./routes/bancoRoutes');
const financieraRoutes = require('./routes/financieraRoutes');
const creditoRoutes = require('./routes/creditoRoutes');
const objetivoRoutes = require('./routes/objetivoRoutes');
const reportesRoutes = require('./routes/reporteRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const searchRoutes = require('./routes/searchRoutes');
const comisionRoutes = require('./routes/comisionRoutes');
const userRoutes = require('./routes/userRoutes'); // Nueva ruta para gestión de usuarios
const messageRoutes = require('./routes/messageRoutes'); // Nueva ruta para mensajes

// Configuración CORS para producción
const corsOptions = {
  origin: true, // Permite todos los orígenes
  credentials: true, // No necesita credenciales
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));

// Configurar Socket.IO con CORS
const io = socketIo(server, {
  cors: corsOptions
});

// Manejo explícito de OPTIONS para preflight
//app.options('*', cors(corsOptions));
app.use(cookieParser());
app.use(helmet());
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/asesores', asesorRoutes);
app.use('/api/bancos', bancoRoutes);
app.use('/api/financieras', financieraRoutes);
app.use('/api/creditos', creditoRoutes);
app.use('/api/objetivos', objetivoRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/comisiones', comisionRoutes);
app.use('/api/users', userRoutes); // Nueva ruta para gestión de usuarios
app.use('/api/chat', messageRoutes); // Nueva ruta para mensajes

// 🩺 Endpoint de salud básico
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: '✅ Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 💬 Endpoint para obtener usuarios para chat
app.get('/api/chat/users', async (req, res) => {
  try {
    const { User } = require('../models');
    const users = await User.findAll({
      attributes: ['id', 'nombres', 'apellidos', 'correo', 'role'],
      order: [['nombres', 'ASC']]
    });

    const formattedUsers = users.map(user => ({
      id: user.id,
      nombre: user.nombres || 'Sin nombre',
      apellido: user.apellidos || '',
      email: user.correo || '',
      rol: user.role || 'user',
      isOnline: connectedUsers.has(user.id), // Estado real basado en conexiones
      lastSeen: !connectedUsers.has(user.id) ? '5 min' : null
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// 🔄 Endpoint para ejecutar TODAS las migraciones desde el principio
app.post('/api/migrate', async (req, res) => {
  try {
    console.log('🔄 Iniciando ejecución completa de migraciones...');
    
    // Eliminar tabla de seguimiento de migraciones para forzar re-ejecución
    const { sequelize } = require('./config/database');
    await sequelize.query('DROP TABLE IF EXISTS SequelizeMeta');
    console.log('🗑️ Tabla SequelizeMeta eliminada - se ejecutarán todas las migraciones');
    
    // Ejecutar todas las migraciones desde el principio
    await runMigrations();
    
    res.status(200).json({
      message: '✅ Todas las migraciones ejecutadas correctamente desde el principio',
      timestamp: new Date().toISOString(),
      note: 'Se eliminó SequelizeMeta para forzar re-ejecución completa'
    });
  } catch (error) {
    console.error('❌ Error en migraciones completas:', error);
    res.status(500).json({
      message: '❌ Error ejecutando migraciones completas',
      error: error.message
    });
  }
});

app.use('/api/frases-motivacion', async (req, res) => {
  try {
    res.json(frases);
    
  } catch (error) {
    console.error('Error al obtener frases:', error);
    res.status(500).json({ error: 'Error al obtener frases motivacionales' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;

// Socket.IO para mensajería en tiempo real
const connectedUsers = new Map(); // Mapa de userId -> socketId

// Hacer connectedUsers accesible desde los controladores
app.set('connectedUsers', connectedUsers);

io.on('connection', (socket) => {
  console.log('📱 Usuario conectado:', socket.id);

  // Autenticar usuario con socket
  socket.on('authenticate', (userId) => {
    if (userId) {
      connectedUsers.set(userId, socket.id);
      socket.userId = userId;
      socket.join(`user_${userId}`); // Unirse a su propia sala
      console.log(`👤 Usuario ${userId} autenticado con socket ${socket.id}`);
      
      // Notificar a otros usuarios que este usuario está en línea
      socket.broadcast.emit('user_online', { userId, isOnline: true });
    }
  });

  // Enviar mensaje
  socket.on('send_message', async (data) => {
    try {
      const { receiverId, content } = data;
      const senderId = socket.userId;

      if (!senderId || !receiverId || !content) {
        socket.emit('message_error', { error: 'Datos incompletos' });
        return;
      }

      // Guardar mensaje en la base de datos
      const { Message } = require('../models');
      const message = await Message.create({
        sender_id: senderId,
        receiver_id: receiverId,
        message: content.trim(),
        timestamp: new Date(),
        is_read: false
      });

      // Formatear mensaje para envío
      const formattedMessage = {
        id: message.id,
        senderId: message.sender_id,
        receiverId: message.receiver_id,
        content: message.message,
        timestamp: message.timestamp,
        isRead: message.is_read
      };

      // Enviar mensaje al receptor si está conectado
      const receiverSocketId = connectedUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('new_message', formattedMessage);
      }

      // Confirmar envío al emisor
      socket.emit('message_sent', formattedMessage);

      console.log(`💬 Mensaje enviado de ${senderId} a ${receiverId}`);
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      socket.emit('message_error', { error: 'Error interno del servidor' });
    }
  });

  // Marcar mensajes como leídos
  socket.on('mark_as_read', async (data) => {
    try {
      const { senderId } = data;
      const receiverId = socket.userId;

      if (!receiverId || !senderId) {
        return;
      }

      const { Message } = require('../models');
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

      // Notificar al emisor que sus mensajes fueron leídos
      const senderSocketId = connectedUsers.get(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit('messages_read', { readById: receiverId });
      }

      console.log(`✅ Mensajes marcados como leídos de ${senderId} a ${receiverId}`);
    } catch (error) {
      console.error('Error marcando mensajes como leídos:', error);
    }
  });

  // Usuario escribiendo
  socket.on('typing', (data) => {
    const { receiverId, isTyping } = data;
    const receiverSocketId = connectedUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_typing', {
        userId: socket.userId,
        isTyping
      });
    }
  });

  // Desconexión
  socket.on('disconnect', () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      console.log(`👋 Usuario ${socket.userId} desconectado`);
      
      // Notificar a otros usuarios que este usuario está desconectado
      socket.broadcast.emit('user_online', { 
        userId: socket.userId, 
        isOnline: false 
      });
    }
    console.log('📱 Socket desconectado:', socket.id);
  });
});

// Initialize database connection and run migrations
connectDB().then(async () => {
  await runMigrations();
  
  server.listen(PORT, () => {
    console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
    console.log(`📡 Socket.IO servidor listo para conexiones`);
  });
}).catch(error => {
  console.error('Error al iniciar el servidor:', error);
  process.exit(1);
});