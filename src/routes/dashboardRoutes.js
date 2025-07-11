const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.use(protect);

// KPIs principales
router.get('/creditos-proceso', dashboardController.getCreditosProcesos);
router.get('/monto-solicitudes', dashboardController.getMontoSolicitudes);
router.get('/tasa-aprobacion', dashboardController.getTasaAprobacion);
router.get('/tiempo-promedio', dashboardController.getTiempoPromedio);

// Actividad reciente
router.get('/ultimas-solicitudes', dashboardController.getUltimasSolicitudes);

// Distribución y estadísticas
router.get('/distribucion-tipos', dashboardController.getDistribucionTipos);
router.get('/distribucion-estados', dashboardController.getDistribucionEstados);

module.exports = router;