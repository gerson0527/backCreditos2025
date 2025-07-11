const db = require('../../models');
const { Op } = require('sequelize');
const Cliente = db.Cliente;
const Credito = db.Credito;
const Banco = db.Banco;
const Financiera = db.Financiera;
const Asesor = db.Asesor;

exports.search = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === '') {
      return res.json({ results: [] });
    }

    const [clientes, creditos] = await Promise.all([
      // 🎯 OBTENER TODOS LOS CAMPOS DEL CLIENTE
      Cliente.findAll({
        where: {
          [Op.or]: [
            { nombre: { [Op.like]: `%${q}%` } },
            { apellido: { [Op.like]: `%${q}%` } },
            { dni: { [Op.like]: `%${q}%` } }
          ]
        },
        attributes: [
          'id', 'nombre', 'apellido', 'dni', 'email', 'telefono', 
          'direccion', 'fechanacimiento', 'ingresosMensuales', 'estado',
          'createdAt', 'updatedAt'
        ],
        limit: 5
      }),
      // 🎯 OBTENER TODOS LOS CAMPOS DEL CRÉDITO CON RELACIONES
      Credito.findAll({
        where: {
          [Op.or]: [
            { id: { [Op.like]: `%${q}%` } },
            { '$cliente.nombre$': { [Op.like]: `%${q}%` } },
            { '$cliente.apellido$': { [Op.like]: `%${q}%` } }
          ]
        },
        include: [
          {
            model: Cliente,
            as: 'cliente',
            attributes: ['id', 'nombre', 'apellido', 'dni', 'email', 'telefono']
          },
          {
            model: Banco,
            as: 'banco',
            attributes: ['id', 'nombre'],
            required: false
          },
          {
            model: Financiera,
            as: 'financiera',
            attributes: ['id', 'nombre'],
            required: false
          },
          {
            model: Asesor,
            as: 'asesor',
            attributes: ['id', 'nombre'],
            required: false
          }
        ],
        attributes: [
          'id', 'monto', 'tasa', 'plazo', 'tipo', 'estado', 'garantia',
          'fechaSolicitud', 'fechaAprobacion', 'fechaVencimiento', 
          'observaciones', 'createdAt', 'updatedAt'
        ],
        limit: 5
      })
    ]);

    const results = [
      // 🎯 MAPEAR CLIENTES CON TODOS LOS DATOS
      ...clientes.map(cliente => ({
        id: cliente.id,
        type: 'cliente',
        title: `${cliente.nombre} ${cliente.apellido}`,
        subtitle: `DNI/RUC: ${cliente.dni}`,
        // 🎯 TODOS LOS CAMPOS PARA EL MODAL
        nombre: cliente.nombre,
        Apellido: cliente.apellido, // Nota: mantener la mayúscula como espera el modal
        apellido: cliente.apellido, // También en minúscula por compatibilidad
        dni: cliente.dni,
        email: cliente.email,
        telefono: cliente.telefono,
        direccion: cliente.direccion,
        fechanacimiento: cliente.fechanacimiento,
        ingresosMensuales: cliente.ingresosMensuales,
        estado: cliente.estado,
        creditosActivos: 0, // Se puede calcular si necesitas
        createdAt: cliente.createdAt,
        updatedAt: cliente.updatedAt
      })),
      // 🎯 MAPEAR CRÉDITOS CON TODOS LOS DATOS
      ...creditos.map(credito => ({
        id: credito.id,
        type: 'credito',
        title: `Crédito #${credito.id}`,
        subtitle: `Monto: $${credito.monto?.toLocaleString()} • ${credito.estado}`,
        // 🎯 TODOS LOS CAMPOS PARA EL MODAL
        cliente: credito.cliente ? `${credito.cliente.nombre} ${credito.cliente.apellido}` : 'Cliente no asignado',
        clienteId: credito.cliente?.id,
        clienteNombre: credito.cliente?.nombre,
        clienteApellido: credito.cliente?.apellido,
        clienteDni: credito.cliente?.dni,
        clienteEmail: credito.cliente?.email,
        clienteTelefono: credito.cliente?.telefono,
        monto: credito.monto,
        tasa: credito.tasa ? `${credito.tasa}%` : null,
        plazo: credito.plazo,
        tipo: credito.tipo,
        estado: credito.estado,
        garantia: credito.garantia,
        fechaSolicitud: credito.fechaSolicitud,
        fechaAprobacion: credito.fechaAprobacion,
        fechaVencimiento: credito.fechaVencimiento,
        observaciones: credito.observaciones,
        // 🎯 INFORMACIÓN DE RELACIONES
        banco: credito.banco?.nombre || 'No asignado',
        bancoId: credito.banco?.id,
        financiera: credito.financiera?.nombre,
        financieraId: credito.financiera?.id,
        asesor: credito.asesor?.nombre || 'No asignado',
        asesorId: credito.asesor?.id,
        createdAt: credito.createdAt,
        updatedAt: credito.updatedAt
      }))
    ];

    console.log('Resultados de búsqueda completos:', results); // 🎯 DEBUG

    res.json({ results });
  } catch (error) {
    console.error('Error en búsqueda:', error);
    res.status(500).json({ message: error.message });
  }
};

