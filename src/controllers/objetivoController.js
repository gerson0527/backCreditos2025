const db = require('../../models');
const Objetivo = db.Objetivo;
const Asesor = db.Asesor;

const objetivoController = {
  // Get all objetivos with their asesores
  getAllObjetivos: async (req, res) => {
    try {
      const objetivos = await Objetivo.findAll({
        include: [{
          model: Asesor,
          as: 'asesor',
          attributes: ['id', 'nombre']
        }]
      });
      res.json({
        success: true,
        data: objetivos
      });
    } catch (error) {
      console.error('Error fetching objetivos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener los objetivos'
      });
    }
  },

  // Get single objetivo by ID
  getObjetivoById: async (req, res) => {
    try {
      const objetivo = await Objetivo.findByPk(req.params.id, {
        include: [{
          model: Asesor,
          as: 'asesor',
          attributes: ['id', 'nombre', 'apellido']
        }]
      });

      if (!objetivo) {
        return res.status(404).json({
          success: false,
          message: 'Objetivo no encontrado'
        });
      }

      res.json({
        success: true,
        data: objetivo
      });
    } catch (error) {
      console.error('Error fetching objetivo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener el objetivo'
      });
    }
  },

  // Create new objetivo
  createObjetivo: async (req, res) => {
    try {
      const { nombre, meta, fechaInicio, fechaFin } = req.body;

      // Basic validation
      if (!nombre || !meta || !fechaInicio || !fechaFin) {
        return res.status(400).json({
          success: false,
          message: 'Nombre, meta, fechaInicio y fechaFin son requeridos'
        });
      }

      const objetivo = await Objetivo.create(req.body);
      
      res.status(201).json({
        success: true,
        data: objetivo
      });
    } catch (error) {
      console.error('Error creating objetivo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear el objetivo'
      });
    }
  },

  // Update objetivo
  updateObjetivo: async (req, res) => {
    try {
      const objetivo = await Objetivo.findByPk(req.params.id);

      if (!objetivo) {
        return res.status(404).json({
          success: false,
          message: 'Objetivo no encontrado'
        });
      }

      // Prevent updating certain fields
      const { id, createdAt, updatedAt, ...safeUpdates } = req.body;
      
      await objetivo.update(safeUpdates);
      
      res.json({
        success: true,
        data: objetivo
      });
    } catch (error) {
      console.error('Error updating objetivo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar el objetivo'
      });
    }
  },

  // Delete objetivo
  deleteObjetivo: async (req, res) => {
    try {
      const objetivo = await Objetivo.findByPk(req.params.id);

      if (!objetivo) {
        return res.status(404).json({
          success: false,
          message: 'Objetivo no encontrado'
        });
      }

      await objetivo.destroy();
      
      res.json({
        success: true,
        message: 'Objetivo eliminado correctamente'
      });
    } catch (error) {
      console.error('Error deleting objetivo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar el objetivo'
      });
    }
  },

  // Get objetivos by asesor
  getObjetivosByAsesor: async (req, res) => {
    try {
      const objetivos = await Objetivo.findAll({
        where: { asesorId: req.params.asesorId },
        include: [{
          model: Asesor,
          attributes: ['id', 'nombre', 'apellido']
        }]
      });

      res.json({
        success: true,
        data: objetivos
      });
    } catch (error) {
      console.error('Error fetching objetivos by asesor:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener los objetivos del asesor'
      });
    }
  }
};

module.exports = objetivoController;