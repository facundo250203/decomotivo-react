// backend/server.js
// ============================================
// IMPORTS
// ============================================
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// ============================================
// CONFIGURACIÓN
// ============================================
dotenv.config();

const { testConnection } = require('./config/database');
const { testCloudinaryConnection } = require('./config/cloudinary');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARES GLOBALES
// ============================================

// CORS - Permitir requests desde el frontend
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://www.decomotivo.com.ar',
    'https://decomotivo.com.ar',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));

// Body parser - Para leer JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// RUTAS DE PRUEBA
// ============================================

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.json({
    message: 'API de DecoMotivo funcionando correctamente',
    version: '1.0.0',
    endpoints: {
      categorias: '/api/categorias',
      productos: '/api/productos',
      pedidos: '/api/admin/pedidos',
      auth: '/api/auth'
    }
  });
}); 

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// ============================================
// RUTAS DE LA API
// ============================================

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const adminRoutes = require('./routes/admin');
const orderRoutes = require('./routes/orders');

app.use('/api/auth', authRoutes);
app.use('/api/productos', productRoutes);
app.use('/api/categorias', categoryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/pedidos', orderRoutes); // 🆕 Rutas de pedidos

// ============================================
// MANEJO DE ERRORES 404
// ============================================
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path
  });
});

// ============================================
// MANEJO DE ERRORES GLOBAL
// ============================================
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  });
}