// 🎯 ACTUALIZAR MÉTODO DE BÚSQUEDA ESPECÍFICA DE CLIENTES
exports.searchClients = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === '') {
      return res.json({ results: [] });
    }

    const clientes = await Cliente.findAll({
      where: {
        [Op.or]: [
          { nombre: { [Op.like]: `%${q}%` } },
          { apellido: { [Op.like]: `%${q}%` } },
          { dni: { [Op.like]: `%${q}%` } }
        ]
      },
      attributes: [
        'id', 'nombre', 'apellido', 'dni', 'email', 'telefono', 
        'direccion', 'fechanacimiento', 'ingresosMensuales', 'estado'
      ],
      limit: 10
    });

    const results = clientes.map(cliente => ({
      id: cliente.id,
      type: 'cliente',
      title: `${cliente.nombre} ${cliente.apellido}`,
      subtitle: `DNI/RUC: ${cliente.dni}`,
      // 🎯 DATOS COMPLETOS
      nombre: cliente.nombre,
      Apellido: cliente.apellido,
      apellido: cliente.apellido,
      dni: cliente.dni,
      email: cliente.email,
      telefono: cliente.telefono,
      direccion: cliente.direccion,
      fechanacimiento: cliente.fechanacimiento,
      ingresosMensuales: cliente.ingresosMensuales,
      estado: cliente.estado,
      creditosActivos: 0
    }));

    res.json({ results });
  } catch (error) {
    console.error('Error en búsqueda de clientes:', error);
    res.status(500).json({ message: error.message });
  }
};

// 🎯 ACTUALIZAR MÉTODO DE BÚSQUEDA ESPECÍFICA DE CRÉDITOS
exports.searchCredits = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === '') {
      return res.json({ results: [] });
    }

    const creditos = await Credito.findAll({
      where: {
        [Op.or]: [
          { id: { [Op.like]: `%${q}%` } },
          { '$cliente.nombre$': { [Op.like]: `%${q}%` } },
          { '$cliente.apellido$': { [Op.like]: `%${q}%` } }
        ]
      },
      include: [
        {
          model: Cliente,
          as: 'cliente',
          attributes: ['id', 'nombre', 'apellido', 'dni', 'email', 'telefono']
        },
        {
          model: Banco,
          as: 'banco',
          attributes: ['id', 'nombre'],
          required: false
        },
        {
          model: Financiera,
          as: 'financiera',
          attributes: ['id', 'nombre'],
          required: false
        },
        {
          model: Asesor,
          as: 'asesor',
          attributes: ['id', 'nombre'],
          required: false
        }
      ],
      attributes: [
        'id', 'monto', 'tasa', 'plazo', 'tipo', 'estado', 'garantia',
        'fechaSolicitud', 'fechaAprobacion', 'fechaVencimiento', 'observaciones'
      ],
      limit: 10
    });

    const results = creditos.map(credito => ({
      id: credito.id,
      type: 'credito',
      title: `Crédito #${credito.id}`,
      subtitle: `Monto: $${credito.monto?.toLocaleString()} • ${credito.estado}`,
      // 🎯 DATOS COMPLETOS
      cliente: credito.cliente ? `${credito.cliente.nombre} ${credito.cliente.apellido}` : 'Cliente no asignado',
      monto: credito.monto,
      tasa: credito.tasa ? `${credito.tasa}%` : null,
      plazo: credito.plazo,
      tipo: credito.tipo,
      estado: credito.estado,
      garantia: credito.garantia,
      fechaSolicitud: credito.fechaSolicitud,
      fechaAprobacion: credito.fechaAprobacion,
      fechaVencimiento: credito.fechaVencimiento,
      observaciones: credito.observaciones,
      banco: credito.banco?.nombre || 'No asignado',
      asesor: credito.asesor?.nombre || 'No asignado'
    }));

    res.json({ results });
  } catch (error) {
    console.error('Error en búsqueda de créditos:', error);
    res.status(500).json({ message: error.message });
  }
};

