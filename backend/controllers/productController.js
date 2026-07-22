const { promisePool } = require('../config/database');
const { calcularStockCombo } = require('../utils/stockMovements');

// Columnas + FROM/JOIN comunes a toda consulta de productos (pública o de
// admin). Se comparte para no repetir esta misma lista de 20 columnas en
// cada función por separado -- agregar/sacar una columna de producto se
// hace en un solo lugar.
const PRODUCTO_SELECT_FROM = `
  p.id, p.categoria_id, p.titulo, p.slug, p.descripcion,
  p.precio_valor, p.precio_oferta, p.precio_tipo, p.material, p.medidas, p.capacidad,
  p.personalizable, p.colores, p.cantidad, p.stock_minimo, p.controla_stock,
  p.tiempo_entrega_tipo, p.tiempo_entrega_dias, p.destacado, p.en_oferta, p.activo, p.visible_publico,
  p.mostrar_precio, p.mostrar_imagen, p.mostrar_descripcion,
  p.unidades_por_caja, p.precio_caja,
  c.nombre as categoria_nombre, c.slug as categoria_slug,
  i.id as imagen_id, i.url as imagen_url, i.cloudinary_id as imagen_cloudinary_id,
  i.es_principal as imagen_es_principal, i.orden as imagen_orden, i.alt_text as imagen_alt_text
  FROM productos p
  LEFT JOIN categorias c ON p.categoria_id = c.id
  LEFT JOIN imagenes_productos i ON p.id = i.producto_id
`;

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
    precio_oferta: rows[0].precio_oferta ? parseFloat(rows[0].precio_oferta) : null,
    precio_tipo: rows[0].precio_tipo,

    material: rows[0].material,
    medidas: rows[0].medidas,
    capacidad: rows[0].capacidad,
    personalizable: rows[0].personalizable ? 'Sí' : 'No',
    colores: rows[0].colores,
    
    // CANTIDAD (stock)
    cantidad: rows[0].cantidad,
    stock_minimo: rows[0].stock_minimo,
    controla_stock: Boolean(rows[0].controla_stock),

    // TIEMPO DE ENTREGA
    tiempo_entrega_tipo: rows[0].tiempo_entrega_tipo,
    tiempo_entrega_dias: rows[0].tiempo_entrega_dias,
    
    destacado: Boolean(rows[0].destacado),
    en_oferta: Boolean(rows[0].en_oferta),
    activo: Boolean(rows[0].activo),
    visible_publico: Boolean(rows[0].visible_publico),
    mostrar_precio: Boolean(rows[0].mostrar_precio),
    mostrar_imagen: Boolean(rows[0].mostrar_imagen),
    mostrar_descripcion: Boolean(rows[0].mostrar_descripcion),

    // VENTA POR CAJA -- puramente informativo para la carga de ventas/
    // pedidos (ver migración 027), nunca se muestra en el catálogo público.
    unidades_por_caja: rows[0].unidades_por_caja,
    precio_caja: rows[0].precio_caja ? parseFloat(rows[0].precio_caja) : null,

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
// VARIANTES: adjuntar a una lista de productos ya estructurados
// ============================================
// Un producto con precio_tipo='variantes' no usa su propio precio_valor
// (queda desactualizado a propósito) -- acá se recalcula como el mínimo
// de las variantes activas, igual que mostraría un "desde" normal.
const attachVariantes = async (products, { soloActivas = true } = {}) => {
  const ids = products.map((p) => p.id);
  if (ids.length === 0) return products;

  let query = `
    SELECT id, producto_id, nombre, precio_valor, cantidad, stock_minimo, orden, activo
    FROM producto_variantes
    WHERE producto_id IN (${ids.map(() => '?').join(',')})
  `;
  if (soloActivas) query += ' AND activo = true';
  query += ' ORDER BY orden ASC, id ASC';

  const [rows] = await promisePool.query(query, ids);

  const variantesPorProducto = new Map();
  rows.forEach((row) => {
    if (!variantesPorProducto.has(row.producto_id)) {
      variantesPorProducto.set(row.producto_id, []);
    }
    variantesPorProducto.get(row.producto_id).push({
      id: row.id,
      nombre: row.nombre,
      precio_valor: parseFloat(row.precio_valor),
      cantidad: row.cantidad,
      stock_minimo: row.stock_minimo,
      orden: row.orden,
      activo: Boolean(row.activo),
    });
  });

  products.forEach((product) => {
    if (!product) return;
    product.variantes = variantesPorProducto.get(product.id) || [];
    if (product.precio_tipo === 'variantes') {
      const preciosActivos = product.variantes
        .filter((v) => v.activo)
        .map((v) => v.precio_valor);
      product.precio_valor =
        preciosActivos.length > 0 ? Math.min(...preciosActivos) : null;
      // precio_valor_max: junto con precio_valor (el mínimo, arriba), le
      // permite al frontend mostrar "Desde $X" solo cuando las variantes
      // activas realmente varían de precio -- si todas cuestan lo mismo,
      // "Desde" es engañoso (implica opciones más caras que no existen).
      // Se calcula acá, una sola vez, para que todas las pantallas
      // (público y admin) usen el mismo criterio sin duplicar la lógica.
      product.precio_valor_max =
        preciosActivos.length > 0 ? Math.max(...preciosActivos) : null;
      // product.cantidad queda sin usar en productos.cantidad para este
      // tipo (migración 018) -- se sobreescribe acá con la suma de stock
      // de las variantes activas, mismo criterio que attachComboStock ya
      // aplica para 'combo', para que cualquier pantalla que lea
      // product.cantidad (admin: ProductList, ProductDetail, ProductForm)
      // muestre un número real en vez del valor crudo sin usar.
      product.cantidad = product.variantes
        .filter((v) => v.activo)
        .reduce((total, v) => total + v.cantidad, 0);
    }
  });

  return products;
};

