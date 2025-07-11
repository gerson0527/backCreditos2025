const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');
const { protect } = require('../middleware/auth');

// Ruta pública para pruebas (sin protección)
router.get('/template-public', clienteController.getTemplateExcel);

router.use(protect);

router.get('/', clienteController.getAllClientes);
router.get('/search', clienteController.searchCliente);  // Moved before :id route
router.get('/template', clienteController.getTemplateExcel);  // Ruta para descargar template
router.get('/:id', clienteController.getClienteById);
router.post('/', clienteController.createCliente);
router.post('/upload-excel', clienteController.uploadClientes, clienteController.processExcelClientes);  // Ruta para subir Excel
router.put('/:id', clienteController.updateCliente);
router.delete('/:id', clienteController.deleteCliente); 

module.exports = router;