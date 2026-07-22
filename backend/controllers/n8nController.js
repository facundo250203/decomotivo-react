const { promisePool } = require("../config/database");
const {
  getTopProductos,
  getStockBajo,
  getPedidosPagoPendiente: fetchPedidosPagoPendiente,
  getPedidosEstancados: fetchPedidosEstancados,
  getClientesConDeuda: fetchClientesConDeuda,
} = require("./reportesController");

// Intl.DateTimeFormat con timeZone explícito, no toISOString() -- da la
// fecha en UTC, y desde las 21:00 hora Argentina ya cruzó la medianoche UTC
// y devuelve "mañana" (mismo bug ya corregido en cajaController.js/
// Dashboard.jsx). Independiente de en qué TZ corra el proceso de Node.
const hoyISO = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date());
const haceDias = (dias) => {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(d);
};

// ============================================
// RESUMEN SEMANAL (facturación, top productos, último cierre de caja)
// GET /api/n8n/resumen-semanal?dias=7
// ============================================
const getResumenSemanal = async (req, res) => {
  try {
    const dias = parseInt(req.query.dias) || 7;
    const desde = haceDias(dias);
    const hasta = hoyISO();

    const [ventasRows] = await promisePool.query(
      `SELECT COALESCE(SUM(monto_efectivo), 0) as efectivo,
        COALESCE(SUM(monto_transferencia), 0) as transferencia,
        COALESCE(SUM(monto_total), 0) as total
       FROM ventas WHERE DATE(fecha) BETWEEN ? AND ?`,
      [desde, hasta],
    );

    const topProductos = await getTopProductos(desde, hasta);

    // stock_bajo/clientes_con_deuda son estado ACTUAL (no del rango
    // desde/hasta) -- mismo criterio que ya usa getResumen del dashboard.
    // Sin esto, el resumen semanal solo tenía números de venta, nada que un
    // resumen narrado por IA pudiera destacar como alerta accionable.
    const [stockBajo, clientesConDeuda] = await Promise.all([
      getStockBajo(),
      fetchClientesConDeuda(),
    ]);

    const [ultimoCierre] = await promisePool.query(
      `SELECT fecha, acumulado_efectivo, acumulado_transferencia
       FROM cierres_caja ORDER BY fecha DESC LIMIT 1`,
    );

    res.json({
      success: true,
      data: {
        rango: { desde, hasta },
        facturacion: {
          efectivo: parseFloat(ventasRows[0].efectivo),
          transferencia: parseFloat(ventasRows[0].transferencia),
          total: parseFloat(ventasRows[0].total),
        },
        top_productos: topProductos.slice(0, 5),
        stock_bajo: stockBajo,
        clientes_con_deuda: clientesConDeuda,
        ultimo_cierre_caja:
          ultimoCierre.length > 0
            ? {
                fecha: ultimoCierre[0].fecha,
                acumulado_total:
                  parseFloat(ultimoCierre[0].acumulado_efectivo) +
                  parseFloat(ultimoCierre[0].acumulado_transferencia),
              }
            : null,
      },
    });
  } catch (error) {
    console.error("Error generando el resumen semanal:", error);
    res.status(500).json({
      success: false,
      error: "Error al generar el resumen semanal",
      message: error.message,
    });
  }
};

// ============================================
// PEDIDOS SEÑADOS CON PAGO FINAL PENDIENTE
// (estado='senado' y lo cobrado en ventas todavía no cubre el total)
// GET /api/n8n/pedidos-pago-pendiente
// ============================================
const getPedidosPagoPendiente = async (req, res) => {
  try {
    const data = await fetchPedidosPagoPendiente();

    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Error obteniendo pedidos con pago pendiente:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener pedidos con pago pendiente",
      message: error.message,
    });
  }
};

// ============================================
// PEDIDOS ESTANCADOS (solicitados hace más de N días sin pasar a señado)
// GET /api/n8n/pedidos-estancados?dias=3
// ============================================
const getPedidosEstancados = async (req, res) => {
  try {
    const dias = parseInt(req.query.dias) || 3;
    const data = await fetchPedidosEstancados(dias);

    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Error obteniendo pedidos estancados:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener pedidos estancados",
      message: error.message,
    });
  }
};

// ============================================
// CLIENTES CON DEUDA PENDIENTE (cuenta corriente > 0, venga de un pedido
// señado o de una venta directa fiada -- ver el comentario de
// getClientesConDeuda en reportesController.js)
// GET /api/n8n/clientes-deuda-pendiente
// ============================================
const getClientesConDeuda = async (req, res) => {
  try {
    const data = await fetchClientesConDeuda();

    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Error obteniendo clientes con deuda pendiente:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener clientes con deuda pendiente",
      message: error.message,
    });
  }
};

module.exports = {
  getResumenSemanal,
  getPedidosPagoPendiente,
  getPedidosEstancados,
  getClientesConDeuda,
};
