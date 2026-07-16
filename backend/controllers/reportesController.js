const { promisePool } = require("../config/database");

// "Ítems vendidos" combinando venta_items (ventas directas) y pedido_items
// (pedidos, sin importar si ya se cobraron del todo -- el precio pactado ya
// es facturación real). Nunca se pisan entre sí: venta_items solo existe
// para tipo='venta_directa', las señas/pagos de un pedido no generan
// venta_items propios.
const ITEMS_VENDIDOS_SUBQUERY = `
  SELECT vi.producto_id, vi.cantidad, vi.precio_unitario
    FROM venta_items vi
    JOIN ventas v ON v.id = vi.venta_id
    WHERE DATE(v.fecha) BETWEEN ? AND ?
  UNION ALL
  SELECT pi.producto_id, pi.cantidad, pi.precio_unitario
    FROM pedido_items pi
    JOIN pedidos pd ON pd.id = pi.pedido_id
    WHERE DATE(pd.fecha_pedido) BETWEEN ? AND ?
`;

const hace30Dias = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
};
const hoyISO = () => new Date().toISOString().slice(0, 10);

// ============================================
// FACTURACIÓN EN EL TIEMPO (serie diaria)
// ============================================
const getFacturacionSerie = async (desde, hasta) => {
  const [rows] = await promisePool.query(
    `SELECT DATE(fecha) as fecha,
      COALESCE(SUM(monto_efectivo), 0) as efectivo,
      COALESCE(SUM(monto_transferencia), 0) as transferencia,
      COALESCE(SUM(monto_total), 0) as total
     FROM ventas
     WHERE DATE(fecha) BETWEEN ? AND ?
     GROUP BY DATE(fecha)
     ORDER BY fecha ASC`,
    [desde, hasta],
  );
  return rows.map((r) => ({
    fecha: r.fecha,
    efectivo: parseFloat(r.efectivo),
    transferencia: parseFloat(r.transferencia),
    total: parseFloat(r.total),
  }));
};

// ============================================
// VENTAS POR CATEGORÍA
// ============================================
const getVentasPorCategoria = async (desde, hasta) => {
  const [rows] = await promisePool.query(
    `SELECT c.nombre as categoria,
      SUM(items.cantidad) as cantidad_vendida,
      SUM(items.cantidad * items.precio_unitario) as total_facturado
     FROM (${ITEMS_VENDIDOS_SUBQUERY}) items
     JOIN productos p ON p.id = items.producto_id
     JOIN categorias c ON c.id = p.categoria_id
     GROUP BY c.id, c.nombre
     ORDER BY total_facturado DESC`,
    [desde, hasta, desde, hasta],
  );
  return rows.map((r) => ({
    categoria: r.categoria,
    cantidad_vendida: parseInt(r.cantidad_vendida),
    total_facturado: parseFloat(r.total_facturado),
  }));
};

// ============================================
// TOP PRODUCTOS MÁS VENDIDOS
// ============================================
const getTopProductos = async (desde, hasta) => {
  const [rows] = await promisePool.query(
    `SELECT p.titulo,
      SUM(items.cantidad) as cantidad_vendida,
      SUM(items.cantidad * items.precio_unitario) as total_facturado
     FROM (${ITEMS_VENDIDOS_SUBQUERY}) items
     JOIN productos p ON p.id = items.producto_id
     GROUP BY p.id, p.titulo
     ORDER BY total_facturado DESC
     LIMIT 10`,
    [desde, hasta, desde, hasta],
  );
  return rows.map((r) => ({
    titulo: r.titulo,
    cantidad_vendida: parseInt(r.cantidad_vendida),
    total_facturado: parseFloat(r.total_facturado),
  }));
};

