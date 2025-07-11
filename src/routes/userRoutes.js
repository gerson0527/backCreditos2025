const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../utils/permissionsUtils');

// Aplicar autenticación a todas las rutas
router.use(protect);

// 🎯 RUTAS PARA GESTIÓN DE USUARIOS

/**
 * GET /api/users
 * Obtener lista de usuarios con paginación y filtros
 * Requiere permiso: gestionUsuarios.ver
 */
router.get('/', checkPermission('gestionUsuarios', 'ver'), userController.getUsers);

/**
 * GET /api/users/stats
 * Obtener estadísticas de usuarios
 * Requiere permiso: gestionUsuarios.ver
 */
router.get('/stats', checkPermission('gestionUsuarios', 'ver'), userController.getUserStats);

/**
 * GET /api/users/:id
 * Obtener un usuario específico por ID
 * Requiere permiso: gestionUsuarios.ver
 */
router.get('/:id', checkPermission('gestionUsuarios', 'ver'), userController.getUserById);

/**
 * POST /api/users
 * Crear un nuevo usuario
 * Requiere permiso: gestionUsuarios.crear
 */
router.post('/', checkPermission('gestionUsuarios', 'crear'), userController.createUser);

/**
 * PUT /api/users/:id
 * Actualizar un usuario existente
 * Requiere permiso: gestionUsuarios.editar
 */
router.put('/:id', checkPermission('gestionUsuarios', 'editar'), userController.updateUser);

/**
 * DELETE /api/users/:id
 * Eliminar un usuario
 * Requiere permiso: gestionUsuarios.eliminar
 */
router.delete('/:id', checkPermission('gestionUsuarios', 'eliminar'), userController.deleteUser);

module.exports = router;
