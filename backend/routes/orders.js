// backend/routes/orders.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  registerPayment,
  updateOrder,
  deleteOrder,
  getOrderStats
} = require('../controllers/orderController');

// ============================================
// TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN
// ============================================

// Obtener estadísticas de pedidos
router.get('/stats', authenticateToken, getOrderStats);

// Listar todos los pedidos (con filtros opcionales)
router.get('/', authenticateToken, getAllOrders);

// Obtener pedido por ID
router.get('/:id', authenticateToken, getOrderById);

// Crear nuevo pedido
router.post('/', authenticateToken, createOrder);

// Actualizar estado del pedido
router.put('/:id/estado', authenticateToken, updateOrderStatus);

// Registrar un pago adicional sobre un pedido ya señado
router.post('/:id/pagos', authenticateToken, registerPayment);

// Actualizar pedido completo
router.put('/:id', authenticateToken, updateOrder);

// Eliminar pedido
router.delete('/:id', authenticateToken, deleteOrder);

module.exports = router;