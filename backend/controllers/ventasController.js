const { promisePool } = require("../config/database");
const { applyDateRangeFilter } = require("../utils/dateRangeFilter");
const { montoCoincide, parseMontoValidado } = require("../utils/montoValidation");
const {
  getControlaStockMap,
  getPrecioTipoMap,
  aplicarMovimientoStock,
  aplicarMovimientoStockCombo,
} = require("../utils/stockMovements");
const { notificarN8N } = require("../utils/n8nWebhook");
const {
  calcularSaldoCliente,
  registrarMovimientoCuentaCorriente,
} = require("../utils/cuentaCorriente");

// ============================================
// LISTAR VENTAS (libro de caja, filtrable por rango de fechas y/o pedido)
// ============================================
const getVentas = async (req, res) => {
  try {
    const { desde, hasta, pedido_id, cliente_id } = req.query;

    // vi_agg/pi_agg agrupan cantidad por producto ANTES de armar el texto
    // (SUM en vez de GROUP_CONCAT DISTINCT sobre las filas crudas), para que
    // dos ítems del mismo producto sumen sus cantidades ("2x Producto") en
    // vez de que el DISTINCT los colapse en una sola línea "1x Producto".
    // Cada subquery ya devuelve una sola fila por venta_id/pedido_id, así
    // que el join no multiplica filas y no hace falta GROUP BY v.id afuera.
    let query = `
      SELECT
        v.id, v.pedido_id, v.cliente_id, v.fecha, v.monto_efectivo, v.monto_transferencia,
        v.monto_cuenta_corriente, v.descuento, v.monto_total, v.tipo, v.notas,
        COALESCE(v.cliente_nombre, CONCAT_WS(' ', cl.nombre, cl.apellido), p.cliente_nombre) as cliente_nombre,
        COALESCE(v.cliente_telefono, cl.telefono, p.cliente_telefono) as cliente_telefono,
        -- Venta directa tiene sus propios venta_items; seña/pago no tienen
        -- items propios, así que se muestran los del pedido al que pertenecen.
        COALESCE(vi_agg.productos, pi_agg.productos) as productos
      FROM ventas v
      LEFT JOIN pedidos p ON p.id = v.pedido_id
      LEFT JOIN clientes cl ON cl.id = v.cliente_id
      LEFT JOIN (
        SELECT venta_id, GROUP_CONCAT(linea ORDER BY titulo SEPARATOR ', ') as productos
        FROM (
          SELECT vi.venta_id, pr.titulo,
            CONCAT(SUM(vi.cantidad), 'x ', pr.titulo) as linea
          FROM venta_items vi
          JOIN productos pr ON pr.id = vi.producto_id
          GROUP BY vi.venta_id, pr.id, pr.titulo
        ) agrupado
        GROUP BY venta_id
      ) vi_agg ON vi_agg.venta_id = v.id
      LEFT JOIN (
        SELECT pedido_id, GROUP_CONCAT(linea ORDER BY titulo SEPARATOR ', ') as productos
        FROM (
          SELECT pi.pedido_id, pp.titulo,
            CONCAT(SUM(pi.cantidad), 'x ', pp.titulo) as linea
          FROM pedido_items pi
          JOIN productos pp ON pp.id = pi.producto_id
          GROUP BY pi.pedido_id, pp.id, pp.titulo
        ) agrupado
        GROUP BY pedido_id
      ) pi_agg ON pi_agg.pedido_id = v.pedido_id
      WHERE 1=1
    `;
    const params = [];

    if (pedido_id) {
      query += ` AND v.pedido_id = ?`;
      params.push(pedido_id);
    }

    if (cliente_id) {
      query += ` AND v.cliente_id = ?`;
      params.push(cliente_id);
    }

    query = applyDateRangeFilter(query, params, { desde, hasta }, "v.fecha");
    query += ` ORDER BY v.fecha DESC`;

    const [rows] = await promisePool.query(query, params);

    res.json({
      success: true,
      count: rows.length,
      data: rows.map((row) => ({
        ...row,
        monto_efectivo: parseFloat(row.monto_efectivo),
        monto_transferencia: parseFloat(row.monto_transferencia),
        monto_cuenta_corriente: parseFloat(row.monto_cuenta_corriente),
        descuento: parseFloat(row.descuento),
        monto_total: parseFloat(row.monto_total),
      })),
    });
  } catch (error) {
    console.error("Error obteniendo ventas:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener las ventas",
      message: error.message,
    });
  }
};

