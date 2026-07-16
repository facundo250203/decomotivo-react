const { promisePool } = require("../config/database");
const { notificarN8N } = require("../utils/n8nWebhook");

// Suma ventas/compras(a proveedor)/gastos por efectivo y transferencia en un
// rango de fechas. Reutilizado por getSaldoCaja y crearCierre (ambos
// necesitan el mismo cálculo, ya sea para un período elegido o para "hoy").
const calcularMovimientosRango = async (desde, hasta) => {
  let ventasQuery = `SELECT
    COALESCE(SUM(monto_efectivo), 0) as efectivo,
    COALESCE(SUM(monto_transferencia), 0) as transferencia
    FROM ventas WHERE 1=1`;
  let comprasQuery = `SELECT
    COALESCE(SUM(monto_efectivo), 0) as efectivo,
    COALESCE(SUM(monto_transferencia), 0) as transferencia
    FROM compras WHERE proveedor_id IS NOT NULL`;
  let gastosQuery = `SELECT
    COALESCE(SUM(monto_efectivo), 0) as efectivo,
    COALESCE(SUM(monto_transferencia), 0) as transferencia
    FROM gastos WHERE 1=1`;

  const ventasParams = [];
  const comprasParams = [];
  const gastosParams = [];

  // DATE(fecha): un "hasta" de solo fecha (ej. 2026-07-03) MySQL lo
  // interpreta como medianoche si se compara contra la columna DATETIME
  // completa, excluyendo movimientos cargados más tarde ese mismo día.
  if (desde) {
    ventasQuery += ` AND DATE(fecha) >= ?`;
    comprasQuery += ` AND DATE(fecha) >= ?`;
    gastosQuery += ` AND DATE(fecha) >= ?`;
    ventasParams.push(desde);
    comprasParams.push(desde);
    gastosParams.push(desde);
  }

  if (hasta) {
    ventasQuery += ` AND DATE(fecha) <= ?`;
    comprasQuery += ` AND DATE(fecha) <= ?`;
    gastosQuery += ` AND DATE(fecha) <= ?`;
    ventasParams.push(hasta);
    comprasParams.push(hasta);
    gastosParams.push(hasta);
  }

  const [ventasRows] = await promisePool.query(ventasQuery, ventasParams);
  const [comprasRows] = await promisePool.query(comprasQuery, comprasParams);
  const [gastosRows] = await promisePool.query(gastosQuery, gastosParams);

  const ventasEfectivo = parseFloat(ventasRows[0].efectivo);
  const ventasTransferencia = parseFloat(ventasRows[0].transferencia);
  const comprasEfectivo = parseFloat(comprasRows[0].efectivo);
  const comprasTransferencia = parseFloat(comprasRows[0].transferencia);
  const gastosEfectivo = parseFloat(gastosRows[0].efectivo);
  const gastosTransferencia = parseFloat(gastosRows[0].transferencia);

  return {
    efectivo: {
      ventas: ventasEfectivo,
      compras: comprasEfectivo,
      gastos: gastosEfectivo,
      saldo: ventasEfectivo - comprasEfectivo - gastosEfectivo,
    },
    transferencia: {
      ventas: ventasTransferencia,
      compras: comprasTransferencia,
      gastos: gastosTransferencia,
      saldo: ventasTransferencia - comprasTransferencia - gastosTransferencia,
    },
    saldo_total:
      ventasEfectivo +
      ventasTransferencia -
      (comprasEfectivo + comprasTransferencia) -
      (gastosEfectivo + gastosTransferencia),
  };
};

// Fecha de hoy en YYYY-MM-DD, para no depender de que el cliente mande la
// fecha correcta (evita cierres con la fecha "equivocada" por desfasaje de
// huso horario del navegador).
const hoyISO = () => new Date().toISOString().slice(0, 10);

// ============================================
// SALDO NETO DE CAJA (ventas - compras reales - gastos), por efectivo y
// transferencia, para el rango de fechas elegido.
// ============================================
const getSaldoCaja = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const data = await calcularMovimientosRango(desde, hasta);
    res.json({ success: true, data });
  } catch (error) {
    console.error("Error obteniendo saldo de caja:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener el saldo de caja",
      message: error.message,
    });
  }
};

// ============================================
// LISTAR CIERRES DE CAJA (historial de arqueos)
// ============================================
const getCierresCaja = async (req, res) => {
  try {
    const [rows] = await promisePool.query(
      `SELECT id, fecha, efectivo_esperado, efectivo_contado, diferencia_efectivo,
        transferencia_esperado, acumulado_efectivo, acumulado_transferencia, notas
       FROM cierres_caja ORDER BY fecha DESC`,
    );

    res.json({
      success: true,
      count: rows.length,
      data: rows.map((row) => ({
        ...row,
        efectivo_esperado: parseFloat(row.efectivo_esperado),
        efectivo_contado: parseFloat(row.efectivo_contado),
        diferencia_efectivo: parseFloat(row.diferencia_efectivo),
        transferencia_esperado: parseFloat(row.transferencia_esperado),
        acumulado_efectivo: parseFloat(row.acumulado_efectivo),
        acumulado_transferencia: parseFloat(row.acumulado_transferencia),
      })),
    });
  } catch (error) {
    console.error("Error obteniendo cierres de caja:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener los cierres de caja",
      message: error.message,
    });
  }
};

