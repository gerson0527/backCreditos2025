const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const auth = require('../middleware/auth');

// Aplicar middleware de autenticación a todas las rutas
router.use(auth.protect);

// Ruta para búsqueda general
router.get('/', searchController.search);

// Ruta para búsqueda específica de clientes
router.get('/clients', searchController.searchClients);

// Ruta para búsqueda específica de créditos
router.get('/credits', searchController.searchCredits);

module.exports = router;