// ============================================
// OBTENER VENTA POR ID (con items si es venta directa)
// ============================================
const getVentaById = async (req, res) => {
  try {
    const { id } = req.params;

    const [ventas] = await promisePool.query(
      `SELECT
        v.*,
        COALESCE(v.cliente_nombre, CONCAT_WS(' ', cl.nombre, cl.apellido), p.cliente_nombre) as cliente_nombre_resuelto,
        COALESCE(v.cliente_telefono, cl.telefono, p.cliente_telefono) as cliente_telefono_resuelto
      FROM ventas v
      LEFT JOIN pedidos p ON p.id = v.pedido_id
      LEFT JOIN clientes cl ON cl.id = v.cliente_id
      WHERE v.id = ?`,
      [id],
    );

    if (ventas.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Venta no encontrada" });
    }

    const [items] = await promisePool.query(
      `SELECT vi.*, pr.titulo as producto_titulo
       FROM venta_items vi
       LEFT JOIN productos pr ON pr.id = vi.producto_id
       WHERE vi.venta_id = ?`,
      [id],
    );

    const venta = ventas[0];

    res.json({
      success: true,
      data: {
        ...venta,
        cliente_nombre: venta.cliente_nombre_resuelto,
        cliente_telefono: venta.cliente_telefono_resuelto,
        monto_efectivo: parseFloat(venta.monto_efectivo),
        monto_transferencia: parseFloat(venta.monto_transferencia),
        monto_cuenta_corriente: parseFloat(venta.monto_cuenta_corriente),
        descuento: parseFloat(venta.descuento),
        monto_total: parseFloat(venta.monto_total),
        items: items.map((item) => ({
          ...item,
          precio_unitario: parseFloat(item.precio_unitario),
          subtotal: parseFloat(item.subtotal),
        })),
      },
    });
  } catch (error) {
    console.error("Error obteniendo venta:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener la venta",
      message: error.message,
    });
  }
};

