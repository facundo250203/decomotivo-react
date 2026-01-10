# DecoMotivo - Backend API

API REST para el e-commerce de productos decorativos personalizados en madera.

## 🚀 Instalación Rápida

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Iniciar servidor (desarrollo)
npm run dev

# Iniciar servidor (producción)
npm start
```

## 🔧 Variables de Entorno

```
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=decomotivo_dev
DB_PORT=3306

CLOUDINARY_CLOUD_NAME=dkjqmhwtj
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

JWT_SECRET=tu_secret_key
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:5173
```

## 📡 Endpoints

### Públicos

**Categorías**
- `GET /api/categorias` - Listar categorías
- `GET /api/categorias/slug/:slug` - Categoría por slug
- `GET /api/categorias/:id` - Categoría por ID

**Productos**
- `GET /api/productos` - Listar productos
- `GET /api/productos/slug/:slug` - Producto por slug
- `GET /api/productos/categoria/:id` - Productos por categoría
- `GET /api/productos/destacados` - Productos destacados
- `GET /api/productos/:id` - Producto por ID

**Autenticación**
- `POST /api/auth/login` - Login admin
- `GET /api/auth/verify` - Verificar token (requiere auth)

### Protegidos (requieren autenticación)

**Admin - Productos**
- `POST /api/admin/productos` - Crear producto
- `PUT /api/admin/productos/:id` - Editar producto
- `DELETE /api/admin/productos/:id` - Eliminar producto
- `POST /api/admin/productos/:id/imagenes` - Subir imagen
- `DELETE /api/admin/productos/:id/imagenes/:imgId` - Eliminar imagen

**Headers requeridos:**
```
Authorization: Bearer {token}
```

## 🔑 Login

**Request:**
```json
POST /api/auth/login
{
  "email": "admin@decomotivo.com.ar",
  "password": "tu_password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
  }
}
```

## 📸 Upload de Imágenes

**Request:**
```
POST /api/admin/productos/:id/imagenes
Content-Type: multipart/form-data

imagen: [archivo]
es_principal: true/false
alt_text: "Descripción"
```

Las imágenes se suben automáticamente a Cloudinary.

## 🛠️ Tecnologías

- Node.js v22.16.0
- Express 4.18.2
- MySQL 8.0.44
- Cloudinary 1.41.3
- JWT para autenticación
- Bcrypt para passwords
- Multer para uploads

## 📂 Estructura

```
backend/
├── config/          # Configuraciones (DB, Cloudinary)
├── controllers/     # Lógica de negocio
├── middleware/      # Auth, upload
├── routes/          # Definición de rutas
├── scripts/         # Utilidades (hashPassword)
└── server.js        # Entry point
```

## 🗄️ Base de Datos

**Tablas:**
- usuarios - Administradores
- categorias - Categorías de productos
- productos - Productos
- imagenes_productos - Imágenes asociadas
- movimientos_stock - Historial de stock

**Crear BD:**
```sql
CREATE DATABASE decomotivo_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Ejecutar el schema SQL desde MySQL Workbench.

## 📝 Notas

- Todos los productos eliminados son soft delete (activo = false)
- Las imágenes se redimensionan automáticamente en Cloudinary
- Los tokens JWT expiran en 7 días
- Control de stock es opcional por producto

---

Desarrollado para DecoMotivo - Tucumán, Argentina 🇦🇷