const { promisePool } = require("../config/database");
const { cloudinary } = require("../config/cloudinary");
const {
  structureProductWithImages,
  attachVariantes,
  attachComboStock,
  PRODUCTO_SELECT_FROM,
} = require("./productController");
const { parseBooleano } = require("../utils/parseBooleano");

// Campos editables vía updateProduct. `activo` se deja afuera del set
// dinámico habitual porque este endpoint sí lo maneja explícitamente (soft
// delete y reactivación conviven en el mismo formulario de edición, a
// diferencia de proveedores/clientes).
const CAMPOS_EDITABLES_PRODUCTO = [
  "categoria_id",
  "titulo",
  "slug",
  "descripcion",
  "precio_valor",
  "precio_tipo",
  "material",
  "medidas",
  "capacidad",
  "personalizable",
  "colores",
  "cantidad",
  "stock_minimo",
  "controla_stock",
  "tiempo_entrega_tipo",
  "tiempo_entrega_dias",
  "destacado",
  "en_oferta",
  "precio_oferta",
  "activo",
  "visible_publico",
  "mostrar_precio",
  "mostrar_imagen",
  "mostrar_descripcion",
  "unidades_por_caja",
  "precio_caja",
];

// Una oferta solo tiene sentido sobre un precio de lista fijo: "desde" y
// "consultar" no tienen un precio_valor real contra el cual tachar. Devuelve
// un mensaje de error, o null si está todo bien.
const validarOferta = ({ en_oferta, precio_tipo, precio_valor, precio_oferta }) => {
  if (!en_oferta) return null;

  if (precio_tipo !== "fijo") {
    return "Solo un producto con precio fijo puede estar en oferta";
  }
  if (!precio_valor || !precio_oferta) {
    return "Para poner un producto en oferta hace falta el precio normal y el precio de oferta";
  }
  if (parseFloat(precio_oferta) >= parseFloat(precio_valor)) {
    return "El precio de oferta debe ser menor al precio normal";
  }
  return null;
};

