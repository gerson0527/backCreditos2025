const db = require('../../models');
const Asesor = db.Asesor;
const { QueryTypes } = require('sequelize');

exports.getAllAsesores = async (req, res) => {
  try {
    // Obtener fecha del primer día del mes actual
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    const inicioMesStr = inicioMes.toISOString().split('T')[0];

    // Consulta SQL con LEFT JOIN - usando nombres de tabla correctos
    const query = `
      SELECT 
        a.id,
        a.nombre,
        a.email,
        a.telefono,
        a.cargo,
        a.sucursal,
        a.fechaIngreso,
        a.createdAt,
        a.updatedAt,
        COUNT(c.id) as totalCreditos,
        COUNT(CASE WHEN c.estado IN ('Aprobado', 'Desembolsado', 'Activo') THEN 1 END) as creditosAprobados,
        COUNT(CASE WHEN c.estado = 'Rechazado' THEN 1 END) as creditosRechazados,
        COUNT(CASE WHEN c.estado IN ('Pendiente', 'En Revisión', 'Documentos Pendientes') THEN 1 END) as creditosPendientes,
        COALESCE(SUM(CASE WHEN c.fechaSolicitud >= :inicioMes THEN c.monto ELSE 0 END), 0) as montoGestionado,
        CASE 
          WHEN COUNT(CASE WHEN c.fechaSolicitud >= :inicioMes THEN 1 END) = 0 THEN 0
          ELSE ROUND(
            (COUNT(CASE WHEN c.fechaSolicitud >= :inicioMes AND c.estado IN ('Aprobado', 'Desembolsado', 'Activo') THEN 1 END) * 100.0) / 
            COUNT(CASE WHEN c.fechaSolicitud >= :inicioMes THEN 1 END)
          )
        END as tasaAprobacion
      FROM asesor a
      LEFT JOIN Creditos c ON a.id = c.asesorId AND c.fechaSolicitud >= :inicioMes
      GROUP BY a.id, a.nombre, a.email, a.telefono, a.cargo, a.sucursal, a.fechaIngreso, a.createdAt, a.updatedAt
      ORDER BY a.nombre ASC
    `;

    const asesores = await db.sequelize.query(query, {
      replacements: { inicioMes: inicioMesStr },
      type: QueryTypes.SELECT
    });

    // Procesar los resultados y agregar campos calculados
    const asesoresConEstadisticas = asesores.map(asesor => {
      const totalCreditosEsteMes = parseInt(asesor.totalCreditos) || 0;
      const creditosAprobados = parseInt(asesor.creditosAprobados) || 0;
      const tasaAprobacion = parseInt(asesor.tasaAprobacion) || 0;
      const montoGestionado = parseFloat(asesor.montoGestionado) || 0;

      // Determinar rendimiento basado en tasa de aprobación y cantidad de créditos
      let rendimiento = 'Nuevo';
      if (totalCreditosEsteMes > 0) {
        if (tasaAprobacion >= 80 && totalCreditosEsteMes >= 10) {
          rendimiento = 'Alto';
        } else if (tasaAprobacion >= 60 && totalCreditosEsteMes >= 5) {
          rendimiento = 'Medio';
        } else if (totalCreditosEsteMes >= 0) {
          rendimiento = 'Bajo';
        }
      }

      // Formatear monto
      const montoFormateado = new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN',
        minimumFractionDigits: 0
      }).format(montoGestionado);

      return {
        id: asesor.id,
        nombre: asesor.nombre,
        email: asesor.email,
        telefono: asesor.telefono,
        cargo: asesor.cargo,
        sucursal: asesor.sucursal,
        fechaIngreso: asesor.fechaIngreso,
        createdAt: asesor.createdAt,
        updatedAt: asesor.updatedAt,
        creditos: totalCreditosEsteMes,
        tasaAprobacion: tasaAprobacion,
        rendimiento: rendimiento,
        monto: montoFormateado,
        montoNumerico: montoGestionado,
        creditosAprobados: creditosAprobados,
        creditosRechazados: parseInt(asesor.creditosRechazados) || 0,
        creditosPendientes: parseInt(asesor.creditosPendientes) || 0
      };
    });

    res.json(asesoresConEstadisticas);
    console.log('Asesores obtenidos correctamente:', asesoresConEstadisticas.length);
  } catch (error) {
    console.error('Error al obtener asesores:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.createAsesor = async (req, res) => {
  try {
    // En Sequelize no se usa 'new', se usa directamente el método create
    const nuevoAsesor = await Asesor.create(req.body);
    res.status(201).json(nuevoAsesor);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

exports.updateAsesor = async (req, res) => {
  try {
    const [updated] = await Asesor.update(req.body, {
      where: { id: req.params.id }
    });
    if (updated) {
      const asesorActualizado = await Asesor.findByPk(req.params.id);
      res.json(asesorActualizado);
    } else {
      res.status(404).json({ message: 'Asesor no encontrado' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteAsesor = async (req, res) => {
  try {
    // Sequelize usa destroy en lugar de findByIdAndDelete
    const deleted = await Asesor.destroy({
      where: { id: req.params.id }
    });
    
    if (deleted) {
      res.json({ message: 'Asesor eliminado correctamente' });
    } else {
      res.status(404).json({ message: 'Asesor no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAsesorById = async (req, res) => {
  try {
    // Sequelize usa findByPk (find by primary key) en lugar de findById
    const asesor = await Asesor.findByPk(req.params.id);
    if (!asesor) {
      return res.status(404).json({ message: 'Asesor no encontrado' });
    }
    res.json(asesor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};