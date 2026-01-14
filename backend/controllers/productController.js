const { promisePool } = require('../config/database');

// ============================================
// FUNCIÓN HELPER: Estructurar producto con imágenes
// ============================================
const structureProductWithImages = (rows) => {
  if (rows.length === 0) return null;

  const product = {
    id: rows[0].id,
    categoria_id: rows[0].categoria_id,
    titulo: rows[0].titulo,
    slug: rows[0].slug,
    descripcion: rows[0].descripcion,
    
    // PRECIO - Estructura simplificada
    precio_valor: rows[0].precio_valor ? parseFloat(rows[0].precio_valor) : null,
    precio_tipo: rows[0].precio_tipo,
    
    material: rows[0].material,
    medidas: rows[0].medidas,
    capacidad: rows[0].capacidad,
    personalizable: rows[0].personalizable ? 'Sí' : 'No',
    colores: rows[0].colores,
    
    // CANTIDAD (stock)
    cantidad: rows[0].cantidad,
    
    // TIEMPO DE ENTREGA
    tiempo_entrega_tipo: rows[0].tiempo_entrega_tipo,
    tiempo_entrega_dias: rows[0].tiempo_entrega_dias,
    
    destacado: Boolean(rows[0].destacado),
    activo: Boolean(rows[0].activo),
    
    categoria: {
      id: rows[0].categoria_id,
      nombre: rows[0].categoria_nombre,
      slug: rows[0].categoria_slug
    },
    imagenes: rows
      .filter(row => row.imagen_id) // Solo si tiene imágenes
      .map(row => ({
        id: row.imagen_id,
        url: row.imagen_url,
        cloudinary_id: row.imagen_cloudinary_id,
        es_principal: Boolean(row.imagen_es_principal),
        orden: row.imagen_orden,
        alt_text: row.imagen_alt_text
      }))
      .sort((a, b) => {
        // Principal primero, después por orden
        if (a.es_principal && !b.es_principal) return -1;
        if (!a.es_principal && b.es_principal) return 1;
        return a.orden - b.orden;
      })
  };

  return product;
};

// ============================================
// OBTENER TODOS LOS PRODUCTOS
// ============================================
const getAllProducts = async (req, res) => {
  try {
    const { limit = 50, offset = 0, destacados, categoria_id } = req.query;

    let query = `
      SELECT 
        p.id,
        p.categoria_id,
        p.titulo,
        p.slug,
        p.descripcion,
        p.precio_valor,
        p.precio_tipo,
        p.material,
        p.medidas,
        p.capacidad,
        p.personalizable,
        p.colores,
        p.cantidad,
        p.tiempo_entrega_tipo,
        p.tiempo_entrega_dias,
        p.destacado,
        p.activo,
        c.nombre as categoria_nombre,
        c.slug as categoria_slug,
        i.id as imagen_id,
        i.url as imagen_url,
        i.cloudinary_id as imagen_cloudinary_id,
        i.es_principal as imagen_es_principal,
        i.orden as imagen_orden,
        i.alt_text as imagen_alt_text
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN imagenes_productos i ON p.id = i.producto_id
      WHERE p.activo = true
    `;

    const params = [];

    // Filtro por destacados
    if (destacados === 'true') {
      query += ` AND p.destacado = true`;
    }

    // Filtro por categoría
    if (categoria_id) {
      query += ` AND p.categoria_id = ?`;
      params.push(categoria_id);
    }

    query += ` ORDER BY p.destacado DESC, p.id DESC`;
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await promisePool.query(query, params);

    // Agrupar productos con sus imágenes
    const productsMap = new Map();
    rows.forEach(row => {
      if (!productsMap.has(row.id)) {
        productsMap.set(row.id, []);
      }
      productsMap.get(row.id).push(row);
    });

    const products = Array.from(productsMap.values()).map(productRows => 
      structureProductWithImages(productRows)
    );

    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener los productos',
      message: error.message
    });
  }
};

// ============================================
// OBTENER PRODUCTO POR SLUG
// ============================================
const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const [rows] = await promisePool.query(`
      SELECT 
        p.id,
        p.categoria_id,
        p.titulo,
        p.slug,
        p.descripcion,
        p.precio_valor,
        p.precio_tipo,
        p.material,
        p.medidas,
        p.capacidad,
        p.personalizable,
        p.colores,
        p.cantidad,
        p.tiempo_entrega_tipo,
        p.tiempo_entrega_dias,
        p.destacado,
        p.activo,
        c.nombre as categoria_nombre,
        c.slug as categoria_slug,
        i.id as imagen_id,
        i.url as imagen_url,
        i.cloudinary_id as imagen_cloudinary_id,
        i.es_principal as imagen_es_principal,
        i.orden as imagen_orden,
        i.alt_text as imagen_alt_text
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN imagenes_productos i ON p.id = i.producto_id
      WHERE p.slug = ? AND p.activo = true
      ORDER BY i.es_principal DESC, i.orden ASC
    `, [slug]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    const product = structureProductWithImages(rows);

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error obteniendo producto:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener el producto',
      message: error.message
    });
  }
};

