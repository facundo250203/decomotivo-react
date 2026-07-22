const { promisePool } = require("../config/database");
const { parseMontoValidado } = require("../utils/montoValidation");
const {
  calcularSaldoCliente,
  registrarMovimientoCuentaCorriente,
} = require("../utils/cuentaCorriente");

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
// No se puede desactivar un cliente con saldo distinto de cero: dejaría la
// cuenta corriente huérfana (deuda que nunca se cobra, o saldo a favor que
// nadie puede volver a aplicar). Debe saldarse antes.
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

    const saldo = await calcularSaldoCliente(promisePool, id);
    // Tolerancia de un centavo, misma que montoCoincide, para no bloquear
    // por residuos de redondeo de punto flotante.
    if (Math.abs(saldo) > 0.01) {
      return res.status(400).json({
        success: false,
        error:
          saldo > 0
            ? `No se puede eliminar: el cliente tiene un saldo pendiente de $${saldo.toFixed(2)}. Saldá la deuda antes de eliminarlo.`
            : `No se puede eliminar: el cliente tiene un saldo a favor de $${Math.abs(saldo).toFixed(2)}. Resolvé ese saldo antes de eliminarlo.`,
      });
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

// ============================================
// CUENTA CORRIENTE DEL CLIENTE (saldo + historial de movimientos)
// saldo > 0 = el cliente debe esa plata. saldo < 0 = tiene saldo a favor
// por ese valor absoluto (ver backend/utils/cuentaCorriente.js).
// ============================================
const getCuentaCorriente = async (req, res) => {
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

    const saldo = await calcularSaldoCliente(promisePool, id);

    // LEFT JOIN a ventas para poder mostrar de qué pedido viene la deuda (si
    // vino de señar/pagar un pedido) -- movimientos_cuenta_corriente no
    // guarda pedido_id directo, solo venta_id, así que sale del pedido_id de
    // esa venta.
    const [movimientos] = await promisePool.query(
      `SELECT m.id, m.tipo, m.monto, m.venta_id, m.fecha, m.notas, v.pedido_id
       FROM movimientos_cuenta_corriente m
       LEFT JOIN ventas v ON v.id = m.venta_id
       WHERE m.cliente_id = ?
       ORDER BY m.fecha DESC, m.id DESC`,
      [id],
    );

    res.json({
      success: true,
      data: {
        saldo,
        movimientos: movimientos.map((m) => ({
          ...m,
          monto: parseFloat(m.monto),
        })),
      },
    });
  } catch (error) {
    console.error("Error obteniendo cuenta corriente:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener la cuenta corriente del cliente",
      message: error.message,
    });
  }
};

// ============================================
// REGISTRAR PAGO DEL CLIENTE (reduce deuda, o suma a favor si paga de más)
// Se registra también como una venta (tipo 'pago_cuenta_corriente', sin
// ítems) para que la plata real entrada quede reflejada en caja -- mismo
// patrón que orderController.registerPayment usa para pagos de pedido.
// ============================================
const registrarPagoCuentaCorriente = async (req, res) => {
  const connection = await promisePool.getConnection();

  try {
    const { id } = req.params;
    const { monto_efectivo = 0, monto_transferencia = 0, notas } = req.body;

    const efectivoValidado = parseMontoValidado(monto_efectivo);
    const transferenciaValidada = parseMontoValidado(monto_transferencia);

    if (efectivoValidado === null || transferenciaValidada === null) {
      return res.status(400).json({
        success: false,
        error: "Los montos deben ser números válidos y no negativos",
      });
    }

    if (efectivoValidado <= 0 && transferenciaValidada <= 0) {
      return res.status(400).json({
        success: false,
        error: "Debe indicarse un monto en efectivo y/o transferencia",
      });
    }

    await connection.beginTransaction();

    const [clientes] = await connection.query(
      "SELECT id, activo FROM clientes WHERE id = ? FOR UPDATE",
      [id],
    );
    if (clientes.length === 0 || !clientes[0].activo) {
      await connection.rollback();
      return res
        .status(404)
        .json({ success: false, error: "El cliente no existe o está inactivo" });
    }

    const [ventaResult] = await connection.query(
      `INSERT INTO ventas (cliente_id, tipo, monto_efectivo, monto_transferencia, notas)
       VALUES (?, 'pago_cuenta_corriente', ?, ?, ?)`,
      [id, efectivoValidado, transferenciaValidada, notas || null],
    );

    await registrarMovimientoCuentaCorriente(connection, {
      clienteId: id,
      tipo: "pago_cliente",
      monto: efectivoValidado + transferenciaValidada,
      ventaId: ventaResult.insertId,
      notas: notas || null,
    });

    await connection.commit();

    const saldo = await calcularSaldoCliente(promisePool, id);

    res.status(201).json({
      success: true,
      message: "Pago registrado exitosamente",
      data: { id: ventaResult.insertId, saldo },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error registrando pago de cuenta corriente:", error);
    res.status(500).json({
      success: false,
      error: "Error al registrar el pago",
      message: error.message,
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  getAllClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente,
  getCuentaCorriente,
  registrarPagoCuentaCorriente,
  CAMPOS_EDITABLES_CLIENTE,
};
