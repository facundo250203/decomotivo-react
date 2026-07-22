const { promisePool } = require("../config/database");

// ============================================
// OBTENER PRODUCTOS CON STOCK BAJO
// Consumido por n8n (autenticado con API key, no JWT humano). Incluye tanto
// productos simples como variantes (medidas) por separado -- cada una tiene
// su propio stock_minimo, ver migración 018.
// ============================================
const getLowStockProducts = async (req, res) => {
  try {
    // stock_minimo = 0 es el default de un producto/variante nunca
    // configurado ("conservador, no alerta nada hasta que se configure
    // producto por producto") -- sin el ">0" acá, cualquier producto sin
    // configurar que llegue a 0 unidades entra igual (0 <= 0), mezclando
    // ruido con las alertas que sí se pidieron de verdad.
    const [rows] = await promisePool.query(`
      SELECT
        p.id as producto_id,
        p.titulo,
        p.slug,
        NULL as variante,
        p.cantidad,
        p.stock_minimo,
        c.nombre AS categoria_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.activo = true
        AND p.controla_stock = true
        AND p.precio_tipo NOT IN ('variantes', 'combo')
        AND p.stock_minimo > 0
        AND p.cantidad <= p.stock_minimo

      UNION ALL

      SELECT
        p.id as producto_id,
        p.titulo,
        p.slug,
        pv.nombre as variante,
        pv.cantidad,
        pv.stock_minimo,
        c.nombre AS categoria_nombre
      FROM producto_variantes pv
      JOIN productos p ON p.id = pv.producto_id
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.activo = true
        AND pv.activo = true
        AND pv.stock_minimo > 0
        AND pv.cantidad <= pv.stock_minimo

      ORDER BY (stock_minimo - cantidad) DESC
    `);

    res.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Error obteniendo productos con stock bajo:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener productos con stock bajo",
      message: error.message,
    });
  }
};

module.exports = { getLowStockProducts };