// unidades_por_caja y precio_caja son un par: uno sin el otro no significa
// nada (¿precio de una caja de cuántas unidades? ¿cuántas unidades por caja
// a qué precio?). Ambos opcionales -- un producto sin ninguno de los dos
// simplemente no se vende por caja, como hoy.
const validarVentaPorCaja = ({ unidades_por_caja, precio_caja }) => {
  const tieneUnidades = unidades_por_caja !== undefined && unidades_por_caja !== null && unidades_por_caja !== "";
  const tienePrecio = precio_caja !== undefined && precio_caja !== null && precio_caja !== "";

  if (!tieneUnidades && !tienePrecio) return null;
  if (tieneUnidades !== tienePrecio) {
    return "Para vender por caja hace falta indicar tanto las unidades por caja como el precio de la caja";
  }
  if (!Number.isInteger(Number(unidades_por_caja)) || Number(unidades_por_caja) <= 0) {
    return "Las unidades por caja deben ser un número entero mayor a 0";
  }
  if (!Number.isFinite(parseFloat(precio_caja)) || parseFloat(precio_caja) <= 0) {
    return "El precio de la caja debe ser un número mayor a 0";
  }
  return null;
};

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
      stock_minimo,
      controla_stock,
      tiempo_entrega_tipo,
      tiempo_entrega_dias,
      destacado,
      en_oferta,
      precio_oferta,
      visible_publico,
      mostrar_precio,
      mostrar_imagen,
      mostrar_descripcion,
      unidades_por_caja,
      precio_caja,
    } = req.body;

    const errorVentaPorCaja = validarVentaPorCaja({ unidades_por_caja, precio_caja });
    if (errorVentaPorCaja) {
      return res.status(400).json({ success: false, error: errorVentaPorCaja });
    }

    // controla_stock por defecto es true (la mayoría del catálogo controla
    // stock); solo queda en false si se manda explícitamente
    const controlaStockFinal = controla_stock === undefined ? 1 : parseBooleano(controla_stock);

    // visible_publico por defecto es true (se ve en la tienda pública);
    // solo queda oculto si se manda explícitamente en false. Es distinto de
    // `activo`: un producto puede existir y venderse por el admin sin
    // aparecer en la tienda.
    const visiblePublicoFinal = visible_publico === undefined ? 1 : parseBooleano(visible_publico);

    // mostrar_precio/mostrar_imagen/mostrar_descripcion: mismo default true
    // que visible_publico -- solo aplican mientras el producto ya es
    // visible, no reemplazan a visible_publico.
    const mostrarPrecioFinal = mostrar_precio === undefined ? 1 : parseBooleano(mostrar_precio);
    const mostrarImagenFinal = mostrar_imagen === undefined ? 1 : parseBooleano(mostrar_imagen);
    const mostrarDescripcionFinal = mostrar_descripcion === undefined ? 1 : parseBooleano(mostrar_descripcion);

    const enOfertaFinal = en_oferta === undefined ? 0 : parseBooleano(en_oferta);

    // Validar campos requeridos
    if (!categoria_id || !titulo || !slug) {
      return res.status(400).json({
        success: false,
        error: "Categoría, título y slug son requeridos",
      });
    }

    // Validar precio_tipo
    if (precio_tipo && !["fijo", "desde", "consultar", "variantes", "combo"].includes(precio_tipo)) {
      return res.status(400).json({
        success: false,
        error: "precio_tipo debe ser: fijo, desde, consultar, variantes o combo",
      });
    }

    const errorOferta = validarOferta({
      en_oferta: enOfertaFinal,
      precio_tipo: precio_tipo || "fijo",
      precio_valor,
      precio_oferta,
    });
    if (errorOferta) {
      return res.status(400).json({ success: false, error: errorOferta });
    }

    // Insertar producto
    const [result] = await promisePool.query(
      `INSERT INTO productos (
        categoria_id, titulo, slug, descripcion, precio_valor, precio_oferta, precio_tipo,
        material, medidas, capacidad, personalizable, colores, cantidad,
        stock_minimo, controla_stock, tiempo_entrega_tipo, tiempo_entrega_dias, destacado, en_oferta, activo, visible_publico,
        mostrar_precio, mostrar_imagen, mostrar_descripcion, unidades_por_caja, precio_caja
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true, ?, ?, ?, ?, ?, ?)`,
      [
        categoria_id,
        titulo,
        slug,
        descripcion || null,
        precio_valor || null,
        enOfertaFinal ? precio_oferta : null,
        precio_tipo || "fijo",
        material || null,
        medidas || null,
        capacidad || null,
        personalizable || false,
        colores || null,
        cantidad || 0,
        stock_minimo || 0,
        controlaStockFinal,
        tiempo_entrega_tipo || "dias",
        tiempo_entrega_dias || 3,
        destacado || false,
        enOfertaFinal,
        visiblePublicoFinal,
        mostrarPrecioFinal,
        mostrarImagenFinal,
        mostrarDescripcionFinal,
        unidades_por_caja || null,
        precio_caja || null,
      ],
    );

    const productId = result.insertId;

    // Obtener el producto creado
    const [products] = await promisePool.query(
      "SELECT * FROM productos WHERE id = ?",
      [productId],
    );

    res.status(201).json({
      success: true,
      message: "Producto creado exitosamente",
      data: products[0],
    });
  } catch (error) {
    console.error("Error creando producto:", error);

    // Error de slug duplicado
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        success: false,
        error: "Ya existe un producto con ese slug",
      });
    }

    res.status(500).json({
      success: false,
      error: "Error al crear el producto",
      message: error.message,
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

    if (updates.personalizable !== undefined) {
      updates.personalizable = parseBooleano(updates.personalizable, ["Sí"]);
    }
    if (updates.destacado !== undefined) {
      updates.destacado = parseBooleano(updates.destacado);
    }
    if (updates.activo !== undefined) {
      updates.activo = parseBooleano(updates.activo);
    }
    if (updates.visible_publico !== undefined) {
      updates.visible_publico = parseBooleano(updates.visible_publico);
    }
    if (updates.mostrar_precio !== undefined) {
      updates.mostrar_precio = parseBooleano(updates.mostrar_precio);
    }
    if (updates.mostrar_imagen !== undefined) {
      updates.mostrar_imagen = parseBooleano(updates.mostrar_imagen);
    }
    if (updates.mostrar_descripcion !== undefined) {
      updates.mostrar_descripcion = parseBooleano(updates.mostrar_descripcion);
    }
    if (updates.en_oferta !== undefined) {
      updates.en_oferta = parseBooleano(updates.en_oferta);
    }

    // Verificar que el producto existe
    const [products] = await promisePool.query(
      "SELECT id, precio_tipo, precio_valor, precio_oferta, en_oferta, unidades_por_caja, precio_caja FROM productos WHERE id = ?",
      [id],
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Producto no encontrado",
      });
    }

    // La validación de venta por caja corre sobre el estado FINAL (valores
    // nuevos si vienen en el update, si no los que ya tenía en la DB) --
    // mismo criterio que la validación de oferta más abajo.
    const errorVentaPorCaja = validarVentaPorCaja({
      unidades_por_caja:
        updates.unidades_por_caja !== undefined
          ? updates.unidades_por_caja
          : products[0].unidades_por_caja,
      precio_caja:
        updates.precio_caja !== undefined
          ? updates.precio_caja
          : products[0].precio_caja,
    });
    if (errorVentaPorCaja) {
      return res.status(400).json({ success: false, error: errorVentaPorCaja });
    }

    // Validar precio_tipo si viene en el update
    if (
      updates.precio_tipo &&
      !["fijo", "desde", "consultar", "variantes", "combo"].includes(updates.precio_tipo)
    ) {
      return res.status(400).json({
        success: false,
        error: "precio_tipo debe ser: fijo, desde, consultar, variantes o combo",
      });
    }

    // La validación de oferta corre sobre el estado FINAL del producto
    // (valores nuevos si vienen en el update, si no los que ya tenía en la
    // DB) -- un update parcial que solo cambia el título no debería poder
    // pisar una oferta ya válida ni dejarla en un estado inconsistente.
    const productoActual = products[0];
    const errorOferta = validarOferta({
      en_oferta:
        updates.en_oferta !== undefined
          ? updates.en_oferta
          : productoActual.en_oferta,
      precio_tipo:
        updates.precio_tipo !== undefined
          ? updates.precio_tipo
          : productoActual.precio_tipo,
      precio_valor:
        updates.precio_valor !== undefined
          ? updates.precio_valor
          : productoActual.precio_valor,
      precio_oferta:
        updates.precio_oferta !== undefined
          ? updates.precio_oferta
          : productoActual.precio_oferta,
    });
    if (errorOferta) {
      return res.status(400).json({ success: false, error: errorOferta });
    }

    // Construir query dinámico. req.body ya viene filtrado por el
    // middleware sanitizeBody (ver routes/admin.js) a solo los campos de
    // CAMPOS_EDITABLES_PRODUCTO.
    const fields = Object.keys(updates);
    const values = Object.values(updates);

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No hay campos para actualizar",
      });
    }

    const setClause = fields.map((field) => `${field} = ?`).join(", ");
    values.push(id);

    await promisePool.query(
      `UPDATE productos SET ${setClause} WHERE id = ?`,
      values,
    );

    // Obtener producto actualizado
    const [updatedProduct] = await promisePool.query(
      "SELECT * FROM productos WHERE id = ?",
      [id],
    );

    res.json({
      success: true,
      message: "Producto actualizado exitosamente",
      data: updatedProduct[0],
    });
  } catch (error) {
    console.error("Error actualizando producto:", error);
    res.status(500).json({
      success: false,
      error: "Error al actualizar el producto",
      message: error.message,
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
      "SELECT id FROM productos WHERE id = ?",
      [id],
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Producto no encontrado",
      });
    }

    // Soft delete
    await promisePool.query(
      "UPDATE productos SET activo = false WHERE id = ?",
      [id],
    );

    res.json({
      success: true,
      message: "Producto eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error eliminando producto:", error);
    res.status(500).json({
      success: false,
      error: "Error al eliminar el producto",
      message: error.message,
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
      "SELECT id FROM productos WHERE id = ?",
      [id],
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Producto no encontrado",
      });
    }

    // Verificar que se subió un archivo
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No se proporcionó ninguna imagen",
      });
    }

    // Si es imagen principal, quitar flag de otras imágenes
    if (es_principal === "true" || es_principal === true) {
      await promisePool.query(
        "UPDATE imagenes_productos SET es_principal = false WHERE producto_id = ?",
        [id],
      );
    }

    // Subir a Cloudinary usando buffer
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "productos",
          resource_type: "image",
          transformation: [
            { width: 2000, height: 2000, crop: "limit" },
            { quality: "auto", fetch_format: "auto" },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );

      uploadStream.end(req.file.buffer);
    });

    const result = await uploadPromise;

    // Obtener el siguiente orden
    const [maxOrden] = await promisePool.query(
      "SELECT COALESCE(MAX(orden), 0) as max_orden FROM imagenes_productos WHERE producto_id = ?",
      [id],
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
        es_principal === "true" || es_principal === true,
        orden,
        alt_text || req.file.originalname,
      ],
    );

    // Obtener imagen guardada
    const [images] = await promisePool.query(
      "SELECT * FROM imagenes_productos WHERE id = ?",
      [insertResult.insertId],
    );

    res.status(201).json({
      success: true,
      message: "Imagen subida exitosamente",
      data: images[0],
    });
  } catch (error) {
    console.error("Error subiendo imagen:", error);
    res.status(500).json({
      success: false,
      error: "Error al subir la imagen",
      message: error.message,
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
      "SELECT * FROM imagenes_productos WHERE id = ? AND producto_id = ?",
      [imageId, id],
    );

    if (images.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Imagen no encontrada",
      });
    }

    const image = images[0];

    // Eliminar de Cloudinary
    await cloudinary.uploader.destroy(image.cloudinary_id);

    // Eliminar de BD
    await promisePool.query("DELETE FROM imagenes_productos WHERE id = ?", [
      imageId,
    ]);

    res.json({
      success: true,
      message: "Imagen eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error eliminando imagen:", error);
    res.status(500).json({
      success: false,
      error: "Error al eliminar la imagen",
      message: error.message,
    });
  }
};

