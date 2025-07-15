# 👤 Crear Usuario Superadmin para Producción

## 🎯 Descripción
Este seeder crea un usuario superadmin inicial para acceder al sistema en producción con todos los permisos habilitados.

## 📋 Credenciales por defecto
- **Usuario**: `admin`
- **Contraseña**: `admin123`
- **Rol**: `superadmin`
- **Email**: `admin@sistema.com`

## 🚀 Formas de ejecutar

### 1. **Usando Sequelize CLI (Recomendado)**
```bash
# Ejecutar solo el seeder del superadmin
npm run seed:superadmin

# O directamente con sequelize-cli
npx sequelize-cli db:seed --seed 999_superadmin_production.js
```

### 2. **Usando script directo**
```bash
# Script independiente (más rápido)
npm run create-superadmin

# O directamente
node scripts/create-superadmin.js
```

### 3. **Usando endpoint API (Producción)**
```bash
# Configurar token de seguridad en Railway
SETUP_TOKEN=tu_token_super_secreto

# Crear superadmin via API
curl -X POST https://tu-app.railway.app/api/create-superadmin \
  -H "Authorization: Bearer tu_token_super_secreto"
```

## 🔒 Seguridad

### ⚠️ **IMPORTANTE**
1. **Cambia la contraseña** inmediatamente después del primer login
2. **Elimina el token SETUP_TOKEN** de Railway después de crear el usuario
3. **No uses estas credenciales en desarrollo**

### 🛡️ **Permisos incluidos**
El usuario superadmin tiene TODOS los permisos habilitados:
- ✅ Créditos (ver, crear, editar, eliminar)
- ✅ Clientes (ver, crear, editar, eliminar)
- ✅ Asesores (ver, crear, editar, eliminar)
- ✅ Bancos (ver, crear, editar, eliminar)
- ✅ Financieras (ver, crear, editar, eliminar)
- ✅ Objetivos (ver, crear, editar, eliminar)
- ✅ Reportes (ver, crear, editar, eliminar)
- ✅ Comisiones (ver, crear, editar, eliminar)
- ✅ Configuración (ver, crear, editar, eliminar)
- ✅ Gestión de Usuarios (ver, crear, editar, eliminar)

## 🔄 Comportamiento inteligente
- **Verifica** si ya existe un superadmin antes de crear
- **No duplica** usuarios si ya existe uno
- **Muestra mensaje** informativo si ya existe
- **Hashea la contraseña** usando bcrypt

## 🗑️ Rollback
```bash
# Revertir el seeder
npx sequelize-cli db:seed:undo --seed 999_superadmin_production.js
```

## 📝 Variables de entorno requeridas
```env
# Básicas
DATABASE_URL=mysql://...
NODE_ENV=production

# Para endpoint API (opcional)
SETUP_TOKEN=tu_token_super_secreto
```

## 🚂 En Railway

### Configurar token de seguridad
```env
SETUP_TOKEN=genera_un_token_super_secreto_aqui
```

### Crear usuario
```bash
curl -X POST https://tu-backend.railway.app/api/create-superadmin \
  -H "Authorization: Bearer tu_token_super_secreto"
```

### Remover token después del uso
```env
# Eliminar o comentar esta variable después de crear el usuario
# SETUP_TOKEN=genera_un_token_super_secreto_aqui
```

## 📊 Logs esperados
```
✅ Conectado a la base de datos
✅ Usuario superadmin creado exitosamente
📝 Credenciales de acceso:
   👤 Usuario: admin
   🔑 Contraseña: admin123

⚠️  IMPORTANTE: Cambia la contraseña después del primer login
🎯 El usuario tiene TODOS los permisos habilitados
```

## 🔍 Verificar usuario creado
```bash
# Endpoint para verificar usuarios
curl https://tu-backend.railway.app/api/health

# Login con las credenciales
curl -X POST https://tu-backend.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```
