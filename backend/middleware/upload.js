const multer = require('multer');
const path = require('path');

// ============================================
// CONFIGURACIÓN DE MULTER
// ============================================

// Filtro para validar tipos de archivo
const fileFilter = (req, file, cb) => {
  // Tipos de archivo permitidos
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  
  // Verificar extensión
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  
  // Verificar mime type
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
  }
};

// Configuración de multer para memoria (no disco)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
  fileFilter: fileFilter
});

// ============================================
// EXPORTAR
// ============================================
module.exports = upload;