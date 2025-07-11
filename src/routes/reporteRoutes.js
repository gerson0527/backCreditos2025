const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');
const { protect } = require('../middleware/auth');
router.use(protect);

// Ruta para obtener reporte por período
router.get('/periodo', reporteController.getReportePeriodo);

// Ruta para obtener reporte ranking de asesores
router.get('/asesores/rankingasesores', reporteController.getRankingAsesores);

// Ruta para obtener reporte de bancos
router.get('/bancos', reporteController.getReporteBancos);

// Ruta para obtener reporte de morosidad
router.get('/morosidad', reporteController.getReporteMorosidad);

//ruta para buscar los creditos todos los meses
router.get('/creditos/meses', reporteController.getCreditosMeses);

//ruta por resumen por banco
router.get('/resumen/bancos', reporteController.getResumenPorBanco);

//ruta por resumen por financiera
router.get('/resumen/financieras', reporteController.getResumenPorFinanciera);

//ruta por resumen por estado
router.get('/resumen/estados', reporteController.getResumenPorEstado);

// exportar en excel
router.post('/exportar/excel', reporteController.exportarExcel);

// exportar en pdf
router.post('/exportar/pdf', reporteController.exportarPDF); 

module.exports = router;