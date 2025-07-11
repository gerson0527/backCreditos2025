const express = require('express');
const router = express.Router();
const objetivoController = require('../controllers/objetivoController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', objetivoController.getAllObjetivos);
router.get('/:id', objetivoController.getObjetivoById);
router.get('/asesor/:asesorId', objetivoController.getObjetivosByAsesor);
router.post('/', objetivoController.createObjetivo);
router.put('/:id', objetivoController.updateObjetivo);
router.delete('/:id', objetivoController.deleteObjetivo);

module.exports = router;