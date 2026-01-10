const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { promisePool } = require('../config/database');

// ============================================
// LOGIN DE ADMINISTRADOR
// ============================================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar que vengan los datos
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email y contraseña son requeridos'
      });
    }

    // Buscar usuario por email
    const [users] = await promisePool.query(
      'SELECT * FROM usuarios WHERE email = ? AND activo = true',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    const user = users[0];

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // Generar JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      }
    );

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        token,
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol
        }
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      error: 'Error al procesar el login',
      message: error.message
    });
  }
};

// ============================================
// VERIFICAR TOKEN (para validar sesión)
// ============================================
const verifyToken = async (req, res) => {
  try {
    // El usuario ya está en req.user gracias al middleware
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Error verificando token:', error);
    res.status(500).json({
      success: false,
      error: 'Error al verificar token',
      message: error.message
    });
  }
};

// ============================================
// EXPORTAR
// ============================================
module.exports = {
  login,
  verifyToken
};