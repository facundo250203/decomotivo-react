const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

dotenv.config();

// ============================================
// CONFIGURACIÓN DE CLOUDINARY
// ============================================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// ============================================
// FUNCIÓN PARA PROBAR LA CONEXIÓN
// ============================================
const testCloudinaryConnection = async () => {
  try {
    const result = await cloudinary.api.ping();
    console.log('✅ Conexión exitosa a Cloudinary');
    console.log(`☁️  Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
    return true;
  } catch (error) {
    console.error('❌ Error conectando a Cloudinary:', error.message);
    return false;
  }
};

// Probar conexión al iniciar
testCloudinaryConnection();

// ============================================
// FUNCIÓN HELPER PARA CONSTRUIR URLs
// ============================================
const getImageUrl = (cloudinaryId, transformations = {}) => {
  const { width, height, crop = 'fill', format = 'auto', quality = 'auto' } = transformations;
  
  let urlParts = [`f_${format}`, `q_${quality}`];
  
  if (width) urlParts.push(`w_${width}`);
  if (height) urlParts.push(`h_${height}`);
  if (crop) urlParts.push(`c_${crop}`);
  
  const transformString = urlParts.join(',');
  
  return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${transformString}/${cloudinaryId}.jpg`;
};

// ============================================
// EXPORTAR
// ============================================
module.exports = {
  cloudinary,
  testCloudinaryConnection,
  getImageUrl
};