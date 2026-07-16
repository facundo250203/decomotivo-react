const { promisePool } = require("../config/database");
const { parseBooleano } = require("../utils/parseBooleano");

// Campos editables vía updateVariante. Ver middleware/sanitizeBody.js --
// cualquier UPDATE armado desde Object.keys(req.body) debe pasar por acá.
const CAMPOS_EDITABLES_VARIANTE = [
  "nombre",
  "precio_valor",
  "cantidad",
  "stock_minimo",
  "orden",
  "activo",
];

// ============================================
// CREAR VARIANTE
// ============================================
const createVariante = async (req, res) => {
  try {
    const { productoId } = req.params;
    const { nombre, precio_valor, cantidad, stock_minimo, orden } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({
        success: false,
        error: "El nombre de la variante es obligatorio",
      });
    }

    if (!precio_valor || parseFloat(precio_valor) <= 0) {
      return res.status(400).json({
        success: false,
        error: "El precio de la variante debe ser mayor a 0",
      });
    }

    const [productos] = await promisePool.query(
      "SELECT id FROM productos WHERE id = ?",
      [productoId],
    );
    if (productos.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Producto no encontrado",
      });
    }

    const [result] = await promisePool.query(
      `INSERT INTO producto_variantes (producto_id, nombre, precio_valor, cantidad, stock_minimo, orden)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        productoId,
        nombre.trim(),
        precio_valor,
        cantidad || 0,
        stock_minimo || 0,
        orden || 0,
      ],
    );

    const [variantes] = await promisePool.query(
      "SELECT * FROM producto_variantes WHERE id = ?",
      [result.insertId],
    );

    res.status(201).json({
      success: true,
      message: "Variante creada exitosamente",
      data: variantes[0],
    });
  } catch (error) {
    console.error("Error creando variante:", error);
    res.status(500).json({
      success: false,
      error: "Error al crear la variante",
      message: error.message,
    });
  }
};

// ============================================
// ACTUALIZAR VARIANTE
// ============================================
const updateVariante = async (req, res) => {
  try {
    const { varianteId } = req.params;
    const updates = req.body;

    if (updates.activo !== undefined) {
      updates.activo = parseBooleano(updates.activo);
    }

    const [variantes] = await promisePool.query(
      "SELECT id FROM producto_variantes WHERE id = ?",
      [varianteId],
    );
    if (variantes.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Variante no encontrada",
      });
    }

    if (
      updates.precio_valor !== undefined &&
      parseFloat(updates.precio_valor) <= 0
    ) {
      return res.status(400).json({
        success: false,
        error: "El precio de la variante debe ser mayor a 0",
      });
    }

    const fields = Object.keys(updates).filter((field) =>
      CAMPOS_EDITABLES_VARIANTE.includes(field),
    );
    const values = fields.map((field) => updates[field]);

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No hay campos para actualizar",
      });
    }

    const setClause = fields.map((field) => `${field} = ?`).join(", ");
    values.push(varianteId);

    await promisePool.query(
      `UPDATE producto_variantes SET ${setClause} WHERE id = ?`,
      values,
    );

    const [updated] = await promisePool.query(
      "SELECT * FROM producto_variantes WHERE id = ?",
      [varianteId],
    );

    res.json({
      success: true,
      message: "Variante actualizada exitosamente",
      data: updated[0],
    });
  } catch (error) {
    console.error("Error actualizando variante:", error);
    res.status(500).json({
      success: false,
      error: "Error al actualizar la variante",
      message: error.message,
    });
  }
};

// ============================================
// ELIMINAR VARIANTE (SOFT DELETE)
// ============================================
const deleteVariante = async (req, res) => {
  try {
    const { varianteId } = req.params;

    const [variantes] = await promisePool.query(
      "SELECT id FROM producto_variantes WHERE id = ?",
      [varianteId],
    );
    if (variantes.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Variante no encontrada",
      });
    }

    await promisePool.query(
      "UPDATE producto_variantes SET activo = false WHERE id = ?",
      [varianteId],
    );

    res.json({
      success: true,
      message: "Variante eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error eliminando variante:", error);
    res.status(500).json({
      success: false,
      error: "Error al eliminar la variante",
      message: error.message,
    });
  }
};

module.exports = {
  createVariante,
  updateVariante,
  deleteVariante,
  CAMPOS_EDITABLES_VARIANTE,
};
