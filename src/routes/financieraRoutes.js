const express = require('express');
const router = express.Router();
const financieraController = require('../controllers/financieraController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', financieraController.getFinancieras);
router.get('/:id', financieraController.getFinancieraById);
router.post('/', financieraController.createFinanciera);
router.put('/:id', financieraController.updateFinanciera);
router.delete('/:id', financieraController.deleteFinanciera);

module.exports = router;