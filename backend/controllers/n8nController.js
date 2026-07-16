const { promisePool } = require("../config/database");
const { getTopProductos } = require("./reportesController");

const hoyISO = () => new Date().toISOString().slice(0, 10);
const haceDias = (dias) => {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString().slice(0, 10);
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
    const [rows] = await promisePool.query(
      `SELECT p.id, p.cliente_nombre, p.cliente_telefono, p.total,
        COALESCE(SUM(v.monto_total), 0) as total_pagado,
        p.total - COALESCE(SUM(v.monto_total), 0) as saldo_pendiente,
        p.fecha_senado
       FROM pedidos p
       LEFT JOIN ventas v ON v.pedido_id = p.id
       WHERE p.estado = 'senado'
       GROUP BY p.id, p.cliente_nombre, p.cliente_telefono, p.total, p.fecha_senado
       HAVING saldo_pendiente > 0.01
       ORDER BY p.fecha_senado ASC`,
    );

    res.json({
      success: true,
      count: rows.length,
      data: rows.map((r) => ({
        id: r.id,
        cliente_nombre: r.cliente_nombre,
        cliente_telefono: r.cliente_telefono,
        total: parseFloat(r.total),
        total_pagado: parseFloat(r.total_pagado),
        saldo_pendiente: parseFloat(r.saldo_pendiente),
        fecha_senado: r.fecha_senado,
      })),
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

    const [rows] = await promisePool.query(
      `SELECT id, cliente_nombre, cliente_telefono, total, fecha_pedido,
        DATEDIFF(NOW(), fecha_pedido) as dias_esperando
       FROM pedidos
       WHERE estado = 'solicitado' AND fecha_pedido < DATE_SUB(NOW(), INTERVAL ? DAY)
       ORDER BY fecha_pedido ASC`,
      [dias],
    );

    res.json({
      success: true,
      count: rows.length,
      data: rows.map((r) => ({
        id: r.id,
        cliente_nombre: r.cliente_nombre,
        cliente_telefono: r.cliente_telefono,
        total: parseFloat(r.total),
        fecha_pedido: r.fecha_pedido,
        dias_esperando: r.dias_esperando,
      })),
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

module.exports = {
  getResumenSemanal,
  getPedidosPagoPendiente,
  getPedidosEstancados,
};
