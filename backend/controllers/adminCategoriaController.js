const { promisePool } = require("../config/database");
const { parseBooleano } = require("../utils/parseBooleano");

// Campos editables vía updateCategoria. `orden` se maneja acá también --
// las flechas de mover arriba/abajo en el admin son dos llamadas a este
// mismo endpoint intercambiando el orden entre dos categorías vecinas, no
// un endpoint aparte.
const CAMPOS_EDITABLES_CATEGORIA = [
  "nombre",
  "slug",
  "descripcion",
  "imagen_background",
  "activa",
  "orden",
];

// MySQL devuelve `activa` (tinyint) como 0/1, no como boolean real -- se
// castea acá, una sola vez, para que el frontend siempre reciba true/false
// real, igual que ya hacen productController/clientesController con sus
// propios flags.
const conActivaBoolean = (categoria) => ({
  ...categoria,
  activa: Boolean(categoria.activa),
});

// ============================================
// LISTAR TODAS LAS CATEGORÍAS (admin: sin filtro de `activa`, a diferencia
// de la ruta pública equivalente en categoryController.js)
// ============================================
const getAllCategoriasAdmin = async (req, res) => {
  try {
    const [categorias] = await promisePool.query(
      `SELECT id, nombre, slug, descripcion, imagen_background, activa, orden
       FROM categorias ORDER BY orden ASC`,
    );
    res.json({
      success: true,
      count: categorias.length,
      data: categorias.map(conActivaBoolean),
    });
  } catch (error) {
    console.error("Error obteniendo categorías:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener las categorías",
      message: error.message,
    });
  }
};

// ============================================
// CREAR CATEGORÍA
// ============================================
const createCategoria = async (req, res) => {
  try {
    const { nombre, slug, descripcion, imagen_background } = req.body;

    if (!nombre || !nombre.trim()) {
      return res
        .status(400)
        .json({ success: false, error: "El nombre es requerido" });
    }
    if (!slug || !slug.trim()) {
      return res
        .status(400)
        .json({ success: false, error: "El slug es requerido" });
    }

    // orden nuevo = después de la última categoría existente, para que
    // aparezca al final del nav sin pisar el orden de las demás.
    const [maxOrdenRows] = await promisePool.query(
      "SELECT COALESCE(MAX(orden), -1) as maxOrden FROM categorias",
    );
    const nuevoOrden = maxOrdenRows[0].maxOrden + 1;

    const [result] = await promisePool.query(
      `INSERT INTO categorias (nombre, slug, descripcion, imagen_background, activa, orden)
       VALUES (?, ?, ?, ?, true, ?)`,
      [
        nombre.trim(),
        slug.trim(),
        descripcion || null,
        imagen_background || null,
        nuevoOrden,
      ],
    );

    const [categorias] = await promisePool.query(
      "SELECT id, nombre, slug, descripcion, imagen_background, activa, orden FROM categorias WHERE id = ?",
      [result.insertId],
    );

    res.status(201).json({
      success: true,
      message: "Categoría creada exitosamente",
      data: conActivaBoolean(categorias[0]),
    });
  } catch (error) {
    console.error("Error creando categoría:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        success: false,
        error: "Ya existe una categoría con ese slug",
      });
    }
    res.status(500).json({
      success: false,
      error: "Error al crear la categoría",
      message: error.message,
    });
  }
};

// ============================================
// ACTUALIZAR CATEGORÍA
// ============================================
const updateCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const [categorias] = await promisePool.query(
      "SELECT id FROM categorias WHERE id = ?",
      [id],
    );
    if (categorias.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Categoría no encontrada" });
    }

    if (updates.activa !== undefined) {
      updates.activa = parseBooleano(updates.activa);
    }

    // req.body ya viene filtrado por el middleware sanitizeBody (ver
    // routes/admin.js) a solo los campos de CAMPOS_EDITABLES_CATEGORIA.
    const fields = Object.keys(updates);
    const values = Object.values(updates);

    if (fields.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "No hay campos para actualizar" });
    }

    const setClause = fields.map((field) => `${field} = ?`).join(", ");
    values.push(id);

    await promisePool.query(
      `UPDATE categorias SET ${setClause} WHERE id = ?`,
      values,
    );

    const [updated] = await promisePool.query(
      "SELECT id, nombre, slug, descripcion, imagen_background, activa, orden FROM categorias WHERE id = ?",
      [id],
    );

    res.json({
      success: true,
      message: "Categoría actualizada exitosamente",
      data: conActivaBoolean(updated[0]),
    });
  } catch (error) {
    console.error("Error actualizando categoría:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        success: false,
        error: "Ya existe una categoría con ese slug",
      });
    }
    res.status(500).json({
      success: false,
      error: "Error al actualizar la categoría",
      message: error.message,
    });
  }
};

module.exports = {
  getAllCategoriasAdmin,
  createCategoria,
  updateCategoria,
  CAMPOS_EDITABLES_CATEGORIA,
};
