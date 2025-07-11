const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/cambiar-password', authController.cambiarPassword);

router.use(protect);
// Ruta para obtener el perfil del usuario autenticado
router.get('/perfil', authController.obtenerPerfil);
// Ruta para actualizar el perfil del usuario autenticado
router.put('/perfil', authController.actualizarPerfil);
// Ruta para actualizar el tema del usuario autenticado
router.put('/tema', authController.actualizarTema);

module.exports = router;