const { promisePool } = require("../config/database");
const { applyDateRangeFilter } = require("../utils/dateRangeFilter");
const { parseMontoValidado } = require("../utils/montoValidation");

// Valida concepto + montos de un gasto (usado en create y update). Devuelve
// { error } si algo es inválido, o { efectivo, transferencia, concepto } si
// está todo bien.
const validarDatosGasto = ({ concepto, monto_efectivo, monto_transferencia }) => {
  if (!concepto || !concepto.trim()) {
    return { error: "El concepto es obligatorio" };
  }

  const efectivo = parseMontoValidado(monto_efectivo);
  const transferencia = parseMontoValidado(monto_transferencia);

  if (efectivo === null || transferencia === null) {
    return { error: "Los montos deben ser números válidos y no negativos" };
  }

  if (efectivo + transferencia <= 0) {
    return { error: "Debe indicarse un monto en efectivo y/o transferencia" };
  }

  return { concepto: concepto.trim(), efectivo, transferencia };
};

// ============================================
// LISTAR GASTOS (salidas de dinero, filtrable por rango de fechas)
// ============================================
const getGastos = async (req, res) => {
  try {
    const { desde, hasta } = req.query;

    let query = `
      SELECT id, concepto, fecha, monto_efectivo, monto_transferencia, monto_total, notas
      FROM gastos
      WHERE 1=1
    `;
    const params = [];

    query = applyDateRangeFilter(query, params, { desde, hasta });
    query += ` ORDER BY fecha DESC`;

    const [rows] = await promisePool.query(query, params);

    res.json({
      success: true,
      count: rows.length,
      data: rows.map((row) => ({
        ...row,
        monto_efectivo: parseFloat(row.monto_efectivo),
        monto_transferencia: parseFloat(row.monto_transferencia),
        monto_total: parseFloat(row.monto_total),
      })),
    });
  } catch (error) {
    console.error("Error obteniendo gastos:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener los gastos",
      message: error.message,
    });
  }
};

// ============================================
// OBTENER GASTO POR ID
// ============================================
const getGastoById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await promisePool.query(
      "SELECT id, concepto, fecha, monto_efectivo, monto_transferencia, monto_total, notas FROM gastos WHERE id = ?",
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Gasto no encontrado" });
    }

    const gasto = rows[0];

    res.json({
      success: true,
      data: {
        ...gasto,
        monto_efectivo: parseFloat(gasto.monto_efectivo),
        monto_transferencia: parseFloat(gasto.monto_transferencia),
        monto_total: parseFloat(gasto.monto_total),
      },
    });
  } catch (error) {
    console.error("Error obteniendo gasto:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener el gasto",
      message: error.message,
    });
  }
};

// ============================================
// CREAR GASTO
// ============================================
const createGasto = async (req, res) => {
  try {
    const { notas } = req.body;

    const validado = validarDatosGasto(req.body);
    if (validado.error) {
      return res.status(400).json({ success: false, error: validado.error });
    }
    const { concepto, efectivo, transferencia } = validado;

    const [result] = await promisePool.query(
      `INSERT INTO gastos (concepto, monto_efectivo, monto_transferencia, notas)
       VALUES (?, ?, ?, ?)`,
      [concepto, efectivo, transferencia, notas || null],
    );

    res.status(201).json({
      success: true,
      message: "Gasto registrado exitosamente",
      data: { id: result.insertId },
    });
  } catch (error) {
    console.error("Error creando gasto:", error);
    res.status(500).json({
      success: false,
      error: "Error al crear el gasto",
      message: error.message,
    });
  }
};

// ============================================
// ACTUALIZAR GASTO (corregir un monto o concepto mal cargado)
// ============================================
const updateGasto = async (req, res) => {
  try {
    const { id } = req.params;
    const { notas } = req.body;

    const [gastos] = await promisePool.query(
      "SELECT id FROM gastos WHERE id = ?",
      [id],
    );

    if (gastos.length === 0) {
      return res.status(404).json({ success: false, error: "Gasto no encontrado" });
    }

    const validado = validarDatosGasto(req.body);
    if (validado.error) {
      return res.status(400).json({ success: false, error: validado.error });
    }
    const { concepto, efectivo, transferencia } = validado;

    await promisePool.query(
      `UPDATE gastos SET concepto = ?, monto_efectivo = ?, monto_transferencia = ?, notas = ? WHERE id = ?`,
      [concepto, efectivo, transferencia, notas || null, id],
    );

    res.json({
      success: true,
      message: "Gasto actualizado exitosamente",
    });
  } catch (error) {
    console.error("Error actualizando gasto:", error);
    res.status(500).json({
      success: false,
      error: "Error al actualizar el gasto",
      message: error.message,
    });
  }
};

// ============================================
// ELIMINAR GASTO (hard delete: no hay otra tabla que referencie gastos)
// ============================================
const deleteGasto = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await promisePool.query("DELETE FROM gastos WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "Gasto no encontrado" });
    }

    res.json({
      success: true,
      message: "Gasto eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error eliminando gasto:", error);
    res.status(500).json({
      success: false,
      error: "Error al eliminar el gasto",
      message: error.message,
    });
  }
};

module.exports = {
  getGastos,
  getGastoById,
  createGasto,
  updateGasto,
  deleteGasto,
};
