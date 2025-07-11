/**
 * Utilidades para manejo de permisos de usuario
 */

/**
 * Convierte los permisos de la base de datos al formato del frontend
 * @param {Object} user - Usuario de la base de datos
 * @returns {Object} Permisos en formato frontend
 */
const convertPermissionsToFrontend = (user) => {
  if (!user) return null;

  return {
    creditos: {
      ver: user.creditos_ver || false,
      crear: user.creditos_crear || false,
      editar: user.creditos_editar || false,
      eliminar: user.creditos_eliminar || false
    },
    clientes: {
      ver: user.clientes_ver || false,
      crear: user.clientes_crear || false,
      editar: user.clientes_editar || false,
      eliminar: user.clientes_eliminar || false
    },
    asesores: {
      ver: user.asesores_ver || false,
      crear: user.asesores_crear || false,
      editar: user.asesores_editar || false,
      eliminar: user.asesores_eliminar || false
    },
    bancos: {
      ver: user.bancos_ver || false,
      crear: user.bancos_crear || false,
      editar: user.bancos_editar || false,
      eliminar: user.bancos_eliminar || false
    },
    financieras: {
      ver: user.financieras_ver || false,
      crear: user.financieras_crear || false,
      editar: user.financieras_editar || false,
      eliminar: user.financieras_eliminar || false
    },
    objetivos: {
      ver: user.objetivos_ver || false,
      crear: user.objetivos_crear || false,
      editar: user.objetivos_editar || false,
      eliminar: user.objetivos_eliminar || false
    },
    reportes: {
      ver: user.reportes_ver || false,
      crear: user.reportes_crear || false,
      editar: user.reportes_editar || false,
      eliminar: user.reportes_eliminar || false
    },
    comisiones: {
      ver: user.comisiones_ver || false,
      crear: user.comisiones_crear || false,
      editar: user.comisiones_editar || false,
      eliminar: user.comisiones_eliminar || false
    },
    configuracion: {
      ver: user.configuracion_ver || false,
      crear: user.configuracion_crear || false,
      editar: user.configuracion_editar || false,
      eliminar: user.configuracion_eliminar || false
    },
    gestionUsuarios: {
      ver: user.gestionUsuarios_ver || false,
      crear: user.gestionUsuarios_crear || false,
      editar: user.gestionUsuarios_editar || false,
      eliminar: user.gestionUsuarios_eliminar || false
    }
  };
};

/**
 * Convierte los permisos del frontend al formato de la base de datos
 * @param {Object} permissions - Permisos en formato frontend
 * @returns {Object} Permisos en formato base de datos
 */
const convertPermissionsToDatabase = (permissions) => {
  if (!permissions) return {};

  const dbPermissions = {};

  Object.keys(permissions).forEach(module => {
    const modulePermissions = permissions[module];
    const dbModuleName = module; // Usamos camelCase consistentemente
    
    dbPermissions[`${dbModuleName}_ver`] = modulePermissions.ver || false;
    dbPermissions[`${dbModuleName}_crear`] = modulePermissions.crear || false;
    dbPermissions[`${dbModuleName}_editar`] = modulePermissions.editar || false;
    dbPermissions[`${dbModuleName}_eliminar`] = modulePermissions.eliminar || false;
  });

  return dbPermissions;
};

/**
 * Genera permisos de administrador completos
 * @returns {Object} Permisos de administrador
 */
const getAdminPermissions = () => {
  const modules = ['creditos', 'clientes', 'asesores', 'bancos', 'financieras', 'objetivos', 'reportes', 'comisiones', 'configuracion', 'gestionUsuarios'];
  const permissions = {};

  modules.forEach(module => {
    permissions[`${module}_ver`] = true;
    permissions[`${module}_crear`] = true;
    permissions[`${module}_editar`] = true;
    permissions[`${module}_eliminar`] = true;
  });

  return permissions;
};

/**
 * Genera permisos de usuario limitados
 * @returns {Object} Permisos de usuario
 */
const getUserPermissions = () => {
  return {
    // Permisos limitados para usuarios normales
    creditos_ver: true,
    creditos_crear: true,
    creditos_editar: true,
    creditos_eliminar: false,
    
    clientes_ver: true,
    clientes_crear: true,
    clientes_editar: true,
    clientes_eliminar: false,
    
    asesores_ver: true,
    asesores_crear: false,
    asesores_editar: false,
    asesores_eliminar: false,
    
    bancos_ver: true,
    bancos_crear: false,
    bancos_editar: false,
    bancos_eliminar: false,
    
    financieras_ver: true,
    financieras_crear: false,
    financieras_editar: false,
    financieras_eliminar: false,
    
    objetivos_ver: true,
    objetivos_crear: false,
    objetivos_editar: false,
    objetivos_eliminar: false,
    
    reportes_ver: true,
    reportes_crear: false,
    reportes_editar: false,
    reportes_eliminar: false,
    
    comisiones_ver: true,
    comisiones_crear: false,
    comisiones_editar: false,
    comisiones_eliminar: false,
    
    configuracion_ver: false,
    configuracion_crear: false,
    configuracion_editar: false,
    configuracion_eliminar: false,
    
    gestionUsuarios_ver: false,
    gestionUsuarios_crear: false,
    gestionUsuarios_editar: false,
    gestionUsuarios_eliminar: false
  };
};

/**
 * Middleware para verificar permisos específicos
 * @param {string} module - Módulo a verificar
 * @param {string} action - Acción a verificar (ver, editar, eliminar, modificar)
 * @returns {Function} Middleware function
 */
const checkPermission = (module, action) => {
  return (req, res, next) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Los superadmin tienen acceso completo
    if (user.role === 'superadmin') {
      return next();
    }

    const dbModuleName = module; // Usamos camelCase consistentemente
    const permissionField = `${dbModuleName}_${action}`;
    
    if (!user[permissionField]) {
      return res.status(403).json({ 
        error: 'No tienes permisos para realizar esta acción',
        required: `${module}.${action}`
      });
    }

    next();
  };
};

/**
 * Formatea un usuario para enviar al frontend
 * @param {Object} user - Usuario de la base de datos
 * @returns {Object} Usuario formateado para frontend
 */
const formatUserForFrontend = (user) => {
  if (!user) return null;

  return {
    id: user.id,
    nombre: user.nombres || '',
    apellido: user.apellidos || '',
    email: user.correo || '',
    username: user.username,
    rol: user.role === 'admin' || user.role === 'superadmin' ? 'administrador' : 'asesor',
    estado: user.estado || 'activo',
    telefono: user.telefono || '',
    sucursal: user.sucursal || '',
    tema: user.theme === 'light' ? 'claro' : user.theme === 'dark' ? 'oscuro' : 'sistema',
    fechaCreacion: user.createdAt,
    ultimoAcceso: user.updatedAt,
    permisos: convertPermissionsToFrontend(user)
  };
};

module.exports = {
  convertPermissionsToFrontend,
  convertPermissionsToDatabase,
  getAdminPermissions,
  getUserPermissions,
  checkPermission,
  formatUserForFrontend
};
