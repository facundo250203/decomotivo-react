const { promisePool } = require("../config/database");
const { applyDateRangeFilter } = require("../utils/dateRangeFilter");
const { montoCoincide } = require("../utils/montoValidation");
const {
  getControlaStockMap,
  aplicarMovimientoStock,
} = require("../utils/stockMovements");

// ============================================
// LISTAR COMPRAS
// ============================================
const getCompras = async (req, res) => {
  try {
    const { desde, hasta, proveedor_id } = req.query;

    let query = `
      SELECT
        c.id, c.proveedor_id, c.fecha, c.monto_efectivo, c.monto_transferencia,
        c.monto_total, c.notas,
        pr.nombre as proveedor_nombre
      FROM compras c
      LEFT JOIN proveedores pr ON pr.id = c.proveedor_id
      WHERE 1=1
    `;
    const params = [];

    if (proveedor_id) {
      query += ` AND c.proveedor_id = ?`;
      params.push(proveedor_id);
    }

    query = applyDateRangeFilter(query, params, { desde, hasta }, "c.fecha");
    query += ` ORDER BY c.fecha DESC`;

    const [rows] = await promisePool.query(query, params);

    res.json({
      success: true,
      count: rows.length,
      data: rows.map((row) => ({
        ...row,
        monto_efectivo: parseFloat(row.monto_efectivo),
        monto_transferencia: parseFloat(row.monto_transferencia),
        monto_total: parseFloat(row.monto_total),
        es_produccion_propia: row.proveedor_id === null,
      })),
    });
  } catch (error) {
    console.error("Error obteniendo compras:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener las compras",
      message: error.message,
    });
  }
};

// ============================================
// OBTENER COMPRA POR ID (con items)
// ============================================
const getCompraById = async (req, res) => {
  try {
    const { id } = req.params;

    const [compras] = await promisePool.query(
      `SELECT c.*, pr.nombre as proveedor_nombre
       FROM compras c
       LEFT JOIN proveedores pr ON pr.id = c.proveedor_id
       WHERE c.id = ?`,
      [id],
    );

    if (compras.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Compra no encontrada" });
    }

    const [items] = await promisePool.query(
      `SELECT ci.*, pr.titulo as producto_titulo
       FROM compra_items ci
       LEFT JOIN productos pr ON pr.id = ci.producto_id
       WHERE ci.compra_id = ?`,
      [id],
    );

    const compra = compras[0];

    res.json({
      success: true,
      data: {
        ...compra,
        monto_efectivo: parseFloat(compra.monto_efectivo),
        monto_transferencia: parseFloat(compra.monto_transferencia),
        monto_total: parseFloat(compra.monto_total),
        es_produccion_propia: compra.proveedor_id === null,
        items: items.map((item) => ({
          ...item,
          costo_unitario: parseFloat(item.costo_unitario),
          subtotal: parseFloat(item.subtotal),
        })),
      },
    });
  } catch (error) {
    console.error("Error obteniendo compra:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener la compra",
      message: error.message,
    });
  }
};

// ============================================
// CREAR COMPRA (real a proveedor, o entrada de producción propia)
// proveedor_id presente = compra real: el monto (efectivo+transferencia)
// debe coincidir exacto con la suma de los items. proveedor_id vacío =
// producción propia: no hay pago real en este momento, se fuerza el monto
// a 0/0 (no hay plata que salga de la cuenta).
// ============================================
const createCompra = async (req, res) => {
  const connection = await promisePool.getConnection();

  try {
    const { proveedor_id, notas, items } = req.body;
    let { monto_efectivo = 0, monto_transferencia = 0 } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Debe agregar al menos un producto a la compra",
      });
    }

    const esProduccionPropia = !proveedor_id;

    if (esProduccionPropia) {
      monto_efectivo = 0;
      monto_transferencia = 0;
    } else {
      const sumaItems = items.reduce(
        (acc, item) =>
          acc + parseFloat(item.costo_unitario) * parseInt(item.cantidad),
        0,
      );
      const montoCargado =
        parseFloat(monto_efectivo) + parseFloat(monto_transferencia);

      if (montoCargado <= 0) {
        return res.status(400).json({
          success: false,
          error:
            "Debe indicarse un monto en efectivo y/o transferencia para una compra a proveedor",
        });
      }

      if (!montoCoincide(montoCargado, sumaItems)) {
        return res.status(400).json({
          success: false,
          error: `El monto cargado (${montoCargado.toFixed(2)}) no coincide con el total de los productos (${sumaItems.toFixed(2)})`,
        });
      }
    }

    await connection.beginTransaction();

    const [compraResult] = await connection.query(
      `INSERT INTO compras (proveedor_id, monto_efectivo, monto_transferencia, notas)
       VALUES (?, ?, ?, ?)`,
      [
        proveedor_id || null,
        monto_efectivo,
        monto_transferencia,
        notas || null,
      ],
    );

    const compraId = compraResult.insertId;

    // Productos que no controlan stock (ej. copias/impresiones) no suman
    // cantidad ni generan movimiento -- solo queda el registro de costo.
    const productoIds = items.map((item) => item.producto_id);
    const controlaStockMap = await getControlaStockMap(connection, productoIds);

    for (const item of items) {
      const cantidad = parseInt(item.cantidad);

      await connection.query(
        `INSERT INTO compra_items (compra_id, producto_id, producto_variante_id, cantidad, costo_unitario)
         VALUES (?, ?, ?, ?, ?)`,
        [
          compraId,
          item.producto_id,
          item.producto_variante_id || null,
          cantidad,
          item.costo_unitario,
        ],
      );

      // Un ítem con variante siempre controla stock -- las variantes
      // existen justamente para llevar stock propio por medida.
      if (
        !item.producto_variante_id &&
        controlaStockMap.get(parseInt(item.producto_id)) === false
      ) {
        continue;
      }

      // Entrada de stock: nunca necesita el guard de "cantidad >= ?" porque
      // solo suma, no puede dejar el stock en negativo.
      await aplicarMovimientoStock(connection, {
        productoId: item.producto_id,
        varianteId: item.producto_variante_id,
        cantidad,
        direccion: "entrada",
        tipo: "entrada_compra",
        refColumn: "compra_id",
        refId: compraId,
      });
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Compra registrada exitosamente",
      data: { id: compraId },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error creando compra:", error);
    res.status(500).json({
      success: false,
      error: "Error al crear la compra",
      message: error.message,
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  getCompras,
  getCompraById,
  createCompra,
};