// ============================================
// OBTENER PRODUCTOS POR CATEGORÍA
// ============================================
const getProductsByCategory = async (req, res) => {
  try {
    const { categoriaId } = req.params;

    const [rows] = await promisePool.query(`
      SELECT 
        p.id,
        p.categoria_id,
        p.titulo,
        p.slug,
        p.descripcion,
        p.precio_valor,
        p.precio_tipo,
        p.material,
        p.medidas,
        p.capacidad,
        p.personalizable,
        p.colores,
        p.cantidad,
        p.tiempo_entrega_tipo,
        p.tiempo_entrega_dias,
        p.destacado,
        p.activo,
        c.nombre as categoria_nombre,
        c.slug as categoria_slug,
        i.id as imagen_id,
        i.url as imagen_url,
        i.cloudinary_id as imagen_cloudinary_id,
        i.es_principal as imagen_es_principal,
        i.orden as imagen_orden,
        i.alt_text as imagen_alt_text
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN imagenes_productos i ON p.id = i.producto_id
      WHERE p.categoria_id = ? AND p.activo = true
      ORDER BY p.destacado DESC, p.id DESC
    `, [categoriaId]);

    // Agrupar productos con sus imágenes
    const productsMap = new Map();
    rows.forEach(row => {
      if (!productsMap.has(row.id)) {
        productsMap.set(row.id, []);
      }
      productsMap.get(row.id).push(row);
    });

    const products = Array.from(productsMap.values()).map(productRows => 
      structureProductWithImages(productRows)
    );

    res.json({
      success: true,
      count: products.length,
      categoria_id: parseInt(categoriaId),
      data: products
    });
  } catch (error) {
    console.error('Error obteniendo productos por categoría:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener productos de la categoría',
      message: error.message
    });
  }
};

// ============================================
// OBTENER PRODUCTOS DESTACADOS
// ============================================
const getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const [rows] = await promisePool.query(`
      SELECT 
        p.id,
        p.categoria_id,
        p.titulo,
        p.slug,
        p.descripcion,
        p.precio_valor,
        p.precio_tipo,
        p.material,
        p.medidas,
        p.capacidad,
        p.personalizable,
        p.colores,
        p.cantidad,
        p.tiempo_entrega_tipo,
        p.tiempo_entrega_dias,
        p.destacado,
        p.activo,
        c.nombre as categoria_nombre,
        c.slug as categoria_slug,
        i.id as imagen_id,
        i.url as imagen_url,
        i.cloudinary_id as imagen_cloudinary_id,
        i.es_principal as imagen_es_principal,
        i.orden as imagen_orden,
        i.alt_text as imagen_alt_text
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN imagenes_productos i ON p.id = i.producto_id
      WHERE p.destacado = true AND p.activo = true
      ORDER BY p.id DESC
      LIMIT ?
    `, [parseInt(limit)]);

    // Agrupar productos con sus imágenes
    const productsMap = new Map();
    rows.forEach(row => {
      if (!productsMap.has(row.id)) {
        productsMap.set(row.id, []);
      }
      productsMap.get(row.id).push(row);
    });

    const products = Array.from(productsMap.values()).map(productRows => 
      structureProductWithImages(productRows)
    );

    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Error obteniendo productos destacados:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener productos destacados',
      message: error.message
    });
  }
};

// ============================================
// OBTENER PRODUCTO POR ID
// ============================================
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await promisePool.query(`
      SELECT 
        p.id,
        p.categoria_id,
        p.titulo,
        p.slug,
        p.descripcion,
        p.precio_valor,
        p.precio_tipo,
        p.material,
        p.medidas,
        p.capacidad,
        p.personalizable,
        p.colores,
        p.cantidad,
        p.tiempo_entrega_tipo,
        p.tiempo_entrega_dias,
        p.destacado,
        p.activo,
        c.nombre as categoria_nombre,
        c.slug as categoria_slug,
        i.id as imagen_id,
        i.url as imagen_url,
        i.cloudinary_id as imagen_cloudinary_id,
        i.es_principal as imagen_es_principal,
        i.orden as imagen_orden,
        i.alt_text as imagen_alt_text
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN imagenes_productos i ON p.id = i.producto_id
      WHERE p.id = ?
      ORDER BY i.es_principal DESC, i.orden ASC
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    const product = structureProductWithImages(rows);

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error obteniendo producto:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener el producto',
      message: error.message
    });
  }
};

// ============================================
// EXPORTAR
// ============================================
module.exports = {
  getAllProducts,
  getProductBySlug,
  getProductsByCategory,
  getFeaturedProducts,
  getProductById
};