// 🎯 NUEVO: MÉTODO PARA OBTENER DATOS COMPLETOS POR ID (OPCIONAL)
exports.getClienteById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const cliente = await Cliente.findByPk(id, {
      attributes: [
        'id', 'nombre', 'apellido', 'dni', 'email', 'telefono', 
        'direccion', 'fechanacimiento', 'ingresosMensuales', 'estado'
      ]
    });

    if (!cliente) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    // 🎯 CONTAR CRÉDITOS ACTIVOS
    const creditosActivos = await Credito.count({
      where: { 
        clienteId: id,
        estado: { [Op.in]: ['Activo', 'Aprobado', 'Desembolsado'] }
      }
    });

    const result = {
      id: cliente.id,
      nombre: cliente.nombre,
      Apellido: cliente.apellido,
      apellido: cliente.apellido,
      dni: cliente.dni,
      email: cliente.email,
      telefono: cliente.telefono,
      direccion: cliente.direccion,
      fechanacimiento: cliente.fechanacimiento,
      ingresosMensuales: cliente.ingresosMensuales,
      estado: cliente.estado,
      creditosActivos
    };

    res.json(result);
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getCreditoById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const credito = await Credito.findByPk(id, {
      include: [
        {
          model: Cliente,
          as: 'cliente',
          attributes: ['id', 'nombre', 'apellido', 'dni', 'email', 'telefono']
        },
        {
          model: Banco,
          as: 'banco',
          attributes: ['id', 'nombre'],
          required: false
        },
        {
          model: Financiera,
          as: 'financiera',
          attributes: ['id', 'nombre'],
          required: false
        },
        {
          model: Asesor,
          as: 'asesor',
          attributes: ['id', 'nombre'],
          required: false
        }
      ],
      attributes: [
        'id', 'monto', 'tasa', 'plazo', 'tipo', 'estado', 'garantia',
        'fechaSolicitud', 'fechaAprobacion', 'fechaVencimiento', 'observaciones'
      ]
    });

    if (!credito) {
      return res.status(404).json({ message: 'Crédito no encontrado' });
    }

    const result = {
      id: credito.id,
      cliente: credito.cliente ? `${credito.cliente.nombre} ${credito.cliente.apellido}` : 'Cliente no asignado',
      monto: credito.monto,
      tasa: credito.tasa ? `${credito.tasa}%` : null,
      plazo: credito.plazo,
      tipo: credito.tipo,
      estado: credito.estado,
      garantia: credito.garantia,
      fechaSolicitud: credito.fechaSolicitud,
      fechaAprobacion: credito.fechaAprobacion,
      fechaVencimiento: credito.fechaVencimiento,
      observaciones: credito.observaciones,
      banco: credito.banco?.nombre || 'No asignado',
      asesor: credito.asesor?.nombre || 'No asignado'
    };

    res.json(result);
  } catch (error) {
    console.error('Error al obtener crédito:', error);
    res.status(500).json({ message: error.message });
  }
};