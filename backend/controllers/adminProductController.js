const { promisePool } = require('../config/database');
const { cloudinary } = require('../config/cloudinary');

// ============================================
// CREAR PRODUCTO
// ============================================
const createProduct = async (req, res) => {
  try {
    const {
      categoria_id,
      titulo,
      slug,
      descripcion,
      precio_valor,
      precio_tipo,
      material,
      medidas,
      capacidad,
      personalizable,
      colores,
      cantidad,
      tiempo_entrega_tipo,
      tiempo_entrega_dias,
      destacado
    } = req.body;

    // Validar campos requeridos
    if (!categoria_id || !titulo || !slug) {
      return res.status(400).json({
        success: false,
        error: 'Categoría, título y slug son requeridos'
      });
    }

    // Validar precio_tipo
    if (precio_tipo && !['fijo', 'desde', 'consultar'].includes(precio_tipo)) {
      return res.status(400).json({
        success: false,
        error: 'precio_tipo debe ser: fijo, desde, o consultar'
      });
    }

    // Insertar producto
    const [result] = await promisePool.query(
      `INSERT INTO productos (
        categoria_id, titulo, slug, descripcion, precio_valor, precio_tipo,
        material, medidas, capacidad, personalizable, colores, cantidad,
        tiempo_entrega_tipo, tiempo_entrega_dias, destacado, activo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true)`,
      [
        categoria_id,
        titulo,
        slug,
        descripcion || null,
        precio_valor || null,
        precio_tipo || 'fijo',
        material || null,
        medidas || null,
        capacidad || null,
        personalizable || false,
        colores || null,
        cantidad || 0,
        tiempo_entrega_tipo || 'dias',
        tiempo_entrega_dias || 3,
        destacado || false
      ]
    );

    const productId = result.insertId;

    // Obtener el producto creado
    const [products] = await promisePool.query(
      'SELECT * FROM productos WHERE id = ?',
      [productId]
    );

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: products[0]
    });
  } catch (error) {
    console.error('Error creando producto:', error);
    
    // Error de slug duplicado
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        error: 'Ya existe un producto con ese slug'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error al crear el producto',
      message: error.message
    });
  }
};

// ============================================
// ACTUALIZAR PRODUCTO
// ============================================
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Verificar que el producto existe
    const [products] = await promisePool.query(
      'SELECT id FROM productos WHERE id = ?',
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    // Validar precio_tipo si viene en el update
    if (updates.precio_tipo && !['fijo', 'desde', 'consultar'].includes(updates.precio_tipo)) {
      return res.status(400).json({
        success: false,
        error: 'precio_tipo debe ser: fijo, desde, o consultar'
      });
    }

    // Construir query dinámico
    const fields = Object.keys(updates);
    const values = Object.values(updates);

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No hay campos para actualizar'
      });
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    values.push(id);

    await promisePool.query(
      `UPDATE productos SET ${setClause} WHERE id = ?`,
      values
    );

    // Obtener producto actualizado
    const [updatedProduct] = await promisePool.query(
      'SELECT * FROM productos WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: updatedProduct[0]
    });
  } catch (error) {
    console.error('Error actualizando producto:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar el producto',
      message: error.message
    });
  }
};

// ============================================
// ELIMINAR PRODUCTO (SOFT DELETE)
// ============================================
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que existe
    const [products] = await promisePool.query(
      'SELECT id FROM productos WHERE id = ?',
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    // Soft delete
    await promisePool.query(
      'UPDATE productos SET activo = false WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando producto:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar el producto',
      message: error.message
    });
  }
};

// ============================================
// SUBIR IMAGEN A CLOUDINARY
// ============================================
const uploadProductImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { es_principal, alt_text } = req.body;

    // Verificar que el producto existe
    const [products] = await promisePool.query(
      'SELECT id FROM productos WHERE id = ?',
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    // Verificar que se subió un archivo
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No se proporcionó ninguna imagen'
      });
    }

    // Si es imagen principal, quitar flag de otras imágenes
    if (es_principal === 'true' || es_principal === true) {
      await promisePool.query(
        'UPDATE imagenes_productos SET es_principal = false WHERE producto_id = ?',
        [id]
      );
    }

    // Subir a Cloudinary usando buffer
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'productos',
          resource_type: 'image',
          transformation: [
            { width: 2000, height: 2000, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.end(req.file.buffer);
    });

    const result = await uploadPromise;

    // Obtener el siguiente orden
    const [maxOrden] = await promisePool.query(
      'SELECT COALESCE(MAX(orden), 0) as max_orden FROM imagenes_productos WHERE producto_id = ?',
      [id]
    );

    const orden = maxOrden[0].max_orden + 1;

    // Guardar en BD
    const [insertResult] = await promisePool.query(
      `INSERT INTO imagenes_productos (
        producto_id, url, cloudinary_id, es_principal, orden, alt_text
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        result.secure_url,
        result.public_id,
        es_principal === 'true' || es_principal === true,
        orden,
        alt_text || req.file.originalname
      ]
    );

    // Obtener imagen guardada
    const [images] = await promisePool.query(
      'SELECT * FROM imagenes_productos WHERE id = ?',
      [insertResult.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Imagen subida exitosamente',
      data: images[0]
    });
  } catch (error) {
    console.error('Error subiendo imagen:', error);
    res.status(500).json({
      success: false,
      error: 'Error al subir la imagen',
      message: error.message
    });
  }
};

// ============================================
// ELIMINAR IMAGEN
// ============================================
const deleteProductImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;

    // Obtener la imagen
    const [images] = await promisePool.query(
      'SELECT * FROM imagenes_productos WHERE id = ? AND producto_id = ?',
      [imageId, id]
    );

    if (images.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Imagen no encontrada'
      });
    }

    const image = images[0];

    // Eliminar de Cloudinary
    await cloudinary.uploader.destroy(image.cloudinary_id);

    // Eliminar de BD
    await promisePool.query(
      'DELETE FROM imagenes_productos WHERE id = ?',
      [imageId]
    );

    res.json({
      success: true,
      message: 'Imagen eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando imagen:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar la imagen',
      message: error.message
    });
  }
};

// ============================================
// EXPORTAR
// ============================================
module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  deleteProductImage
};