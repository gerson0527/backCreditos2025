const db = require('../../models');
const Financiera = db.Financiera;

exports.getFinancieras = async (req, res) => {
  try {
    const financieras = await Financiera.findAll();
    res.json(financieras);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createFinanciera = async (req, res) => {
  try {
    const financiera = await Financiera.create(req.body);
    res.status(201).json(financiera);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateFinanciera = async (req, res) => {
  try {
    const [updated] = await Financiera.update(req.body, {
      where: { id: req.params.id }
    });
    if (updated) {
      const updatedFinanciera = await Financiera.findByPk(req.params.id);
      return res.json(updatedFinanciera);
    }
    throw new Error('Financiera no encontrada');
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteFinanciera = async (req, res) => {
  try {
    const deleted = await Financiera.destroy({
      where: { id: req.params.id }
    });
    if (deleted) {
      return res.json({ message: 'Financiera eliminada correctamente' });
    }
    throw new Error('Financiera no encontrada');
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFinancieraById = async (req, res) => {
  try {
    const financiera = await Financiera.findByPk(req.params.id);
    if (!financiera) {
      return res.status(404).json({ message: 'Financiera no encontrada' });
    }
    res.json(financiera);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};