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
// fecha correcta. NO usar toISOString() (da la fecha en UTC -- desde las
// 21:00 hora Argentina ya cruzó la medianoche UTC y devuelve "mañana") NI
// los getters locales de Date (getFullYear/getMonth/getDate dependen del
// huso horario del PROCESO de Node, no de MySQL -- database.js ya fija la
// sesión de la base en -03:00 explícitamente, pero eso no dice nada de en
// qué TZ arranca el proceso de Node en el hosting; Hostinger probablemente
// lo corra en UTC por default). Intl.DateTimeFormat con timeZone explícito
// evalúa el instante actual en America/Argentina/Buenos_Aires sin importar
// la configuración del proceso -- mismo principio que el SET time_zone del
// pool, aplicado del lado de Node.
const hoyISO = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date());

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
        transferencia_esperado, transferencia_contado, diferencia_transferencia,
        acumulado_efectivo, acumulado_transferencia, notas
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
        transferencia_contado: parseFloat(row.transferencia_contado),
        diferencia_transferencia: parseFloat(row.diferencia_transferencia),
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
        transferencia_esperado, transferencia_contado, diferencia_transferencia,
        acumulado_efectivo, acumulado_transferencia, notas
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
        transferencia_contado: parseFloat(row.transferencia_contado),
        diferencia_transferencia: parseFloat(row.diferencia_transferencia),
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
// solo en efectivo_contado/transferencia_contado (lo que el dueño contó/
// verificó de verdad).
//
// efectivo_contado y transferencia_contado son el TOTAL que hay ahora
// (arrastra todo lo acumulado antes + el movimiento de hoy), no solo "lo de
// hoy" -- así es como el dueño cuenta la plata en la práctica, y evita que
// tenga que hacer la resta mental cada vez. Por eso la diferencia se calcula
// contra el acumulado previo (ver más abajo), no contra 0.
// ============================================
const crearCierre = async (req, res) => {
  try {
    const { efectivo_contado, transferencia_contado, notas } = req.body;

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

    if (transferencia_contado === undefined || transferencia_contado === null) {
      return res.status(400).json({
        success: false,
        error: "Debe indicar la transferencia contada",
      });
    }

    const transferenciaContadoNum = parseFloat(transferencia_contado);
    if (Number.isNaN(transferenciaContadoNum) || transferenciaContadoNum < 0) {
      return res.status(400).json({
        success: false,
        error: "La transferencia contada debe ser un número válido y no negativo",
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

    // Diferencia = (lo contado ahora - lo que ya estaba acumulado antes) -
    // lo esperado según el movimiento de hoy. Restar el acumulado previo es
    // lo que "descuenta" del total contado la parte que ya era plata vieja,
    // dejando solo el movimiento de hoy para comparar contra efectivo/
    // transferenciaEsperado. No puede vivir como columna GENERATED porque
    // necesita el acumulado de la fila ANTERIOR (ver migración 030).
    const diferenciaEfectivo =
      efectivoContadoNum - acumuladoEfectivoPrevio - efectivoEsperado;
    const diferenciaTransferencia =
      transferenciaContadoNum - acumuladoTransferenciaPrevio - transferenciaEsperado;

    // El acumulado ahora es directamente lo contado/verificado -- ya no se
    // le suma el previo, porque el valor que manda el dueño YA ES el total
    // (a diferencia del modelo viejo, donde efectivo_contado era solo el
    // movimiento del día y había que arrastrar el acumulado a mano).
    const acumuladoEfectivo = efectivoContadoNum;
    const acumuladoTransferencia = transferenciaContadoNum;

    const [result] = await promisePool.query(
      `INSERT INTO cierres_caja
        (fecha, efectivo_esperado, efectivo_contado, diferencia_efectivo,
         transferencia_esperado, transferencia_contado, diferencia_transferencia,
         acumulado_efectivo, acumulado_transferencia, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fecha,
        efectivoEsperado,
        efectivoContadoNum,
        diferenciaEfectivo,
        transferenciaEsperado,
        transferenciaContadoNum,
        diferenciaTransferencia,
        acumuladoEfectivo,
        acumuladoTransferencia,
        notas || null,
      ],
    );

    const [creado] = await promisePool.query(
      `SELECT id, fecha, efectivo_esperado, efectivo_contado, diferencia_efectivo,
        transferencia_esperado, transferencia_contado, diferencia_transferencia,
        acumulado_efectivo, acumulado_transferencia, notas
       FROM cierres_caja WHERE id = ?`,
      [result.insertId],
    );

    const row = creado[0];

    // efectivo_esperado/transferencia_esperado (crudo) son el MOVIMIENTO NETO
    // de hoy, no el total esperado en caja -- pueden dar negativos (ver
    // comentario en crearCierre). Se mandan igual por compatibilidad, pero
    // *_esperado_total es el valor que de verdad conviene mostrar en el
    // mail: mismo cálculo que ya usa CajaDashboard.jsx para su columna
    // "Esperado" (contado - diferencia), sin el movimiento neto crudo.
    notificarN8N("cierre_caja", {
      fecha: row.fecha,
      efectivo_esperado: parseFloat(row.efectivo_esperado),
      efectivo_esperado_total:
        parseFloat(row.efectivo_contado) - parseFloat(row.diferencia_efectivo),
      efectivo_contado: parseFloat(row.efectivo_contado),
      diferencia_efectivo: parseFloat(row.diferencia_efectivo),
      transferencia_esperado: parseFloat(row.transferencia_esperado),
      transferencia_esperado_total:
        parseFloat(row.transferencia_contado) -
        parseFloat(row.diferencia_transferencia),
      transferencia_contado: parseFloat(row.transferencia_contado),
      diferencia_transferencia: parseFloat(row.diferencia_transferencia),
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
        transferencia_contado: parseFloat(row.transferencia_contado),
        diferencia_transferencia: parseFloat(row.diferencia_transferencia),
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

// ============================================
// EDITAR EL ÚLTIMO CIERRE DE CAJA (el más reciente, y solo ese)
// El acumulado de cada cierre se construye sobre el acumulado del cierre
// ANTERIOR (ver crearCierre) -- si se pudiera editar un cierre viejo, todos
// los posteriores quedarían con un acumulado mal, calculado sobre el valor
// que ahora cambió, y habría que recalcularlos en cadena. Restringir la
// edición al último cierre evita ese problema por completo: no hay ningún
// cierre después que dependa de él. Un error en un cierre más viejo que el
// último sigue sin poder corregirse desde acá a propósito.
// ============================================
const updateUltimoCierre = async (req, res) => {
  const connection = await promisePool.getConnection();

  try {
    const { efectivo_contado, transferencia_contado, notas } = req.body;

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

    if (transferencia_contado === undefined || transferencia_contado === null) {
      return res.status(400).json({
        success: false,
        error: "Debe indicar la transferencia contada",
      });
    }
    const transferenciaContadoNum = parseFloat(transferencia_contado);
    if (Number.isNaN(transferenciaContadoNum) || transferenciaContadoNum < 0) {
      return res.status(400).json({
        success: false,
        error: "La transferencia contada debe ser un número válido y no negativo",
      });
    }

    await connection.beginTransaction();

    // FOR UPDATE bloquea la fila hasta el commit -- si justo se está
    // cerrando la caja de un día nuevo al mismo tiempo, una de las dos
    // transacciones espera a la otra en vez de leer un "último cierre"
    // que deja de serlo a mitad de camino.
    const { id } = req.params;
    const [cierres] = await connection.query(
      `SELECT id, DATE_FORMAT(fecha, '%Y-%m-%d') as fecha_iso
       FROM cierres_caja ORDER BY fecha DESC LIMIT 1 FOR UPDATE`,
    );

    if (cierres.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        error: "No hay ningún cierre de caja para editar",
      });
    }

    if (parseInt(id) !== cierres[0].id) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error:
          "Solo se puede editar el cierre de caja más reciente -- uno más viejo ya tiene cierres posteriores construidos sobre su acumulado",
      });
    }

    const cierre = cierres[0];

    // Mismo cálculo que crearCierre, re-derivado desde cero con los valores
    // corregidos -- incluido el "esperado", por si algo en ventas/compras/
    // gastos de ese día cambió después del cierre original.
    const movimientos = await calcularMovimientosRango(
      cierre.fecha_iso,
      cierre.fecha_iso,
    );
    const efectivoEsperado = movimientos.efectivo.saldo;
    const transferenciaEsperado = movimientos.transferencia.saldo;

    const [previos] = await connection.query(
      `SELECT acumulado_efectivo, acumulado_transferencia
       FROM cierres_caja
       WHERE fecha < (SELECT MAX(fecha) FROM cierres_caja)
       ORDER BY fecha DESC LIMIT 1`,
    );
    const acumuladoEfectivoPrevio =
      previos.length > 0 ? parseFloat(previos[0].acumulado_efectivo) : 0;
    const acumuladoTransferenciaPrevio =
      previos.length > 0 ? parseFloat(previos[0].acumulado_transferencia) : 0;

    const diferenciaEfectivo =
      efectivoContadoNum - acumuladoEfectivoPrevio - efectivoEsperado;
    const diferenciaTransferencia =
      transferenciaContadoNum - acumuladoTransferenciaPrevio - transferenciaEsperado;
    const acumuladoEfectivo = efectivoContadoNum;
    const acumuladoTransferencia = transferenciaContadoNum;

    await connection.query(
      `UPDATE cierres_caja SET
        efectivo_esperado = ?, efectivo_contado = ?, diferencia_efectivo = ?,
        transferencia_esperado = ?, transferencia_contado = ?, diferencia_transferencia = ?,
        acumulado_efectivo = ?, acumulado_transferencia = ?, notas = ?
       WHERE id = ?`,
      [
        efectivoEsperado,
        efectivoContadoNum,
        diferenciaEfectivo,
        transferenciaEsperado,
        transferenciaContadoNum,
        diferenciaTransferencia,
        acumuladoEfectivo,
        acumuladoTransferencia,
        notas || null,
        cierre.id,
      ],
    );

    await connection.commit();

    res.json({
      success: true,
      message: "Cierre de caja actualizado correctamente",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error editando el cierre de caja:", error);
    res.status(500).json({
      success: false,
      error: "Error al editar el cierre de caja",
      message: error.message,
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  getSaldoCaja,
  getCierresCaja,
  getUltimoCierre,
  crearCierre,
  updateUltimoCierre,
};
