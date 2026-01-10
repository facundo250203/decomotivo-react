const jwt = require('jsonwebtoken');

// ============================================
// MIDDLEWARE PARA VERIFICAR JWT
// ============================================
const authenticateToken = (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token de autenticación requerido'
      });
    }

    // Verificar token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({
          success: false,
          error: 'Token inválido o expirado'
        });
      }

      // Agregar usuario al request
      req.user = user;
      next();
    });
  } catch (error) {
    console.error('Error en autenticación:', error);
    res.status(500).json({
      success: false,
      error: 'Error en autenticación',
      message: error.message
    });
  }
};

// ============================================
// MIDDLEWARE PARA VERIFICAR ROL ADMIN
// ============================================
const requireAdmin = (req, res, next) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Acceso denegado. Se requiere rol de administrador.'
    });
  }
  next();
};

// ============================================
// EXPORTAR
// ============================================
module.exports = {
  authenticateToken,
  requireAdmin
};