const getAllProductsAdmin = async (req, res) => {
  try {
    const { categoria_id } = req.query;

    let query = `
      SELECT ${PRODUCTO_SELECT_FROM}
      WHERE 1=1
    `;

    const params = [];

    if (categoria_id) {
      query += ` AND p.categoria_id = ?`;
      params.push(categoria_id);
    }

    query += ` ORDER BY p.id DESC`;

    const [rows] = await promisePool.query(query, params);
    const productsMap = new Map();
    rows.forEach((row) => {
      if (!productsMap.has(row.id)) productsMap.set(row.id, []);
      productsMap.get(row.id).push(row);
    });

    const products = Array.from(productsMap.values()).map((productRows) =>
      structureProductWithImages(productRows),
    );
    await attachVariantes(products, { soloActivas: false });
    await attachComboStock(products);

    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    console.error("Error obteniendo productos admin:", error);
    res
      .status(500)
      .json({
        success: false,
        error: "Error al obtener productos",
        message: error.message,
      });
  }
};

// ============================================
// OBTENER PRODUCTO POR ID (admin: sin filtro de activo/visible_publico,
// para poder ver y editar un producto oculto o inactivo)
// ============================================
const getProductByIdAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await promisePool.query(
      `SELECT ${PRODUCTO_SELECT_FROM}
      WHERE p.id = ?
      ORDER BY i.es_principal DESC, i.orden ASC`,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Producto no encontrado",
      });
    }

    const product = structureProductWithImages(rows);
    await attachVariantes([product], { soloActivas: false });
    await attachComboStock([product]);

    res.json({ success: true, data: product });
  } catch (error) {
    console.error("Error obteniendo producto admin:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener el producto",
      message: error.message,
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
  deleteProductImage,
  getAllProductsAdmin,
  getProductByIdAdmin,
  CAMPOS_EDITABLES_PRODUCTO,
};
