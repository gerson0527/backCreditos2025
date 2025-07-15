const db = require('../../models');
const Banco = db.Banco

exports.getBancos = async (req, res) => {
  try {
    const bancos = await Banco.findAll();
    res.json(bancos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createBanco = async (req, res) => {
  try {
    const banco = await Banco.create(req.body);
    res.status(201).json(banco);
  } catch (error) {
    console.error('Error creando banco:', error);
    res.status(400).json({ message: error.message });
  }
};

exports.updateBanco = async (req, res) => {
  try {
    const [updated] = await Banco.update(req.body, {
      where: { id: req.params.id }
    });
    if (updated) {
      const updatedBanco = await Banco.findByPk(req.params.id);
      return res.json(updatedBanco);
    }
    throw new Error('Banco no encontrado');
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteBanco = async (req, res) => {
  try {
    const deleted = await Banco.destroy({
      where: { id: req.params.id }
    });
    if (deleted) {
      return res.json({ message: 'Banco eliminado correctamente' });
    }
    throw new Error('Banco no encontrado');
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBancoById = async (req, res) => {
  try {
    const banco = await Banco.findByPk(req.params.id);
    if (!banco) {
      return res.status(404).json({ message: 'Banco no encontrado' });
    }
    res.json(banco);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};