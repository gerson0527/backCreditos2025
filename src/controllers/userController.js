const bcrypt = require('bcryptjs');
const db = require('../../models');
const User = db.User;
const { 
  convertPermissionsToFrontend, 
  convertPermissionsToDatabase, 
  getAdminPermissions, 
  getUserPermissions,
  formatUserForFrontend
} = require('../utils/permissionsUtils');

/**
 * Obtener todos los usuarios con paginación
 */
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '', estado = '' } = req.query;
    const offset = (page - 1) * limit;

    // Construir condiciones de búsqueda
    const whereConditions = {};
    
    if (search) {
      whereConditions[db.Sequelize.Op.or] = [
        { nombres: { [db.Sequelize.Op.iLike]: `%${search}%` } },
        { apellidos: { [db.Sequelize.Op.iLike]: `%${search}%` } },
        { correo: { [db.Sequelize.Op.iLike]: `%${search}%` } },
        { username: { [db.Sequelize.Op.iLike]: `%${search}%` } }
      ];
    }

    if (role && role !== 'todos') {
      if (role === 'administrador') {
        whereConditions.role = { [db.Sequelize.Op.in]: ['admin', 'superadmin'] };
      } else if (role === 'asesor') {
        whereConditions.role = 'user';
      }
    }

    if (estado && estado !== 'todos') {
      whereConditions.estado = estado;
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereConditions,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['password', 'refreshToken'] }
    });

    const users = rows.map(user => formatUserForFrontend(user.toJSON()));

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener un usuario por ID
 */
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password', 'refreshToken'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: formatUserForFrontend(user.toJSON())
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Crear un nuevo usuario
 */
exports.createUser = async (req, res) => {
  try {
    const {
      nombres,
      apellidos,
      username,
      correo,
      password,
      role,
      telefono,
      sucursal,
      theme,
      estado = 'activo',
      permisos
    } = req.body;

    // Validaciones básicas
    if (!username || !password || !nombres || !apellidos) {
      return res.status(400).json({
        success: false,
        message: 'Campos requeridos: username, password, nombres, apellidos'
      });
    }

    // Verificar si el username ya existe
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'El nombre de usuario ya existe'
      });
    }

    // Verificar si el email ya existe
    if (correo) {
      const existingEmail = await User.findOne({ where: { correo } });
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: 'El correo electrónico ya está registrado'
        });
      }
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Preparar permisos según el rol
    let userPermissions = {};
    if (role === 'admin' || role === 'superadmin') {
      userPermissions = getAdminPermissions();
    } else {
      userPermissions = getUserPermissions();
    }

    // Si se proporcionan permisos específicos, usarlos
    if (permisos) {
      userPermissions = { ...userPermissions, ...convertPermissionsToDatabase(permisos) };
    }

    // Crear usuario
    const newUser = await User.create({
      nombres,
      apellidos,
      username,
      correo,
      password: hashedPassword,
      role: role || 'user',
      telefono,
      sucursal,
      theme: theme || 'system',
      estado,
      ...userPermissions
    });

    // Excluir campos sensibles de la respuesta
    const userResponse = formatUserForFrontend(newUser.toJSON());

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: userResponse
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Actualizar un usuario
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombres,
      apellidos,
      correo,
      role,
      telefono,
      sucursal,
      theme,
      estado,
      permisos,
      currentPassword,
      newPassword
    } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Preparar datos para actualizar
    const updateData = {};

    if (nombres !== undefined) updateData.nombres = nombres;
    if (apellidos !== undefined) updateData.apellidos = apellidos;
    if (correo !== undefined) updateData.correo = correo;
    if (telefono !== undefined) updateData.telefono = telefono;
    if (sucursal !== undefined) updateData.sucursal = sucursal;
    if (theme !== undefined) updateData.theme = theme;
    if (estado !== undefined) updateData.estado = estado;

    // Actualizar rol si se proporciona
    if (role !== undefined) {
      updateData.role = role;
      
      // Actualizar permisos según el nuevo rol
      if (role === 'admin' || role === 'superadmin') {
        Object.assign(updateData, getAdminPermissions());
      } else {
        Object.assign(updateData, getUserPermissions());
      }
    }

    // Actualizar permisos específicos si se proporcionan
    if (permisos) {
      Object.assign(updateData, convertPermissionsToDatabase(permisos));
    }

    // Cambiar contraseña si se proporciona
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Debes proporcionar la contraseña actual para cambiarla'
        });
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña actual es incorrecta'
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'La nueva contraseña debe tener al menos 8 caracteres'
        });
      }

      updateData.password = await bcrypt.hash(newPassword, 12);
    }

    // Actualizar usuario
    await user.update(updateData);

    // Obtener usuario actualizado sin campos sensibles
    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password', 'refreshToken'] }
    });

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: formatUserForFrontend(updatedUser.toJSON())
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Eliminar un usuario
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // No permitir eliminar al propio usuario
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminar tu propia cuenta'
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // No permitir eliminar superadmin
    if (user.role === 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'No se puede eliminar una cuenta de superadministrador'
      });
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener estadísticas de usuarios
 */
exports.getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { estado: 'activo' } });
    const adminUsers = await User.count({ where: { role: { [db.Sequelize.Op.in]: ['admin', 'superadmin'] } } });
    const regularUsers = await User.count({ where: { role: 'user' } });

    res.json({
      success: true,
      data: {
        total: totalUsers,
        activos: activeUsers,
        administradores: adminUsers,
        asesores: regularUsers,
        inactivos: totalUsers - activeUsers
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = exports;
