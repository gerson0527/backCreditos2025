const express = require('express');
const router = express.Router();
const asesorController = require('../controllers/asesorController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', asesorController.getAllAsesores);
router.get('/:id', asesorController.getAsesorById); 
router.post('/', asesorController.createAsesor);
router.put('/:id', asesorController.updateAsesor);
router.delete('/:id', asesorController.deleteAsesor);

module.exports = router;
