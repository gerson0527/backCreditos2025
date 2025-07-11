const db = require('../../models');
const Cliente = db.Cliente
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

exports.getAllClientes = async (req, res) => {
  try {
    const clientes = await Cliente.findAll(); // Cambiado de find() a findAll()
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getClienteById = async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id); // Cambiado de findById a findByPk
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createCliente = async (req, res) => {
  try {
    const cliente = await Cliente.create(req.body); // Cambiado de new Cliente a Cliente.create
    res.status(201).json(cliente);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateCliente = async (req, res) => {
  try {
    const [updated] = await Cliente.update(req.body, {
      where: { id: req.params.id }
    });
    if (updated) {
      const updatedCliente = await Cliente.findByPk(req.params.id);
      res.json(updatedCliente);
    } else {
      res.status(404).json({ message: 'Cliente no encontrado' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteCliente = async (req, res) => {
  try {
    const deleted = await Cliente.destroy({
      where: { id: req.params.id }
    });
    if (deleted) {
      res.json({ message: 'Cliente eliminado correctamente' });
    } else {
      res.status(404).json({ message: 'Cliente no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.searchCliente = async (req, res) => {
  try {
    const term = req.query.term;
    const clientes = await Cliente.findAll({
      where: {
        dni: {
          [Op.like]: `%${term}%`
        }
      }
    });
    res.json(clientes);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
}

exports.uploadClientes = upload.single('excel');

exports.processExcelClientes = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se ha subido ningún archivo' });
    }

    // Leer el archivo Excel
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convertir a JSON
    const clientesData = XLSX.utils.sheet_to_json(worksheet);

    if (clientesData.length === 0) {
      return res.status(400).json({ message: 'El archivo Excel está vacío' });
    }

    const resultados = {
      exitosos: [],
      errores: [],
      total: clientesData.length
    };

    // Procesar cada cliente
    for (let i = 0; i < clientesData.length; i++) {
      const clienteData = clientesData[i];
      const fila = i + 2; // +2 porque Excel empieza en 1 y la primera fila son headers

      try {
        // Validar campos obligatorios
        if (!clienteData.nombre || !clienteData.apellido || !clienteData.dni || !clienteData.email) {
          resultados.errores.push({
            fila: fila,
            error: 'Campos obligatorios faltantes (nombre, apellido, dni, email)',
            datos: clienteData
          });
          continue;
        }

        // Preparar datos del cliente
        const nuevoCliente = {
          nombre: clienteData.nombre,
          apellido: clienteData.apellido,
          dni: clienteData.dni,
          email: clienteData.email,
          telefono: clienteData.telefono || null,
          direccion: clienteData.direccion || null,
          fechanacimiento: clienteData.fechanacimiento ? new Date(clienteData.fechanacimiento) : null,
          ingresosMensuales: clienteData.ingresosMensuales || null,
          estado: clienteData.estado || 'Activo'
        };

        // Verificar si el cliente ya existe (por DNI o email)
        const clienteExistente = await Cliente.findOne({
          where: {
            [Op.or]: [
              { dni: nuevoCliente.dni },
              { email: nuevoCliente.email }
            ]
          }
        });

        if (clienteExistente) {
          resultados.errores.push({
            fila: fila,
            error: 'Cliente ya existe (DNI o email duplicado)',
            datos: clienteData
          });
          continue;
        }

        // Crear el cliente
        const cliente = await Cliente.create(nuevoCliente);
        resultados.exitosos.push({
          fila: fila,
          cliente: cliente
        });

      } catch (error) {
        resultados.errores.push({
          fila: fila,
          error: error.message,
          datos: clienteData
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

exports.getTemplateExcel = async (req, res) => {
  try {
    // Crear un archivo template con las columnas esperadas
    const template = [
      {
        nombre: 'Juan',
        apellido: 'Pérez',
        dni: '12345678',
        email: 'juan.perez@example.com',
        telefono: '123456789',
        direccion: 'Calle 123',
        fechanacimiento: '1990-01-01',
        ingresosMensuales: 5000.00,
        estado: 'Activo'
      },
      {
        nombre: 'María',
        apellido: 'García',
        dni: '87654321',
        email: 'maria.garcia@example.com',
        telefono: '987654321',
        direccion: 'Avenida 456',
        fechanacimiento: '1985-05-15',
        ingresosMensuales: 3000.00,
        estado: 'Activo'
      }
    ];

    // Crear la hoja de cálculo
    const ws = XLSX.utils.json_to_sheet(template);
    
    // Ajustar el ancho de las columnas
    const cols = [
      { wch: 15 }, // nombre
      { wch: 15 }, // apellido  
      { wch: 12 }, // dni
      { wch: 25 }, // email
      { wch: 15 }, // telefono
      { wch: 20 }, // direccion
      { wch: 15 }, // fechanacimiento
      { wch: 15 }, // ingresosMensuales
      { wch: 10 }  // estado
    ];
    ws['!cols'] = cols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');

    // Generar el archivo
    const buffer = XLSX.write(wb, { 
      type: 'buffer', 
      bookType: 'xlsx'
    });

    // Configurar headers para la descarga
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="template_clientes.xlsx"',
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
