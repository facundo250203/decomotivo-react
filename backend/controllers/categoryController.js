const { promisePool } = require('../config/database');

// ============================================
// OBTENER TODAS LAS CATEGORÍAS
// ============================================
const getAllCategories = async (req, res) => {
  try {
    const [categories] = await promisePool.query(`
      SELECT 
        id,
        nombre,
        slug,
        descripcion,
        imagen_background,
        activa,
        orden
      FROM categorias
      WHERE activa = true
      ORDER BY orden ASC
    `);

    res.json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener las categorías',
      message: error.message
    });
  }
};

// ============================================
// OBTENER CATEGORÍA POR SLUG
// ============================================
const getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const [categories] = await promisePool.query(`
      SELECT 
        id,
        nombre,
        slug,
        descripcion,
        imagen_background,
        activa,
        orden
      FROM categorias
      WHERE slug = ? AND activa = true
    `, [slug]);

    if (categories.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Categoría no encontrada'
      });
    }

    res.json({
      success: true,
      data: categories[0]
    });
  } catch (error) {
    console.error('Error obteniendo categoría:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener la categoría',
      message: error.message
    });
  }
};

// ============================================
// OBTENER CATEGORÍA POR ID
// ============================================
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const [categories] = await promisePool.query(`
      SELECT 
        id,
        nombre,
        slug,
        descripcion,
        imagen_background,
        activa,
        orden
      FROM categorias
      WHERE id = ?
    `, [id]);

    if (categories.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Categoría no encontrada'
      });
    }

    res.json({
      success: true,
      data: categories[0]
    });
  } catch (error) {
    console.error('Error obteniendo categoría:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener la categoría',
      message: error.message
    });
  }
};

// ============================================
// EXPORTAR
// ============================================
module.exports = {
  getAllCategories,
  getCategoryBySlug,
  getCategoryById
};