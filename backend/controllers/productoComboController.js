const { promisePool } = require("../config/database");

// Campos editables vía updateComboItem. Ver middleware/sanitizeBody.js --
// cualquier UPDATE armado desde Object.keys(req.body) debe pasar por acá.
const CAMPOS_EDITABLES_COMBO_ITEM = [
  "componente_producto_id",
  "componente_variante_id",
  "cantidad",
];

// ============================================
// LISTAR ITEMS DE LA RECETA DE UN COMBO
// ============================================
const listComboItems = async (req, res) => {
  try {
    const { comboId } = req.params;

    const [items] = await promisePool.query(
      `SELECT pci.*, pr.titulo as componente_titulo, pv.nombre as componente_variante_nombre
       FROM producto_combo_items pci
       JOIN productos pr ON pr.id = pci.componente_producto_id
       LEFT JOIN producto_variantes pv ON pv.id = pci.componente_variante_id
       WHERE pci.combo_producto_id = ?
       ORDER BY pci.id ASC`,
      [comboId],
    );

    res.json({ success: true, count: items.length, data: items });
  } catch (error) {
    console.error("Error obteniendo items del combo:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener los items del combo",
      message: error.message,
    });
  }
};

// ============================================
// AGREGAR COMPONENTE A LA RECETA DE UN COMBO
// ============================================
const createComboItem = async (req, res) => {
  try {
    const { comboId } = req.params;
    const { componente_producto_id, componente_variante_id, cantidad } = req.body;

    if (!componente_producto_id) {
      return res.status(400).json({
        success: false,
        error: "El producto componente es obligatorio",
      });
    }
    if (!cantidad || parseInt(cantidad) <= 0) {
      return res.status(400).json({
        success: false,
        error: "La cantidad del componente debe ser mayor a 0",
      });
    }
    if (parseInt(componente_producto_id) === parseInt(comboId)) {
      return res.status(400).json({
        success: false,
        error: "Un combo no puede tener como componente a sí mismo",
      });
    }

    const [combos] = await promisePool.query(
      "SELECT id, precio_tipo FROM productos WHERE id = ?",
      [comboId],
    );
    if (combos.length === 0) {
      return res.status(404).json({ success: false, error: "Combo no encontrado" });
    }
    if (combos[0].precio_tipo !== "combo") {
      return res.status(400).json({
        success: false,
        error: "El producto no es de tipo combo",
      });
    }

    const [componentes] = await promisePool.query(
      "SELECT id FROM productos WHERE id = ?",
      [componente_producto_id],
    );
    if (componentes.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Producto componente no encontrado",
      });
    }

    if (componente_variante_id) {
      const [variantes] = await promisePool.query(
        "SELECT id FROM producto_variantes WHERE id = ? AND producto_id = ?",
        [componente_variante_id, componente_producto_id],
      );
      if (variantes.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Variante del componente no encontrada",
        });
      }
    }

    const [result] = await promisePool.query(
      `INSERT INTO producto_combo_items (combo_producto_id, componente_producto_id, componente_variante_id, cantidad)
       VALUES (?, ?, ?, ?)`,
      [comboId, componente_producto_id, componente_variante_id || null, cantidad],
    );

    const [items] = await promisePool.query(
      "SELECT * FROM producto_combo_items WHERE id = ?",
      [result.insertId],
    );

    res.status(201).json({ success: true, message: "Componente agregado exitosamente", data: items[0] });
  } catch (error) {
    console.error("Error creando item de combo:", error);
    res.status(500).json({
      success: false,
      error: "Error al agregar el componente",
      message: error.message,
    });
  }
};

// ============================================
// ACTUALIZAR COMPONENTE DE LA RECETA
// ============================================
const updateComboItem = async (req, res) => {
  try {
    const { comboItemId } = req.params;
    const updates = req.body;

    const [items] = await promisePool.query(
      "SELECT id FROM producto_combo_items WHERE id = ?",
      [comboItemId],
    );
    if (items.length === 0) {
      return res.status(404).json({ success: false, error: "Componente no encontrado" });
    }
    if (updates.cantidad !== undefined && parseInt(updates.cantidad) <= 0) {
      return res.status(400).json({
        success: false,
        error: "La cantidad del componente debe ser mayor a 0",
      });
    }

    const fields = Object.keys(updates).filter((field) => CAMPOS_EDITABLES_COMBO_ITEM.includes(field));
    const values = fields.map((field) => updates[field]);
    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: "No hay campos para actualizar" });
    }

    const setClause = fields.map((field) => `${field} = ?`).join(", ");
    values.push(comboItemId);
    await promisePool.query(`UPDATE producto_combo_items SET ${setClause} WHERE id = ?`, values);

    const [updated] = await promisePool.query(
      "SELECT * FROM producto_combo_items WHERE id = ?",
      [comboItemId],
    );
    res.json({ success: true, message: "Componente actualizado exitosamente", data: updated[0] });
  } catch (error) {
    console.error("Error actualizando item de combo:", error);
    res.status(500).json({
      success: false,
      error: "Error al actualizar el componente",
      message: error.message,
    });
  }
};

// ============================================
// QUITAR COMPONENTE DE LA RECETA
// A diferencia de producto_variantes (soft delete, porque una variante
// arrastra su propio historial de ventas vía producto_variante_id), una
// fila de producto_combo_items es solo una línea de receta sin historial
// propio -- las ventas de un combo quedan trazadas contra los movimientos
// de stock de sus componentes, no contra esta tabla. Borrarla de verdad no
// pierde información de negocio, así que acá el delete es DURO.
// ============================================
const deleteComboItem = async (req, res) => {
  try {
    const { comboItemId } = req.params;

    const [items] = await promisePool.query(
      "SELECT id FROM producto_combo_items WHERE id = ?",
      [comboItemId],
    );
    if (items.length === 0) {
      return res.status(404).json({ success: false, error: "Componente no encontrado" });
    }

    await promisePool.query("DELETE FROM producto_combo_items WHERE id = ?", [comboItemId]);

    res.json({ success: true, message: "Componente eliminado exitosamente" });
  } catch (error) {
    console.error("Error eliminando item de combo:", error);
    res.status(500).json({
      success: false,
      error: "Error al eliminar el componente",
      message: error.message,
    });
  }
};

module.exports = {
  listComboItems,
  createComboItem,
  updateComboItem,
  deleteComboItem,
  CAMPOS_EDITABLES_COMBO_ITEM,
};
