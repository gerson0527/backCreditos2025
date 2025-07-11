const jwt = require('jsonwebtoken');
const db = require('../../models');
const User = db.User;

exports.protect = async (req, res, next) => {
  try {
    let token;

    // Opción 1: Leer token de las cookies (priorizar esta si usas cookies)
    if (req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    // Opción 2: Mantener compatibilidad con headers Bearer (opcional)
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
   
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado para acceder a esta ruta'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findByPk(decoded.id);
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token no válido o expirado'
      });
    }
  } catch (error) {
    next(error);
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Usuario no autorizado para acceder a esta ruta'
      });
    }
    next();
  };
};