const express = require('express');
const router = express.Router();
const {
  getAllCategories,
  getCategoryBySlug,
  getCategoryById
} = require('../controllers/categoryController');

// ============================================
// RUTAS PÚBLICAS
// ============================================

// GET /api/categorias - Obtener todas las categorías
router.get('/', getAllCategories);

// GET /api/categorias/slug/:slug - Obtener categoría por slug
router.get('/slug/:slug', getCategoryBySlug);

// GET /api/categorias/:id - Obtener categoría por ID
router.get('/:id', getCategoryById);

// ============================================
// EXPORTAR
// ============================================
module.exports = router;