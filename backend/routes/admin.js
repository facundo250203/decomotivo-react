const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const sanitizeBody = require('../middleware/sanitizeBody');
const {
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  deleteProductImage,
  getAllProductsAdmin,
  getProductByIdAdmin,
  CAMPOS_EDITABLES_PRODUCTO
} = require('../controllers/adminProductController');
const {
  createVariante,
  updateVariante,
  deleteVariante,
  CAMPOS_EDITABLES_VARIANTE
} = require('../controllers/productoVariantesController');
const {
  listComboItems,
  createComboItem,
  updateComboItem,
  deleteComboItem,
  CAMPOS_EDITABLES_COMBO_ITEM
} = require('../controllers/productoComboController');

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

// GET /api/admin/productos/:id - Ver un producto (sin filtro de
// activo/visible_publico, a diferencia de la ruta pública equivalente)
router.get('/productos/:id', getProductByIdAdmin);

// POST /api/admin/productos - Crear producto
router.post('/productos', createProduct);

// PUT /api/admin/productos/:id - Actualizar producto
router.put('/productos/:id', sanitizeBody(CAMPOS_EDITABLES_PRODUCTO), updateProduct);

// DELETE /api/admin/productos/:id - Eliminar producto
router.delete('/productos/:id', deleteProduct);

// POST /api/admin/productos/:id/imagenes - Subir imagen
router.post('/productos/:id/imagenes', upload.single('imagen'), uploadProductImage);

// DELETE /api/admin/productos/:id/imagenes/:imageId - Eliminar imagen
router.delete('/productos/:id/imagenes/:imageId', deleteProductImage);

// ============================================
// VARIANTES DE PRODUCTO (medidas con precio y stock propios)
// ============================================

// POST /api/admin/productos/:productoId/variantes - Crear variante
router.post('/productos/:productoId/variantes', createVariante);

// PUT /api/admin/productos/:productoId/variantes/:varianteId - Actualizar variante
router.put(
  '/productos/:productoId/variantes/:varianteId',
  sanitizeBody(CAMPOS_EDITABLES_VARIANTE),
  updateVariante,
);

// DELETE /api/admin/productos/:productoId/variantes/:varianteId - Eliminar (soft delete)
router.delete('/productos/:productoId/variantes/:varianteId', deleteVariante);

// ============================================
// COMBOS (receta de productos/variantes existentes, ver migración 021)
// ============================================

// GET /api/admin/productos/:comboId/combo-items - Listar receta del combo
router.get('/productos/:comboId/combo-items', listComboItems);

// POST /api/admin/productos/:comboId/combo-items - Agregar componente
router.post('/productos/:comboId/combo-items', createComboItem);

// PUT /api/admin/productos/:comboId/combo-items/:comboItemId - Actualizar componente
router.put(
  '/productos/:comboId/combo-items/:comboItemId',
  sanitizeBody(CAMPOS_EDITABLES_COMBO_ITEM),
  updateComboItem,
);

// DELETE /api/admin/productos/:comboId/combo-items/:comboItemId - Quitar componente (hard delete)
router.delete('/productos/:comboId/combo-items/:comboItemId', deleteComboItem);

// ============================================
// EXPORTAR
// ============================================
module.exports = router;