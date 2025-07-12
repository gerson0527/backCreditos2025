const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../../models');
const User = db.User;
const { formatUserForFrontend } = require('../utils/permissionsUtils');

exports.login = async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // Usar findOne de Sequelize con where clause
    const user = await User.findOne({ where: { username } });
    
    if (!user) {
      return res.status(401).json({ success: false, message: "Credenciales inválidas" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "password incorrecto" });
    }

    // validar el estado del usuario
    if (user.estado === 'inactivo' || user.estado === 'suspendido') {
      return res.status(401).json({
        success: false,
        message: "Usuario inactivo. Contacta al administrador."
      });
    }

    // 1. Generar JWT de acceso (15-30 min de vida)
    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 2. Generar Refresh Token (válido por 7 días, guardado en DB)
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    // Guardar refreshToken en la base de datos usando método de Sequelize
    await user.update({ refreshToken });

    // 3. Enviar tokens en cookies HttpOnly (seguras)
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true, // Solo en HTTPS
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 15 min
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
    });

    // 4. Responder con datos no sensibles del usuario
    const userForFrontend = formatUserForFrontend(user.toJSON());
    
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        theme: user.theme,
        permisos: userForFrontend.permisos
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error al iniciar sesión" 
    });
  }
};

exports.logout = async (req, res) => {
  try {
    // Obtener el token de la cookie
    const accessToken = req.cookies.accessToken;
    
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        message: "No hay sesión activa"
      });
    }

    try {
      // Decodificar el token para obtener el ID del usuario
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
      const userId = decoded.id;

      // Limpiar el refreshToken en la base de datos
      await User.update(
        { refreshToken: null },
        { where: { id: userId } }
      );

      // Limpiar las cookies
      res.clearCookie('accessToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict'
      });

      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict'
      });

      res.json({
        success: true,
        message: "Sesión cerrada exitosamente"
      });
    } catch (tokenError) {
      // Si el token es inválido, solo limpiamos las cookies
      res.clearCookie('accessToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict'
      });

      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict'
      });

      return res.status(200).json({
        success: true,
        message: "Cookies limpiadas exitosamente"
      });
    }
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      success: false,
      message: "Error al cerrar sesión"
    });
  }
};

exports.cambiarPassword = async (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;

  try {
    // Buscar al usuario por ID
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    // Verificar la contraseña actual
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Contraseña actual incorrecta"
      });
    }

    // Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar la contraseña en la base de datos
    await user.update({ password: hashedPassword });

    res.json({
      success: true,
      message: "Contraseña cambiada exitosamente"
    });
  } catch (error) {
    console.error('Error al cambiar la contraseña:', error);
    res.status(500).json({
      success: false,
      message: "Error al cambiar la contraseña"
    });
  }
};

exports.obtenerPerfil = async (req, res) => {
  try {
    const userId = req.user.id; // Obtenido del middleware de autenticación
    console.log('Obteniendo perfil para el usuario:', userId);
    
    // Buscar al usuario por ID
    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'nombres', 'apellidos', 'correo', 'telefono', 'role', 'theme', 'createdAt']
    });
    
    console.log('Usuario encontrado:', user?.username);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    // Obtener permisos del usuario usando la utilidad existente
    const userForFrontend = formatUserForFrontend(user.toJSON());

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.correo, // Para consistencia con la interfaz del frontend
        rol: user.role,
        permisos: userForFrontend.permisos,
        nombres: user.nombres,
        apellidos: user.apellidos,
        correo: user.correo,
        telefono: user.telefono,
        cargo: user.role,
        theme: user.theme,
      }
    });

  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor al obtener el perfil"
    });
  }
};

exports.actualizarPerfil = async (req, res) => {
  try {
    const userId = req.user.id; // Obtenido del middleware de autenticación
    const { nombres, apellidos, correo, telefono, cargo } = req.body;

    // Validaciones básicas
    if (!nombres || !apellidos || !correo) {
      return res.status(400).json({
        success: false,
        message: "Los campos nombres, apellidos y correo son obligatorios"
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      return res.status(400).json({
        success: false,
        message: "Formato de email inválido"
      });
    }

    // Buscar al usuario por ID
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    // Verificar si el email ya está en uso por otro usuario
    if (correo !== user.correo) {
      const existingUser = await User.findOne({
        where: {
          correo: correo,
          id: { [db.Sequelize.Op.ne]: userId } // Excluir el usuario actual
        }
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "El email ya está en uso por otro usuario"
        });
      }
    }

    // Actualizar la información del usuario
    await user.update({
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      correo: correo.trim().toLowerCase(),
      telefono: telefono ? telefono.trim() : user.telefono,
      cargo: cargo || user.cargo
    });

    // Devolver los datos actualizados (sin información sensible)
    res.json({
      success: true,
      message: "Perfil actualizado exitosamente",
      user: {
        id: user.id,
        username: user.username,
        nombres: user.nombres,
        apellidos: user.apellidos,
        correo: user.correo,
        telefono: user.telefono,
        cargo: user.cargo,
        role: user.role,
        theme: user.theme
      }
    });

  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor al actualizar el perfil"
    });
  }
};

exports.actualizarTema = async (req, res) => {
  try {
    const userId = req.user.id;
    const { theme } = req.body;

    // Validar tema
    const temasValidos = ['light', 'dark', 'system'];
    if (!temasValidos.includes(theme)) {
      return res.status(400).json({
        success: false,
        message: "Tema inválido. Debe ser: light, dark o system"
      });
    }

    // Buscar al usuario por ID
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    // Actualizar el tema
    await user.update({ theme });

    res.json({
      success: true,
      message: "Tema actualizado exitosamente",
      theme: user.theme
    });

  } catch (error) {
    console.error('Error al actualizar tema:', error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor al actualizar el tema"
    });
  }
};

