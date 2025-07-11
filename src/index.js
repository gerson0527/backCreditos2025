const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
require('dotenv').config();
const frases = require('./frases');
const { sequelize, connectDB, runMigrations, checkDatabaseStatus } = require('./config/database');
const db = require('../models');
const app = express();

// Importar rutas
const authRoutes = require('./routes/authRoutes'); 
const clienteRoutes = require('./routes/clienteRoutes');
const asesorRoutes = require('./routes/asesorRoutes');
const bancoRoutes = require('./routes/bancoRoutes');
const financieraRoutes = require('./routes/financieraRoutes');
const creditoRoutes = require('./routes/creditoRoutes');
const objetivoRoutes = require('./routes/objetivoRoutes');
const reportesRoutes = require('./routes/reporteRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const searchRoutes = require('./routes/searchRoutes');
const comisionRoutes = require('./routes/comisionRoutes');
const userRoutes = require('./routes/userRoutes'); // Nueva ruta para gestión de usuarios

// Middleware
// Configuración CORS para producción
const corsOptions = {
  origin: true, // Permite todos los orígenes
  credentials: true, // No necesita credenciales
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));
// Manejo explícito de OPTIONS para preflight
//app.options('*', cors(corsOptions));
app.use(cookieParser());
app.use(helmet());
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/asesores', asesorRoutes);
app.use('/api/bancos', bancoRoutes);
app.use('/api/financieras', financieraRoutes);
app.use('/api/creditos', creditoRoutes);
app.use('/api/objetivos', objetivoRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/comisiones', comisionRoutes);
app.use('/api/users', userRoutes); // Nueva ruta para gestión de usuarios

// 🩺 Endpoint de salud básico
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: '✅ Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 🔍 Endpoint para verificar conexión a base de datos
app.get('/api/db-info', async (req, res) => {
  try {
    const config = sequelize.config;
    const dbInfo = {
      database: config.database,
      host: config.host,
      port: config.port,
      username: config.username,
      dialect: config.dialect,
      environment: process.env.NODE_ENV || 'development',
      isRailway: config.host && (config.host.includes('railway') || config.host.includes('rlwy')),
      connectionStatus: 'Connected'
    };
    
    // Verificar que la conexión funcione
    await sequelize.authenticate();
    
    res.status(200).json({
      message: '✅ Database connection verified',
      info: dbInfo
    });
  } catch (error) {
    res.status(500).json({
      message: '❌ Database connection failed',
      error: error.message
    });
  }
});

// 🔄 Endpoint para ejecutar migraciones
app.post('/api/migrate', async (req, res) => {
  try {
    console.log('🔄 Iniciando migraciones desde endpoint...');
    await runMigrations();
    
    res.status(200).json({
      message: '✅ Migraciones ejecutadas correctamente',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error en migraciones:', error);
    res.status(500).json({
      message: '❌ Error ejecutando migraciones',
      error: error.message
    });
  }
});

// 📊 Endpoint para verificar estado de la base de datos
app.get('/api/db-status', async (req, res) => {
  try {
    const isHealthy = await checkDatabaseStatus();
    
    if (isHealthy) {
      res.status(200).json({
        message: '✅ Base de datos funcionando correctamente',
        status: 'healthy',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        message: '❌ Problemas con la base de datos',
        status: 'unhealthy',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(500).json({
      message: '❌ Error verificando base de datos',
      error: error.message
    });
  }
});

// 👤 Endpoint para crear superadmin (solo en producción)
app.post('/api/create-superadmin', async (req, res) => {
  try {
    // Solo permitir en producción con autenticación básica
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: '❌ Autorización requerida' 
      });
    }

    const token = authHeader.split(' ')[1];
    if (token !== process.env.SETUP_TOKEN) {
      return res.status(403).json({ 
        message: '❌ Token de configuración inválido' 
      });
    }

    const createSuperAdmin = require('../scripts/create-superadmin');
    await createSuperAdmin();
    
    res.status(200).json({
      message: '✅ Usuario superadmin creado exitosamente',
      credentials: {
        username: 'admin',
        password: 'admin123'
      },
      warning: '⚠️ Cambia la contraseña después del primer login',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      message: '❌ Error creando superadmin',
      error: error.message
    });
  }
});

app.use('/api/frases-motivacion', async (req, res) => {
  try {
    res.json(frases);
    
  } catch (error) {
    console.error('Error al obtener frases:', error);
    res.status(500).json({ error: 'Error al obtener frases motivacionales' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;

// Initialize database connection and run migrations
connectDB().then(async () => {
  await runMigrations();
  
  app.listen(PORT, () => {
    console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
  });
}).catch(error => {
  console.error('Error al iniciar el servidor:', error);
  process.exit(1);
});