// ============================================
// COMBOS: adjuntar a una lista de productos ya estructurados
// ============================================
// Un producto con precio_tipo='combo' no tiene stock propio (ver migración
// 021) -- acá se pisa `cantidad` con el stock derivado de su receta, igual
// que attachVariantes pisa precio_valor para 'variantes'. El frontend público
// y el admin ya leen `cantidad` como el campo de stock disponible, así que
// no hace falta tocarlos para que muestren el número correcto.
const attachComboStock = async (products) => {
  for (const product of products) {
    if (!product || product.precio_tipo !== 'combo') continue;
    product.cantidad = await calcularStockCombo(promisePool, product.id);
  }
  return products;
};

// ============================================
// OBTENER TODOS LOS PRODUCTOS
// ============================================
const getAllProducts = async (req, res) => {
  try {
    const { limit = 50, offset = 0, destacados, categoria_id, en_oferta, combo } = req.query;

    let query = `
      SELECT ${PRODUCTO_SELECT_FROM}
      WHERE p.activo = true AND p.visible_publico = true
    `;

    const params = [];

    // Filtro por destacados
    if (destacados === 'true') {
      query += ` AND p.destacado = true`;
    }

    // Filtro por ofertas -- no es una categoría real, es un flag sobre el
    // producto (ver migración 017), pero el front lo consume igual que un
    // filtro de categoría para armar la página /ofertas.
    if (en_oferta === 'true') {
      query += ` AND p.en_oferta = true`;
    }

    // Filtro por combos -- tampoco es una categoría real, es precio_tipo=
    // 'combo' (ver migración 021), consumido igual que en_oferta para armar
    // la página /combos.
    if (combo === 'true') {
      query += ` AND p.precio_tipo = 'combo'`;
    }

    // Filtro por categoría
    if (categoria_id) {
      query += ` AND p.categoria_id = ?`;
      params.push(categoria_id);
    }

    query += ` ORDER BY p.precio_valor ASC`;
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
    await attachVariantes(products);
    await attachComboStock(products);

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
      SELECT ${PRODUCTO_SELECT_FROM}
      WHERE p.slug = ? AND p.activo = true AND p.visible_publico = true
      ORDER BY i.es_principal DESC, i.orden ASC
    `, [slug]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    const product = structureProductWithImages(rows);
    await attachVariantes([product]);
    await attachComboStock([product]);

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
      SELECT ${PRODUCTO_SELECT_FROM}
      WHERE p.categoria_id = ? AND p.activo = true AND p.visible_publico = true
      ORDER BY p.precio_valor ASC
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
    await attachVariantes(products);
    await attachComboStock(products);

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
      SELECT ${PRODUCTO_SELECT_FROM}
      WHERE p.destacado = true AND p.activo = true AND p.visible_publico = true
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
    await attachVariantes(products);
    await attachComboStock(products);

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
      SELECT ${PRODUCTO_SELECT_FROM}
      WHERE p.id = ? AND p.activo = true AND p.visible_publico = true
      ORDER BY i.es_principal DESC, i.orden ASC
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    const product = structureProductWithImages(rows);
    await attachVariantes([product]);
    await attachComboStock([product]);

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
  getProductById,
  structureProductWithImages,
  attachVariantes,
  attachComboStock,
  PRODUCTO_SELECT_FROM
};