// ============================================
// MARGEN DE GANANCIA POR PRODUCTO
// Costo promedio ponderado de TODAS las compras del producto (no filtrado
// por fecha -- el costo de reposición no depende del período del reporte).
// Solo incluye productos con al menos una compra registrada: sin costo
// cargado no hay margen que calcular, ni tiene sentido asumir un costo.
// ============================================
const getMargenGanancia = async (desde, hasta) => {
  const [rows] = await promisePool.query(
    `SELECT p.titulo,
      SUM(items.cantidad) as cantidad_vendida,
      SUM(items.cantidad * items.precio_unitario) as total_facturado,
      costos.costo_promedio,
      SUM(items.cantidad) * costos.costo_promedio as costo_total,
      SUM(items.cantidad * items.precio_unitario)
        - (SUM(items.cantidad) * costos.costo_promedio) as ganancia
     FROM (${ITEMS_VENDIDOS_SUBQUERY}) items
     JOIN productos p ON p.id = items.producto_id
     JOIN (
       SELECT producto_id,
         SUM(costo_unitario * cantidad) / SUM(cantidad) as costo_promedio
       FROM compra_items
       GROUP BY producto_id
     ) costos ON costos.producto_id = items.producto_id
     GROUP BY p.id, p.titulo, costos.costo_promedio
     ORDER BY ganancia DESC`,
    [desde, hasta, desde, hasta],
  );

  const productos = rows.map((r) => {
    const total_facturado = parseFloat(r.total_facturado);
    const ganancia = parseFloat(r.ganancia);
    return {
      titulo: r.titulo,
      cantidad_vendida: parseInt(r.cantidad_vendida),
      total_facturado,
      costo_total: parseFloat(r.costo_total),
      ganancia,
      margen_porcentaje:
        total_facturado > 0 ? (ganancia / total_facturado) * 100 : 0,
    };
  });

  const totalFacturado = productos.reduce((acc, p) => acc + p.total_facturado, 0);
  const totalCosto = productos.reduce((acc, p) => acc + p.costo_total, 0);
  const totalGanancia = totalFacturado - totalCosto;

  return {
    productos,
    resumen: {
      total_facturado: totalFacturado,
      total_costo: totalCosto,
      total_ganancia: totalGanancia,
      margen_porcentaje:
        totalFacturado > 0 ? (totalGanancia / totalFacturado) * 100 : 0,
    },
  };
};

// ============================================
// EFECTIVIDAD DE OFERTAS
// ============================================
const getEfectividadOfertas = async (desde, hasta) => {
  const [rows] = await promisePool.query(
    `SELECT p.titulo, p.precio_valor, p.precio_oferta,
      SUM(items.cantidad) as cantidad_vendida
     FROM (${ITEMS_VENDIDOS_SUBQUERY}) items
     JOIN productos p ON p.id = items.producto_id
     WHERE p.en_oferta = 1
     GROUP BY p.id, p.titulo, p.precio_valor, p.precio_oferta
     ORDER BY cantidad_vendida DESC`,
    [desde, hasta, desde, hasta],
  );
  return rows.map((r) => ({
    titulo: r.titulo,
    precio_valor: parseFloat(r.precio_valor),
    precio_oferta: parseFloat(r.precio_oferta),
    cantidad_vendida: parseInt(r.cantidad_vendida),
  }));
};

// ============================================
// TOP CLIENTES POR MONTO ACUMULADO (solo ventas con cliente registrado --
// una venta de mostrador sin cliente asociado no se le puede atribuir a
// nadie en particular).
// ============================================
const getTopClientes = async (desde, hasta) => {
  const [rows] = await promisePool.query(
    `SELECT CONCAT_WS(' ', cl.nombre, cl.apellido) as nombre,
      COUNT(*) as cantidad_compras,
      SUM(v.monto_total) as total_gastado
     FROM ventas v
     JOIN clientes cl ON cl.id = v.cliente_id
     WHERE DATE(v.fecha) BETWEEN ? AND ?
     GROUP BY cl.id, cl.nombre, cl.apellido
     ORDER BY total_gastado DESC
     LIMIT 10`,
    [desde, hasta],
  );
  return rows.map((r) => ({
    nombre: r.nombre,
    cantidad_compras: parseInt(r.cantidad_compras),
    total_gastado: parseFloat(r.total_gastado),
  }));
};

// ============================================
// GASTO POR PROVEEDOR (solo compras reales, no producción propia)
// ============================================
const getGastoPorProveedor = async (desde, hasta) => {
  const [rows] = await promisePool.query(
    `SELECT pr.nombre,
      COUNT(*) as cantidad_compras,
      SUM(c.monto_efectivo + c.monto_transferencia) as total_gastado
     FROM compras c
     JOIN proveedores pr ON pr.id = c.proveedor_id
     WHERE c.proveedor_id IS NOT NULL AND DATE(c.fecha) BETWEEN ? AND ?
     GROUP BY pr.id, pr.nombre
     ORDER BY total_gastado DESC`,
    [desde, hasta],
  );
  return rows.map((r) => ({
    nombre: r.nombre,
    cantidad_compras: parseInt(r.cantidad_compras),
    total_gastado: parseFloat(r.total_gastado),
  }));
};

