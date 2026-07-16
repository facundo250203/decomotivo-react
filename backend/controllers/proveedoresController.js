const { promisePool } = require("../config/database");

// Campos editables vía updateProveedor. `activo` queda afuera a propósito:
// se maneja solo por el soft delete (deleteProveedor), nunca por este update.
const CAMPOS_EDITABLES_PROVEEDOR = [
  "nombre",
  "telefono",
  "email",
  "instagram",
  "facebook",
  "direccion",
  "notas",
];

// ============================================
// LISTAR PROVEEDORES
// ============================================
const getAllProveedores = async (req, res) => {
  try {
    const [rows] = await promisePool.query(
      "SELECT * FROM proveedores WHERE activo = true ORDER BY nombre ASC",
    );

    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error("Error obteniendo proveedores:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener los proveedores",
      message: error.message,
    });
  }
};

// ============================================
// OBTENER PROVEEDOR POR ID
// ============================================
const getProveedorById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await promisePool.query(
      "SELECT * FROM proveedores WHERE id = ?",
      [id],
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Proveedor no encontrado" });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Error obteniendo proveedor:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener el proveedor",
      message: error.message,
    });
  }
};

// ============================================
// CREAR PROVEEDOR
// ============================================
const createProveedor = async (req, res) => {
  try {
    const { nombre, telefono, email, instagram, facebook, direccion, notas } =
      req.body;

    if (!nombre) {
      return res.status(400).json({
        success: false,
        error: "El nombre del proveedor es requerido",
      });
    }

    const [result] = await promisePool.query(
      `INSERT INTO proveedores (nombre, telefono, email, instagram, facebook, direccion, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre,
        telefono || null,
        email || null,
        instagram || null,
        facebook || null,
        direccion || null,
        notas || null,
      ],
    );

    const [proveedores] = await promisePool.query(
      "SELECT * FROM proveedores WHERE id = ?",
      [result.insertId],
    );

    res.status(201).json({
      success: true,
      message: "Proveedor creado exitosamente",
      data: proveedores[0],
    });
  } catch (error) {
    console.error("Error creando proveedor:", error);
    res.status(500).json({
      success: false,
      error: "Error al crear el proveedor",
      message: error.message,
    });
  }
};

// ============================================
// ACTUALIZAR PROVEEDOR
// ============================================
const updateProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const [proveedores] = await promisePool.query(
      "SELECT id FROM proveedores WHERE id = ?",
      [id],
    );

    if (proveedores.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Proveedor no encontrado" });
    }

    // req.body ya viene filtrado por el middleware sanitizeBody (ver
    // routes/proveedores.js) a solo los campos de CAMPOS_EDITABLES_PROVEEDOR.
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
      `UPDATE proveedores SET ${setClause} WHERE id = ?`,
      values,
    );

    const [updated] = await promisePool.query(
      "SELECT * FROM proveedores WHERE id = ?",
      [id],
    );

    res.json({
      success: true,
      message: "Proveedor actualizado exitosamente",
      data: updated[0],
    });
  } catch (error) {
    console.error("Error actualizando proveedor:", error);
    res.status(500).json({
      success: false,
      error: "Error al actualizar el proveedor",
      message: error.message,
    });
  }
};

// ============================================
// ELIMINAR PROVEEDOR (SOFT DELETE)
// ============================================
const deleteProveedor = async (req, res) => {
  try {
    const { id } = req.params;

    const [proveedores] = await promisePool.query(
      "SELECT id FROM proveedores WHERE id = ?",
      [id],
    );

    if (proveedores.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Proveedor no encontrado" });
    }

    await promisePool.query(
      "UPDATE proveedores SET activo = false WHERE id = ?",
      [id],
    );

    res.json({ success: true, message: "Proveedor eliminado exitosamente" });
  } catch (error) {
    console.error("Error eliminando proveedor:", error);
    res.status(500).json({
      success: false,
      error: "Error al eliminar el proveedor",
      message: error.message,
    });
  }
};

module.exports = {
  getAllProveedores,
  getProveedorById,
  createProveedor,
  updateProveedor,
  deleteProveedor,
  CAMPOS_EDITABLES_PROVEEDOR,
};
