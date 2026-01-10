const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductBySlug,
  getProductsByCategory,
  getFeaturedProducts,
  getProductById
} = require('../controllers/productController');

// ============================================
// RUTAS PÚBLICAS
// ============================================

// GET /api/productos/destacados - Obtener productos destacados
router.get('/destacados', getFeaturedProducts);

// GET /api/productos/categoria/:categoriaId - Productos por categoría
router.get('/categoria/:categoriaId', getProductsByCategory);

// GET /api/productos/slug/:slug - Obtener producto por slug
router.get('/slug/:slug', getProductBySlug);

// GET /api/productos/:id - Obtener producto por ID
router.get('/:id', getProductById);

// GET /api/productos - Obtener todos los productos
router.get('/', getAllProducts);

// ============================================
// EXPORTAR
// ============================================
module.exports = router;