// ============================================
// CLIENTES NUEVOS VS. RECURRENTES POR MES
// Nuevos: creados dentro del mes. Recurrentes: compraron ese mes pero ya
// existían de antes.
// ============================================
const getClientesNuevosVsRecurrentes = async (desde, hasta) => {
  const [nuevosRows] = await promisePool.query(
    `SELECT DATE_FORMAT(creado_en, '%Y-%m') as mes, COUNT(*) as nuevos
     FROM clientes
     WHERE DATE(creado_en) BETWEEN ? AND ?
     GROUP BY mes
     ORDER BY mes`,
    [desde, hasta],
  );

  const [recurrentesRows] = await promisePool.query(
    `SELECT DATE_FORMAT(v.fecha, '%Y-%m') as mes,
      COUNT(DISTINCT v.cliente_id) as recurrentes
     FROM ventas v
     JOIN clientes cl ON cl.id = v.cliente_id
     WHERE DATE(v.fecha) BETWEEN ? AND ?
       AND cl.creado_en < DATE_FORMAT(v.fecha, '%Y-%m-01')
     GROUP BY mes
     ORDER BY mes`,
    [desde, hasta],
  );

  const porMes = new Map();
  nuevosRows.forEach((r) =>
    porMes.set(r.mes, { mes: r.mes, nuevos: r.nuevos, recurrentes: 0 }),
  );
  recurrentesRows.forEach((r) => {
    const existente = porMes.get(r.mes) || { mes: r.mes, nuevos: 0, recurrentes: 0 };
    existente.recurrentes = r.recurrentes;
    porMes.set(r.mes, existente);
  });

  return [...porMes.values()].sort((a, b) => a.mes.localeCompare(b.mes));
};

// ============================================
// SALDO DE CAJA EN EL TIEMPO (reutiliza los cierres diarios ya guardados)
// ============================================
const getSaldoCajaSerie = async (desde, hasta) => {
  const [rows] = await promisePool.query(
    `SELECT fecha, acumulado_efectivo, acumulado_transferencia
     FROM cierres_caja
     WHERE fecha BETWEEN ? AND ?
     ORDER BY fecha ASC`,
    [desde, hasta],
  );
  return rows.map((r) => ({
    fecha: r.fecha,
    acumulado_efectivo: parseFloat(r.acumulado_efectivo),
    acumulado_transferencia: parseFloat(r.acumulado_transferencia),
    acumulado_total:
      parseFloat(r.acumulado_efectivo) + parseFloat(r.acumulado_transferencia),
  }));
};

// ============================================
// STOCK BAJO/AGOTADO (snapshot actual, no depende de fechas): productos
// simples y variantes por separado, cada uno contra su propio stock_minimo.
// ============================================
const getStockBajo = async () => {
  const [rows] = await promisePool.query(
    `SELECT p.titulo as producto, NULL as variante, p.cantidad, p.stock_minimo
       FROM productos p
       WHERE p.controla_stock = 1 AND p.precio_tipo NOT IN ('variantes', 'combo')
         AND p.activo = 1 AND p.cantidad <= p.stock_minimo
     UNION ALL
     SELECT p.titulo as producto, pv.nombre as variante, pv.cantidad, pv.stock_minimo
       FROM producto_variantes pv
       JOIN productos p ON p.id = pv.producto_id
       WHERE pv.activo = 1 AND p.activo = 1 AND pv.cantidad <= pv.stock_minimo
     ORDER BY cantidad ASC`,
  );
  return rows.map((r) => ({
    producto: r.producto,
    variante: r.variante,
    cantidad: r.cantidad,
    stock_minimo: r.stock_minimo,
  }));
};

// ============================================
// RESUMEN COMPLETO (todo lo anterior en una sola llamada -- la usa tanto
// el dashboard como, más adelante, el reporte periódico de N8N).
// ============================================
const getResumen = async (req, res) => {
  try {
    const desde = req.query.desde || hace30Dias();
    const hasta = req.query.hasta || hoyISO();

    const [
      facturacion_serie,
      ventas_por_categoria,
      top_productos,
      margen_ganancia,
      efectividad_ofertas,
      top_clientes,
      gasto_por_proveedor,
      clientes_nuevos_vs_recurrentes,
      saldo_caja_serie,
      stock_bajo,
    ] = await Promise.all([
      getFacturacionSerie(desde, hasta),
      getVentasPorCategoria(desde, hasta),
      getTopProductos(desde, hasta),
      getMargenGanancia(desde, hasta),
      getEfectividadOfertas(desde, hasta),
      getTopClientes(desde, hasta),
      getGastoPorProveedor(desde, hasta),
      getClientesNuevosVsRecurrentes(desde, hasta),
      getSaldoCajaSerie(desde, hasta),
      getStockBajo(),
    ]);

    res.json({
      success: true,
      data: {
        rango: { desde, hasta },
        facturacion_serie,
        ventas_por_categoria,
        top_productos,
        margen_ganancia,
        efectividad_ofertas,
        top_clientes,
        gasto_por_proveedor,
        clientes_nuevos_vs_recurrentes,
        saldo_caja_serie,
        stock_bajo,
      },
    });
  } catch (error) {
    console.error("Error generando el resumen de reportes:", error);
    res.status(500).json({
      success: false,
      error: "Error al generar el resumen de reportes",
      message: error.message,
    });
  }
};

// getTopProductos también se reutiliza desde n8nController (reporte
// semanal), para no duplicar la consulta de ítems vendidos.
module.exports = { getResumen, getTopProductos };
