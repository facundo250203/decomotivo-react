const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  deleteProductImage,
  getAllProductsAdmin
} = require('../controllers/adminProductController');

// ============================================
// TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN
// ============================================
router.use(authenticateToken);
router.use(requireAdmin);

// ============================================
// PRODUCTOS
// ============================================

// GET /api/admin/productos - Listar todos los productos
router.get('/productos', getAllProductsAdmin);

// POST /api/admin/productos - Crear producto
router.post('/productos', createProduct);

// PUT /api/admin/productos/:id - Actualizar producto
router.put('/productos/:id', updateProduct);

// DELETE /api/admin/productos/:id - Eliminar producto
router.delete('/productos/:id', deleteProduct);

// POST /api/admin/productos/:id/imagenes - Subir imagen
router.post('/productos/:id/imagenes', upload.single('imagen'), uploadProductImage);

// DELETE /api/admin/productos/:id/imagenes/:imageId - Eliminar imagen
router.delete('/productos/:id/imagenes/:imageId', deleteProductImage);

// ============================================
// EXPORTAR
// ============================================
module.exports = router;