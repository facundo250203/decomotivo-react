const { promisePool } = require("../config/database");

// Campos editables vía updateCliente. `activo` queda afuera a propósito:
// se maneja solo por el soft delete (deleteCliente), nunca por este update.
const CAMPOS_EDITABLES_CLIENTE = [
  "nombre",
  "apellido",
  "telefono",
  "email",
  "direccion",
  "notas",
];

// nombre_completo se arma acá una sola vez, en vez de repetir la
// concatenación en cada pantalla que muestra un cliente.
const conNombreCompleto = (cliente) => ({
  ...cliente,
  nombre_completo: `${cliente.nombre} ${cliente.apellido || ""}`.trim(),
});

// ============================================
// LISTAR CLIENTES
// ============================================
const getAllClientes = async (req, res) => {
  try {
    const [rows] = await promisePool.query(
      "SELECT * FROM clientes WHERE activo = true ORDER BY nombre ASC, apellido ASC",
    );

    res.json({
      success: true,
      count: rows.length,
      data: rows.map(conNombreCompleto),
    });
  } catch (error) {
    console.error("Error obteniendo clientes:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener los clientes",
      message: error.message,
    });
  }
};

// ============================================
// OBTENER CLIENTE POR ID
// ============================================
const getClienteById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await promisePool.query(
      "SELECT * FROM clientes WHERE id = ?",
      [id],
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Cliente no encontrado" });
    }

    res.json({ success: true, data: conNombreCompleto(rows[0]) });
  } catch (error) {
    console.error("Error obteniendo cliente:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener el cliente",
      message: error.message,
    });
  }
};

// ============================================
// CREAR CLIENTE
// Chequea duplicados exactos (mismo nombre + apellido, sin importar
// mayúsculas/espacios) antes de crear -- justamente lo que separar los
// campos permite hacer de forma confiable.
// ============================================
const createCliente = async (req, res) => {
  try {
    const { nombre, apellido, telefono, email, direccion, notas } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({
        success: false,
        error: "El nombre del cliente es requerido",
      });
    }
    if (!apellido || !apellido.trim()) {
      return res.status(400).json({
        success: false,
        error: "El apellido del cliente es requerido",
      });
    }

    const [existentes] = await promisePool.query(
      `SELECT id, creado_en FROM clientes
       WHERE activo = true AND LOWER(TRIM(nombre)) = LOWER(TRIM(?))
         AND LOWER(TRIM(apellido)) = LOWER(TRIM(?))`,
      [nombre, apellido],
    );
    if (existentes.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Ya existe un cliente llamado "${nombre.trim()} ${apellido.trim()}". Si es una persona distinta, agregá algo que lo diferencie (ej. el apellido completo).`,
      });
    }

    const [result] = await promisePool.query(
      `INSERT INTO clientes (nombre, apellido, telefono, email, direccion, notas)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nombre.trim(),
        apellido.trim(),
        telefono || null,
        email || null,
        direccion || null,
        notas || null,
      ],
    );

    const [clientes] = await promisePool.query(
      "SELECT * FROM clientes WHERE id = ?",
      [result.insertId],
    );

    res.status(201).json({
      success: true,
      message: "Cliente creado exitosamente",
      data: conNombreCompleto(clientes[0]),
    });
  } catch (error) {
    console.error("Error creando cliente:", error);
    res.status(500).json({
      success: false,
      error: "Error al crear el cliente",
      message: error.message,
    });
  }
};

// ============================================
// ACTUALIZAR CLIENTE
// ============================================
const updateCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const [clientes] = await promisePool.query(
      "SELECT id FROM clientes WHERE id = ?",
      [id],
    );

    if (clientes.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Cliente no encontrado" });
    }

    // req.body ya viene filtrado por el middleware sanitizeBody (ver
    // routes/clientes.js) a solo los campos de CAMPOS_EDITABLES_CLIENTE.
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
      `UPDATE clientes SET ${setClause} WHERE id = ?`,
      values,
    );

    const [updated] = await promisePool.query(
      "SELECT * FROM clientes WHERE id = ?",
      [id],
    );

    res.json({
      success: true,
      message: "Cliente actualizado exitosamente",
      data: conNombreCompleto(updated[0]),
    });
  } catch (error) {
    console.error("Error actualizando cliente:", error);
    res.status(500).json({
      success: false,
      error: "Error al actualizar el cliente",
      message: error.message,
    });
  }
};

// ============================================
// ELIMINAR CLIENTE (SOFT DELETE)
// ============================================
const deleteCliente = async (req, res) => {
  try {
    const { id } = req.params;

    const [clientes] = await promisePool.query(
      "SELECT id FROM clientes WHERE id = ?",
      [id],
    );

    if (clientes.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Cliente no encontrado" });
    }

    await promisePool.query("UPDATE clientes SET activo = false WHERE id = ?", [
      id,
    ]);

    res.json({ success: true, message: "Cliente eliminado exitosamente" });
  } catch (error) {
    console.error("Error eliminando cliente:", error);
    res.status(500).json({
      success: false,
      error: "Error al eliminar el cliente",
      message: error.message,
    });
  }
};

module.exports = {
  getAllClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente,
  CAMPOS_EDITABLES_CLIENTE,
};
