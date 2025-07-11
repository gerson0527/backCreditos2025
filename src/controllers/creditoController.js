const db = require('../../models');
const Credito = db.Credito;
const Cliente = db.Cliente;
const Asesor = db.Asesor;
const Banco = db.Banco;
const Financiera = db.Financiera;
const Op = db.Sequelize.Op;
const XLSX = require('xlsx');
const multer = require('multer');
const path = require('path');

// Configuración de multer para archivos Excel
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB límite
  }
});

exports.getCreditos = async (req, res) => {
  try {
    const creditos = await Credito.findAll({
      include: [
        {
          association: 'cliente',
          attributes: ['nombre', 'apellido']
        },
        {
          association: 'asesor',
          attributes: ['nombre']
        },
        {
          association: 'banco',
          attributes: ['nombre']
        },
        {
          association: 'financiera',
          attributes: ['nombre']
        }
      ]
    });
    res.json(creditos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.createCredito = async (req, res) => {
  try {
    const credito = await Credito.create(req.body);
    res.status(201).json(credito);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateCredito = async (req, res) => {
  try {
    const [updated] = await Credito.update(req.body, {
      where: { id: req.params.id }
    });
    if (updated) {
      const updatedCredito = await Credito.findByPk(req.params.id, {
        include: [
          {
            association: 'cliente',
            attributes: ['nombre', 'apellido', 'dni']
          },
          {
            association: 'asesor',
            attributes: ['nombre']
          },
          {
            association: 'banco',
            attributes: ['nombre']
          },
          {
            association: 'financiera',
            attributes: ['nombre']
          }
        ]
      });
      return res.json(updatedCredito);
    }
    throw new Error('Crédito no encontrado');
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteCredito = async (req, res) => {
  try {
    const deleted = await Credito.destroy({
      where: { id: req.params.id }
    });
    if (deleted) {
      return res.json({ message: 'Crédito eliminado correctamente' });
    }
    throw new Error('Crédito no encontrado');
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCreditosByCliente = async (req, res) => {
  try {
    const creditos = await Credito.findAll({
      where: { clienteId: req.params.clienteId },
      include: [
        {
          association: 'asesor',
          attributes: ['nombre']
        },
        {
          association: 'banco',
          attributes: ['nombre']
        },
        {
          association: 'financiera',
          attributes: ['nombre']
        }
      ]
    });
    res.json(creditos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCreditosByAsesor = async (req, res) => {
  try {
    const creditos = await Credito.findAll({
      where: { asesorId: req.params.asesorId },
      include: [
        {
          association: 'cliente',
          attributes: ['nombre', 'apellido', 'dni']
        },
        {
          association: 'banco',
          attributes: ['nombre']
        },
        {
          association: 'financiera',
          attributes: ['nombre']
        }
      ]
    });
    res.json(creditos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCreditoById = async (req, res) => {
  try {
    const credito = await Credito.findByPk(req.params.id, {
      include: [
        {
          association: 'cliente',
          attributes: ['nombre', 'apellido', 'dni']
        },
        {
          association: 'asesor',
          attributes: ['nombre']
        },
        {
          association: 'banco',
          attributes: ['nombre']
        },
        {
          association: 'financiera',
          attributes: ['nombre']
        }
      ]
    });
    if (!credito) {
      return res.status(404).json({ message: 'Crédito no encontrado' });
    }
    res.json(credito);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.uploadCreditos = upload.single('excel');

exports.processExcelCreditos = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se ha subido ningún archivo' });
    }

    // Leer el archivo Excel
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convertir a JSON
    const creditosData = XLSX.utils.sheet_to_json(worksheet);

    if (creditosData.length === 0) {
      return res.status(400).json({ message: 'El archivo Excel está vacío' });
    }

    const resultados = {
      exitosos: [],
      errores: [],
      total: creditosData.length
    };

    // Procesar cada crédito
    for (let i = 0; i < creditosData.length; i++) {
      const creditoData = creditosData[i];
      const fila = i + 2; // +2 porque Excel empieza en 1 y la primera fila son headers

      try {
        // Validar campos obligatorios
        if (!creditoData.clienteDni || !creditoData.asesorNombre || 
            !creditoData.monto || !creditoData.tasa || !creditoData.plazo || !creditoData.tipo) {
          resultados.errores.push({
            fila: fila,
            error: 'Campos obligatorios faltantes (clienteDni, asesorNombre, monto, tasa, plazo, tipo)',
            datos: creditoData
          });
          continue;
        }

        // Validar que tenga banco O financiera, no ambos
        const tieneBanco = creditoData.bancoNombre && creditoData.bancoNombre.trim() !== '';
        const tieneFinanciera = creditoData.financieraNombre && creditoData.financieraNombre.trim() !== '';
        
        if (!tieneBanco && !tieneFinanciera) {
          resultados.errores.push({
            fila: fila,
            error: 'Debe especificar un banco O una financiera',
            datos: creditoData
          });
          continue;
        }

        if (tieneBanco && tieneFinanciera) {
          resultados.errores.push({
            fila: fila,
            error: 'No puede tener banco Y financiera al mismo tiempo. Elija solo uno',
            datos: creditoData
          });
          continue;
        }

        // Generar ID automáticamente
        const timestamp = Date.now().toString().slice(-6); // Últimos 6 dígitos del timestamp
        const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const creditoId = `CRE-${timestamp}${randomNum}`;

        // Buscar cliente por DNI
        const cliente = await Cliente.findOne({
          where: { dni: creditoData.clienteDni }
        });
        if (!cliente) {
          resultados.errores.push({
            fila: fila,
            error: `Cliente con DNI "${creditoData.clienteDni}" no encontrado`,
            datos: creditoData
          });
          continue;
        }

        // Buscar asesor por nombre
        const asesor = await Asesor.findOne({
          where: { nombre: { [Op.like]: `%${creditoData.asesorNombre}%` } }
        });
        if (!asesor) {
          resultados.errores.push({
            fila: fila,
            error: `Asesor "${creditoData.asesorNombre}" no encontrado`,
            datos: creditoData
          });
          continue;
        }

        let banco = null;
        let financiera = null;

        // Buscar banco si se especificó
        if (tieneBanco) {
          banco = await Banco.findOne({
            where: { nombre: { [Op.like]: `%${creditoData.bancoNombre}%` } }
          });
          if (!banco) {
            resultados.errores.push({
              fila: fila,
              error: `Banco "${creditoData.bancoNombre}" no encontrado`,
              datos: creditoData
            });
            continue;
          }
        }

        // Buscar financiera si se especificó
        if (tieneFinanciera) {
          financiera = await Financiera.findOne({
            where: { nombre: { [Op.like]: `%${creditoData.financieraNombre}%` } }
          });
          if (!financiera) {
            resultados.errores.push({
              fila: fila,
              error: `Financiera "${creditoData.financieraNombre}" no encontrada`,
              datos: creditoData
            });
            continue;
          }
        }

        // Preparar datos del crédito
        const nuevoCredito = {
          id: creditoId,
          clienteId: cliente.id,
          asesorId: asesor.id,
          financieraId: financiera ? financiera.id : null,
          bancoid: banco ? banco.id : null,
          monto: parseFloat(creditoData.monto),
          tasa: creditoData.tasa,
          plazo: parseInt(creditoData.plazo),
          tipo: creditoData.tipo,
          garantia: creditoData.garantia || null,
          estado: creditoData.estado || 'Pendiente',
          fechaSolicitud: creditoData.fechaSolicitud ? new Date(creditoData.fechaSolicitud) : new Date(),
          fechaAprobacion: creditoData.fechaAprobacion ? new Date(creditoData.fechaAprobacion) : null,
          fechaVencimiento: creditoData.fechaVencimiento ? new Date(creditoData.fechaVencimiento) : null,
          observaciones: creditoData.observaciones || null
        };

        // Crear el crédito
        const credito = await Credito.create(nuevoCredito);
        
        // Buscar el crédito creado con sus relaciones
        const creditoCompleto = await Credito.findByPk(credito.id, {
          include: [
            {
              association: 'cliente',
              attributes: ['nombre', 'apellido', 'dni']
            },
            {
              association: 'asesor',
              attributes: ['nombre']
            },
            {
              association: 'banco',
              attributes: ['nombre']
            },
            {
              association: 'financiera',
              attributes: ['nombre']
            }
          ]
        });

        resultados.exitosos.push({
          fila: fila,
          credito: creditoCompleto
        });

      } catch (error) {
        resultados.errores.push({
          fila: fila,
          error: error.message,
          datos: creditoData
        });
      }
    }

    // Eliminar el archivo temporal
    const fs = require('fs');
    fs.unlinkSync(req.file.path);

    res.json({
      message: 'Procesamiento completado',
      resultados: resultados
    });

  } catch (error) {
    console.error('Error procesando archivo Excel:', error);
    res.status(500).json({ message: 'Error procesando archivo Excel: ' + error.message });
  }
};

exports.getTemplateCreditosExcel = async (req, res) => {
  try {
    // Obtener datos de ejemplo para el template
    const clienteEjemplo = await Cliente.findOne();
    const asesorEjemplo = await Asesor.findOne();
    const bancoEjemplo = await Banco.findOne();
    const financieraEjemplo = await Financiera.findOne();

    // Crear un archivo template con las columnas esperadas
    const template = [
      {
        clienteDni: clienteEjemplo ? clienteEjemplo.dni : '12345678',
        asesorNombre: asesorEjemplo ? asesorEjemplo.nombre : 'Juan Pérez',
        bancoNombre: bancoEjemplo ? bancoEjemplo.nombre : 'Banco Nacional',
        financieraNombre: '', // Vacío porque este crédito es con banco
        monto: 50000.00,
        tasa: '12.5%',
        plazo: 24,
        tipo: 'Personal',
        garantia: 'Hipotecaria',
        estado: 'Pendiente',
        fechaSolicitud: '2024-01-15',
        fechaAprobacion: '',
        fechaVencimiento: '2026-01-15',
        observaciones: 'Crédito para vivienda - CON BANCO'
      },
      {
        clienteDni: clienteEjemplo ? clienteEjemplo.dni : '87654321',
        asesorNombre: asesorEjemplo ? asesorEjemplo.nombre : 'María García',
        bancoNombre: '', // Vacío porque este crédito es con financiera
        financieraNombre: financieraEjemplo ? financieraEjemplo.nombre : 'Financiera XYZ',
        monto: 25000.00,
        tasa: '15.0%',
        plazo: 12,
        tipo: 'Comercial',
        garantia: 'Prendaria',
        estado: 'Aprobado',
        fechaSolicitud: '2024-02-01',
        fechaAprobacion: '2024-02-10',
        fechaVencimiento: '2025-02-01',
        observaciones: 'Crédito para negocio - CON FINANCIERA'
      }
    ];

    // Crear la hoja de cálculo
    const ws = XLSX.utils.json_to_sheet(template);
    
    // Ajustar el ancho de las columnas
    const cols = [
      { wch: 12 }, // clienteDni
      { wch: 15 }, // asesorNombre
      { wch: 15 }, // bancoNombre
      { wch: 15 }, // financieraNombre
      { wch: 12 }, // monto
      { wch: 8 },  // tasa
      { wch: 8 },  // plazo
      { wch: 12 }, // tipo
      { wch: 12 }, // garantia
      { wch: 12 }, // estado
      { wch: 12 }, // fechaSolicitud
      { wch: 12 }, // fechaAprobacion
      { wch: 12 }, // fechaVencimiento
      { wch: 25 }  // observaciones
    ];
    ws['!cols'] = cols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Creditos');

    // Generar el archivo
    const buffer = XLSX.write(wb, { 
      type: 'buffer', 
      bookType: 'xlsx'
    });

    // Configurar headers para la descarga
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="template_creditos.xlsx"',
      'Content-Length': buffer.length,
      'Cache-Control': 'no-cache'
    });

    // Enviar el archivo
    return res.send(buffer);

  } catch (error) {
    console.error('Error generando template:', error);
    return res.status(500).json({ message: 'Error generando template: ' + error.message });
  }
};