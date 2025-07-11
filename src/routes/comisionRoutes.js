const express = require('express');
const router = express.Router();
const comisionController = require('../controllers/comisionController');
const { protect } = require('../middleware/auth');

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);

// Rutas principales
router.get('/', comisionController.getAllComisiones);
router.get('/resumen', comisionController.getResumenComisiones);
router.post('/calcular', comisionController.calcularComisionesPeriodo);
router.put('/:id', comisionController.updateComision);
router.delete('/:id', comisionController.deleteComision);

// Rutas específicas para obtener comisiones por filtros
router.get('/asesor/:asesorId', comisionController.getComisionesByAsesor);
router.get('/periodo/:periodo', comisionController.getComisionesByPeriodo);

module.exports = router;