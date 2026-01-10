const express = require('express');
const router = express.Router();
const { login, verifyToken } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// ============================================
// RUTAS PÚBLICAS
// ============================================

// POST /api/auth/login - Login de administrador
router.post('/login', login);

// ============================================
// RUTAS PROTEGIDAS
// ============================================

// GET /api/auth/verify - Verificar token
router.get('/verify', authenticateToken, verifyToken);

// ============================================
// EXPORTAR
// ============================================
module.exports = router;