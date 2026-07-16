// backend/middleware/apiKey.js
// Autenticación separada de authenticateToken (JWT humano): valida una
// clave fija para acceso máquina-a-máquina (ej. n8n), sin depender de
// credenciales de login. Se aplica solo a rutas de integración, nunca
// a rutas de administración humana.
const requireApiKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey || apiKey !== process.env.N8N_API_KEY) {
    return res.status(401).json({
      success: false,
      error: "API key inválida o faltante",
    });
  }

  next();
};

module.exports = { requireApiKey };
