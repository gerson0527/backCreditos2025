const express = require('express');
const router = express.Router();
const bancoController = require('../controllers/bancoController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', bancoController.getBancos);
router.get('/:id', bancoController.getBancoById);
router.post('/', bancoController.createBanco);
router.put('/:id', bancoController.updateBanco);
router.delete('/:id', bancoController.deleteBanco);

module.exports = router;