// ============================================
// CREAR VENTA DIRECTA DE MOSTRADOR
// El monto cargado (efectivo + transferencia + a cuenta) debe coincidir
// exacto con el total de los items menos el descuento y menos el saldo a
// favor que se le haya aplicado automáticamente al cliente (ver más abajo).
// Descuenta stock producto por producto, bloqueando si no alcanza (misma
// técnica que updateOrderStatus).
// ============================================
const createVentaDirecta = async (req, res) => {
  const connection = await promisePool.getConnection();

  try {
    const {
      cliente_id,
      cliente_nombre,
      cliente_telefono,
      monto_efectivo = 0,
      monto_transferencia = 0,
      monto_cuenta_corriente = 0,
      descuento = 0,
      notas,
      items,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Debe agregar al menos un producto a la venta",
      });
    }

    const montoCuentaCorrienteNum = parseMontoValidado(monto_cuenta_corriente);
    const efectivoValidado = parseMontoValidado(monto_efectivo);
    const transferenciaValidada = parseMontoValidado(monto_transferencia);

    // Mismo validador que registrarPagoCuentaCorriente -- sin esto, un monto
    // no numérico o negativo llega crudo al INSERT y termina rompiendo por
    // un constraint de la base en vez de devolver un 400 claro.
    if (
      montoCuentaCorrienteNum === null ||
      efectivoValidado === null ||
      transferenciaValidada === null
    ) {
      return res.status(400).json({
        success: false,
        error: "Los montos deben ser números válidos y no negativos",
      });
    }

    // No existe "a cuenta" sin saber a quién se le fía -- lo mismo aplica al
    // reforzar en la base con chk_ventas_cuenta_corriente_requiere_cliente
    // (ver migración 023), esto solo da un mensaje amigable antes de llegar
    // a ese error crudo de SQL.
    if (montoCuentaCorrienteNum > 0 && !cliente_id) {
      return res.status(400).json({
        success: false,
        error: "Para vender a cuenta corriente hay que vincular un cliente registrado",
      });
    }

    const sumaItems = items.reduce(
      (acc, item) =>
        acc + parseFloat(item.precio_unitario) * parseInt(item.cantidad),
      0,
    );

    const descuentoNum = parseMontoValidado(descuento);
    // El descuento no puede igualar ni superar el total de los ítems: eso
    // dejaría montoEsperado en 0 (o negativo), permitiendo "cerrar" una
    // venta sin ingreso real ni deuda registrada mientras igual se descuenta
    // stock real. Regalos/promociones 100% gratuitas quedan fuera de este
    // fix -- necesitarían un mecanismo explícito aparte.
    if (descuentoNum === null || descuentoNum >= sumaItems) {
      return res.status(400).json({
        success: false,
        error:
          "El descuento debe ser un número válido, no negativo, y menor al total de los productos",
      });
    }

    const montoEsperado = sumaItems - descuentoNum;

    await connection.beginTransaction();

    // Si el cliente tiene saldo a favor, se aplica siempre automático (sin
    // opt-out -- así se acordó con el dueño): reduce lo que hay que cobrar
    // por efectivo/transferencia/cuenta antes de validar el monto cargado.
    // El cliente se bloquea con FOR UPDATE ANTES de leer su saldo -- misma
    // técnica que registrarPagoCuentaCorriente -- para que dos ventas
    // concurrentes al mismo cliente no lean el mismo saldo a favor y lo
    // apliquen dos veces: se serializan sobre esta fila hasta que la
    // primera transacción haga commit o rollback.
    let saldoAFavorAplicado = 0;
    if (cliente_id) {
      const [clientesLocked] = await connection.query(
        "SELECT id, activo FROM clientes WHERE id = ? FOR UPDATE",
        [cliente_id],
      );
      if (clientesLocked.length === 0 || !clientesLocked[0].activo) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          error: "El cliente no existe o está inactivo",
        });
      }

      const saldoActual = await calcularSaldoCliente(connection, cliente_id);
      const saldoAFavorDisponible = saldoActual < 0 ? -saldoActual : 0;
      saldoAFavorAplicado = Math.min(saldoAFavorDisponible, montoEsperado);
    }

    const montoAPagar = montoEsperado - saldoAFavorAplicado;
    const montoCargado =
      efectivoValidado + transferenciaValidada + montoCuentaCorrienteNum;

    if (!montoCoincide(montoCargado, montoAPagar)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error:
          saldoAFavorAplicado > 0
            ? `El monto cargado (${montoCargado.toFixed(2)}) no coincide con el total a pagar (${montoAPagar.toFixed(2)}), ya descontado el saldo a favor aplicado (${saldoAFavorAplicado.toFixed(2)})`
            : `El monto cargado (${montoCargado.toFixed(2)}) no coincide con el total de los productos menos el descuento (${montoEsperado.toFixed(2)})`,
      });
    }

    // Con saldo a favor cubriendo todo (montoAPagar === 0) es válido no
    // cargar nada de efectivo/transferencia/cuenta -- ver migración 023
    // (se eliminó chk_ventas_algun_monto por este mismo motivo).
    if (montoCargado <= 0 && montoAPagar > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: "Debe indicarse un monto en efectivo, transferencia y/o a cuenta",
      });
    }

    const [ventaResult] = await connection.query(
      `INSERT INTO ventas (tipo, monto_efectivo, monto_transferencia, monto_cuenta_corriente, descuento, cliente_id, cliente_nombre, cliente_telefono, notas)
       VALUES ('venta_directa', ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        efectivoValidado,
        transferenciaValidada,
        montoCuentaCorrienteNum,
        descuentoNum,
        cliente_id || null,
        cliente_nombre || null,
        cliente_telefono || null,
        notas || null,
      ],
    );

    const ventaId = ventaResult.insertId;
    const sinStock = [];

    // Productos que no controlan stock (ej. copias/impresiones) no
    // participan del descuento ni del movimiento -- solo se registra la
    // venta como ingreso.
    const productoIds = items.map((item) => item.producto_id);
    const controlaStockMap = await getControlaStockMap(connection, productoIds);
    // Un ítem puede ser un combo (precio_tipo='combo'): no tiene stock
    // propio, así que en vez del descuento simple se descuenta su receta
    // completa (ver aplicarMovimientoStockCombo).
    const precioTipoMap = await getPrecioTipoMap(connection, productoIds);

    for (const item of items) {
      const cantidad = parseInt(item.cantidad);

      await connection.query(
        `INSERT INTO venta_items (venta_id, producto_id, producto_variante_id, cantidad, precio_unitario)
         VALUES (?, ?, ?, ?, ?)`,
        [
          ventaId,
          item.producto_id,
          item.producto_variante_id || null,
          cantidad,
          item.precio_unitario,
        ],
      );

      if (precioTipoMap.get(parseInt(item.producto_id)) === "combo") {
        const { ok } = await aplicarMovimientoStockCombo(connection, {
          comboProductoId: item.producto_id,
          cantidadCombos: cantidad,
          tipo: "salida_venta",
          refColumn: "venta_id",
          refId: ventaId,
        });

        if (!ok) {
          sinStock.push(item.producto_id);
        }
        continue;
      }

      // Un ítem con variante siempre controla stock -- las variantes
      // existen justamente para llevar stock propio por medida.
      if (
        !item.producto_variante_id &&
        controlaStockMap.get(parseInt(item.producto_id)) === false
      ) {
        continue;
      }

      const { ok } = await aplicarMovimientoStock(connection, {
        productoId: item.producto_id,
        varianteId: item.producto_variante_id,
        cantidad,
        direccion: "salida",
        tipo: "salida_venta",
        refColumn: "venta_id",
        refId: ventaId,
      });

      if (!ok) {
        sinStock.push(item.producto_variante_id || item.producto_id);
      }
    }

    if (sinStock.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: "Stock insuficiente para completar la venta",
        productos_sin_stock: sinStock,
      });
    }

    if (saldoAFavorAplicado > 0) {
      await registrarMovimientoCuentaCorriente(connection, {
        clienteId: cliente_id,
        tipo: "saldo_a_favor_aplicado",
        monto: saldoAFavorAplicado,
        ventaId,
        notas: "Aplicado automáticamente al cobrar esta venta",
      });
    }

    if (montoCuentaCorrienteNum > 0) {
      await registrarMovimientoCuentaCorriente(connection, {
        clienteId: cliente_id,
        tipo: "venta_fiado",
        monto: montoCuentaCorrienteNum,
        ventaId,
      });
    }

    await connection.commit();

    notificarN8N("venta_directa_creada", {
      venta_id: ventaId,
      cliente_nombre: cliente_nombre || null,
      cliente_telefono: cliente_telefono || null,
      monto_total: montoCargado,
    });

    res.status(201).json({
      success: true,
      message: "Venta registrada exitosamente",
      data: {
        id: ventaId,
        monto_total: montoCargado,
        saldo_a_favor_aplicado: saldoAFavorAplicado,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error creando venta directa:", error);
    res.status(500).json({
      success: false,
      error: "Error al crear la venta",
      message: error.message,
    });
  } finally {
    connection.release();
  }
};

// ============================================
// RESUMEN DIARIO (para la vista de caja)
// ============================================
const getResumenDiario = async (req, res) => {
  try {
    const { fecha } = req.query;

    if (!fecha) {
      return res.status(400).json({
        success: false,
        error: "El parámetro 'fecha' es requerido (formato YYYY-MM-DD)",
      });
    }

    const [rows] = await promisePool.query(
      `SELECT
        COALESCE(SUM(monto_efectivo), 0) as total_efectivo,
        COALESCE(SUM(monto_transferencia), 0) as total_transferencia,
        COALESCE(SUM(monto_total), 0) as total_general,
        COUNT(*) as cantidad_ventas
      FROM ventas
      WHERE DATE(fecha) = ?`,
      [fecha],
    );

    const resumen = rows[0];

    res.json({
      success: true,
      data: {
        fecha,
        total_efectivo: parseFloat(resumen.total_efectivo),
        total_transferencia: parseFloat(resumen.total_transferencia),
        total_general: parseFloat(resumen.total_general),
        cantidad_ventas: resumen.cantidad_ventas,
      },
    });
  } catch (error) {
    console.error("Error obteniendo resumen diario:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener el resumen diario",
      message: error.message,
    });
  }
};

module.exports = {
  getVentas,
  getVentaById,
  createVentaDirecta,
  getResumenDiario,
};