// ============================================
// ÚLTIMO CIERRE (para mostrar el acumulado real sin elegir fechas)
// ============================================
const getUltimoCierre = async (req, res) => {
  try {
    const [rows] = await promisePool.query(
      `SELECT id, fecha, efectivo_esperado, efectivo_contado, diferencia_efectivo,
        transferencia_esperado, acumulado_efectivo, acumulado_transferencia, notas
       FROM cierres_caja ORDER BY fecha DESC LIMIT 1`,
    );

    if (rows.length === 0) {
      return res.json({ success: true, data: null });
    }

    const row = rows[0];
    res.json({
      success: true,
      data: {
        ...row,
        efectivo_esperado: parseFloat(row.efectivo_esperado),
        efectivo_contado: parseFloat(row.efectivo_contado),
        diferencia_efectivo: parseFloat(row.diferencia_efectivo),
        transferencia_esperado: parseFloat(row.transferencia_esperado),
        acumulado_efectivo: parseFloat(row.acumulado_efectivo),
        acumulado_transferencia: parseFloat(row.acumulado_transferencia),
      },
    });
  } catch (error) {
    console.error("Error obteniendo el último cierre de caja:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener el último cierre de caja",
      message: error.message,
    });
  }
};

// ============================================
// CERRAR CAJA DEL DÍA (arqueo)
// El "esperado" lo calcula el propio backend a partir de lo cargado hoy en
// ventas/compras/gastos -- no se confía en un valor mandado por el cliente,
// solo en el efectivo_contado (lo que el dueño contó de verdad).
// ============================================
const crearCierre = async (req, res) => {
  try {
    const { efectivo_contado, notas } = req.body;

    if (efectivo_contado === undefined || efectivo_contado === null) {
      return res.status(400).json({
        success: false,
        error: "Debe indicar el efectivo contado",
      });
    }

    const efectivoContadoNum = parseFloat(efectivo_contado);
    if (Number.isNaN(efectivoContadoNum) || efectivoContadoNum < 0) {
      return res.status(400).json({
        success: false,
        error: "El efectivo contado debe ser un número válido y no negativo",
      });
    }

    const fecha = hoyISO();

    const [existente] = await promisePool.query(
      "SELECT id FROM cierres_caja WHERE fecha = ?",
      [fecha],
    );
    if (existente.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Ya se cerró la caja del día ${fecha}`,
      });
    }

    const movimientosHoy = await calcularMovimientosRango(fecha, fecha);
    const efectivoEsperado = movimientosHoy.efectivo.saldo;
    const transferenciaEsperado = movimientosHoy.transferencia.saldo;

    const [ultimoCierre] = await promisePool.query(
      "SELECT acumulado_efectivo, acumulado_transferencia FROM cierres_caja ORDER BY fecha DESC LIMIT 1",
    );
    const acumuladoEfectivoPrevio =
      ultimoCierre.length > 0 ? parseFloat(ultimoCierre[0].acumulado_efectivo) : 0;
    const acumuladoTransferenciaPrevio =
      ultimoCierre.length > 0
        ? parseFloat(ultimoCierre[0].acumulado_transferencia)
        : 0;

    // El acumulado de efectivo arrastra lo CONTADO (la plata real), no lo
    // esperado -- si hay diferencia, el acumulado tiene que reflejar la
    // realidad del cajón, no lo que el sistema calculó en teoría.
    const acumuladoEfectivo = acumuladoEfectivoPrevio + efectivoContadoNum;
    const acumuladoTransferencia =
      acumuladoTransferenciaPrevio + transferenciaEsperado;

    const [result] = await promisePool.query(
      `INSERT INTO cierres_caja
        (fecha, efectivo_esperado, efectivo_contado, transferencia_esperado, acumulado_efectivo, acumulado_transferencia, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        fecha,
        efectivoEsperado,
        efectivoContadoNum,
        transferenciaEsperado,
        acumuladoEfectivo,
        acumuladoTransferencia,
        notas || null,
      ],
    );

    const [creado] = await promisePool.query(
      `SELECT id, fecha, efectivo_esperado, efectivo_contado, diferencia_efectivo,
        transferencia_esperado, acumulado_efectivo, acumulado_transferencia, notas
       FROM cierres_caja WHERE id = ?`,
      [result.insertId],
    );

    const row = creado[0];

    notificarN8N("cierre_caja", {
      fecha: row.fecha,
      efectivo_esperado: parseFloat(row.efectivo_esperado),
      efectivo_contado: parseFloat(row.efectivo_contado),
      diferencia_efectivo: parseFloat(row.diferencia_efectivo),
      transferencia_esperado: parseFloat(row.transferencia_esperado),
      acumulado_efectivo: parseFloat(row.acumulado_efectivo),
      acumulado_transferencia: parseFloat(row.acumulado_transferencia),
      acumulado_total:
        parseFloat(row.acumulado_efectivo) +
        parseFloat(row.acumulado_transferencia),
    });

    res.status(201).json({
      success: true,
      message: "Caja cerrada exitosamente",
      data: {
        ...row,
        efectivo_esperado: parseFloat(row.efectivo_esperado),
        efectivo_contado: parseFloat(row.efectivo_contado),
        diferencia_efectivo: parseFloat(row.diferencia_efectivo),
        transferencia_esperado: parseFloat(row.transferencia_esperado),
        acumulado_efectivo: parseFloat(row.acumulado_efectivo),
        acumulado_transferencia: parseFloat(row.acumulado_transferencia),
      },
    });
  } catch (error) {
    console.error("Error cerrando caja:", error);
    res.status(500).json({
      success: false,
      error: "Error al cerrar la caja",
      message: error.message,
    });
  }
};

module.exports = {
  getSaldoCaja,
  getCierresCaja,
  getUltimoCierre,
  crearCierre,
};
