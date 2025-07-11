const express = require('express');
const router = express.Router();
const creditoController = require('../controllers/creditoController');
const { protect } = require('../middleware/auth');


router.use(protect); 

router.get('/', creditoController.getCreditos);
router.get('/template', creditoController.getTemplateCreditosExcel);  // Ruta para descargar template
router.get('/:id', creditoController.getCreditoById);
router.get('/cliente/:clienteId', creditoController.getCreditosByCliente);
router.get('/asesor/:asesorId', creditoController.getCreditosByAsesor);
router.post('/', creditoController.createCredito);
router.post('/upload-excel', creditoController.uploadCreditos, creditoController.processExcelCreditos);  // Ruta para subir Excel
router.put('/:id', creditoController.updateCredito);
router.delete('/:id', creditoController.deleteCredito);

module.exports = router;