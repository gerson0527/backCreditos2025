const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(protect);

// Obtener usuarios disponibles para chat
router.get('/users', messageController.getUsers);

// Obtener mensajes entre dos usuarios usando query parameters
router.get('/messages', messageController.getMessages);

// Obtener mensajes entre el usuario actual y otro usuario (ruta alternativa)
router.get('/conversation/:userId', messageController.getMessages);

// Enviar un nuevo mensaje
router.post('/send', messageController.sendMessage);

// Marcar mensajes como leídos
router.put('/read/:senderId', messageController.markAsRead);

// Obtener conteo de mensajes no leídos
router.get('/unread-counts', messageController.getUnreadCounts);

module.exports = router;
