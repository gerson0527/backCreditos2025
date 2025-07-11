# Sistema de Gestión de Usuarios con Permisos Granulares

## 🔧 Cambios en el Backend

### 📦 Nuevos Archivos Creados

1. **Modelo actualizado**: `models/User.js`
   - Agregado campo `tema` con opciones: `light`, `dark`, `system`
   - Agregado campo `estado` con opciones: `activo`, `inactivo`, `suspendido`
   - Agregado campo `sucursal`
   - **40 campos de permisos granulares** para 10 módulos con 4 acciones cada uno

2. **Migración**: `migrations/010_add_user_permissions_and_fields.js`
   - Agrega todos los nuevos campos al modelo User
   - Actualiza usuarios existentes con permisos por defecto según su rol

3. **Controlador**: `src/controllers/userController.js`
   - CRUD completo para gestión de usuarios
   - Manejo de permisos granulares
   - Validaciones de contraseña
   - Paginación y filtros

4. **Rutas**: `src/routes/userRoutes.js`
   - Rutas protegidas con middleware de permisos
   - GET, POST, PUT, DELETE para usuarios
   - Estadísticas de usuarios

5. **Utilidades**: `src/utils/permissionsUtils.js`
   - Conversión entre formatos frontend/backend
   - Middleware de verificación de permisos
   - Funciones helper para permisos por defecto

6. **Seeder**: `seeders/008_users_with_permissions.js`
   - Usuarios de ejemplo con permisos configurados
   - Contraseñas por defecto para pruebas

### 🎯 Sistema de Permisos

#### Módulos disponibles:
- **Créditos** (`creditos`)
- **Clientes** (`clientes`)
- **Asesores** (`asesores`)
- **Bancos** (`bancos`)
- **Financieras** (`financieras`)
- **Objetivos** (`objetivos`)
- **Reportes** (`reportes`)
- **Comisiones** (`comisiones`)
- **Configuración** (`configuracion`)
- **Gestión de Usuarios** (`gestionUsuarios`)

#### Acciones por módulo:
- **Ver** (`ver`): Visualizar información
- **Editar** (`editar`): Modificar registros existentes
- **Eliminar** (`eliminar`): Borrar registros
- **Modificar** (`modificar`): Cambios avanzados

### 🔐 Roles y Permisos por Defecto

#### Superadmin (`superadmin`)
- **Todos los permisos** en todos los módulos
- No puede ser eliminado
- Acceso completo al sistema

#### Administrador (`admin`)
- **Todos los permisos** en todos los módulos
- Puede gestionar usuarios
- Acceso completo excepto eliminar superadmin

#### Usuario/Asesor (`user`)
- **Permisos limitados**:
  - Créditos: ver, editar, modificar (sin eliminar)
  - Clientes: ver, editar, modificar (sin eliminar)
  - Asesores: solo ver
  - Bancos/Financieras: solo ver
  - Objetivos/Reportes/Comisiones: solo ver
  - Configuración: sin acceso
  - Gestión de Usuarios: sin acceso

## 🚀 Instrucciones de Uso

### 1. Ejecutar Migración
```bash
cd back
npx sequelize-cli db:migrate
```

### 2. Poblar Datos Iniciales
```bash
npx sequelize-cli db:seed:all
```

### 3. Usuarios de Prueba

#### Administradores:
- **Username**: `superadmin` | **Password**: `admin123`
- **Username**: `ana.rodriguez` | **Password**: `admin123`
- **Username**: `carlos.mendoza` | **Password**: `admin123`

#### Usuarios/Asesores:
- **Username**: `laura.martinez` | **Password**: `user123`
- **Username**: `roberto.silva` | **Password**: `user123`

### 4. API Endpoints

#### Autenticación
```
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me
```

#### Gestión de Usuarios
```
GET /api/users           # Listar usuarios (paginado)
GET /api/users/stats     # Estadísticas
GET /api/users/:id       # Obtener usuario
POST /api/users          # Crear usuario
PUT /api/users/:id       # Actualizar usuario
DELETE /api/users/:id    # Eliminar usuario
```

### 5. Parámetros de Query para Filtros
```
GET /api/users?page=1&limit=10&search=laura&role=user&estado=activo
```

### 6. Estructura de Permisos en Requests

#### Para crear/actualizar usuario:
```json
{
  "nombres": "Juan",
  "apellidos": "Pérez",
  "username": "juan.perez",
  "correo": "juan@creditpro.com",
  "password": "password123",
  "role": "user",
  "telefono": "3001234567",
  "sucursal": "Principal",
  "theme": "system",
  "estado": "activo",
  "permisos": {
    "creditos": {
      "ver": true,
      "editar": true,
      "eliminar": false,
      "modificar": true
    },
    "clientes": {
      "ver": true,
      "editar": true,
      "eliminar": false,
      "modificar": true
    }
    // ... otros módulos
  }
}
```

## 🔧 Frontend Actualizado

El frontend ahora incluye:
- **Campos de contraseña**: actual y nueva
- **Selector de tema**: claro, oscuro, sistema
- **Checkboxes de permisos**: por módulo y acción
- **Botones de plantilla**: "Permisos de Administrador" y "Permisos de Asesor"
- **Validaciones**: contraseñas y campos requeridos

## 🛡️ Seguridad

- Contraseñas hasheadas con bcrypt (salt rounds: 12)
- Tokens JWT para autenticación
- Middleware de verificación de permisos
- Validación de datos de entrada
- Prevención de eliminación de cuentas críticas

## 📝 Notas Importantes

1. **Migración segura**: La migración preserva datos existentes
2. **Permisos retroactivos**: Usuarios existentes obtienen permisos según su rol actual
3. **Middleware granular**: Cada endpoint verifica permisos específicos
4. **Contraseñas por defecto**: Cambiar en producción
5. **Tema del usuario**: Solo almacena preferencia, no afecta la aplicación globalmente
