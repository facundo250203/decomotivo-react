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
        -- LEFT JOIN a productos (no INNER): un ítem manual (producto_id
        -- NULL, ver migración 024) no tiene fila en productos, así que su
        -- nombre sale de descripcion_manual -- si fuera INNER JOIN esas
        -- líneas desaparecerían del resumen de "productos" de la venta.
        SELECT venta_id, GROUP_CONCAT(linea ORDER BY titulo SEPARATOR ', ') as productos
        FROM (
          SELECT vi.venta_id, COALESCE(pr.titulo, vi.descripcion_manual) as titulo,
            CONCAT(SUM(vi.cantidad), 'x ', COALESCE(pr.titulo, vi.descripcion_manual)) as linea
          FROM venta_items vi
          LEFT JOIN productos pr ON pr.id = vi.producto_id
          GROUP BY vi.venta_id, pr.id, COALESCE(pr.titulo, vi.descripcion_manual)
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
      `SELECT vi.*, COALESCE(pr.titulo, vi.descripcion_manual) as producto_titulo
       FROM venta_items vi
       LEFT JOIN productos pr ON pr.id = vi.producto_id
       WHERE vi.venta_id = ?`,
      [id],
    );

    // Extras (ver migración 025) se traen en una segunda consulta -- uno o
    // más por venta_item -- y se anidan por venta_item_id más abajo, en vez
    // de un JOIN directo contra venta_items, para no multiplicar filas de
    // items cuando una línea tiene más de un extra.
    const itemIds = items.map((item) => item.id);
    let extrasRows = [];
    if (itemIds.length > 0) {
      const [rows] = await promisePool.query(
        `SELECT vie.*, COALESCE(pr.titulo, vie.descripcion) as extra_titulo
         FROM venta_item_extras vie
         LEFT JOIN productos pr ON pr.id = vie.producto_id
         WHERE vie.venta_item_id IN (${itemIds.map(() => "?").join(",")})`,
        itemIds,
      );
      extrasRows = rows;
    }

    const extrasPorItem = new Map();
    for (const extra of extrasRows) {
      const lista = extrasPorItem.get(extra.venta_item_id) || [];
      lista.push({
        ...extra,
        precio: parseFloat(extra.precio),
        subtotal: parseFloat(extra.subtotal),
      });
      extrasPorItem.set(extra.venta_item_id, lista);
    }

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
          precio_manual:
            item.precio_manual !== null ? parseFloat(item.precio_manual) : null,
          subtotal: parseFloat(item.subtotal),
          // producto_id NULL = línea manual (ver migración 024). Se calcula
          // acá en vez de guardarse en la base para que el frontend no
          // dependa de inferirlo de otra forma.
          es_manual: item.producto_id === null,
          extras: extrasPorItem.get(item.id) || [],
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

    // Extras (ver migración 025): un array opcional anidado dentro de cada
    // ítem, sin importar si ese ítem es de catálogo o manual -- cuelgan del
    // venta_item, no del producto. Misma validación en espíritu que un ítem:
    // o un producto real de catálogo (precio autocompletado en el front pero
    // editable, así que igual se valida acá) o texto libre + precio a mano.
    // Nunca ninguno de los dos, nunca los dos a la vez -- mismo patrón que
    // chk_venta_items_producto_o_manual, reforzado además por el CHECK de la
    // migración 025 por si algo bypasea este validador.
    const normalizarExtras = (extrasRaw) => {
      const extras = [];
      for (const extra of Array.isArray(extrasRaw) ? extrasRaw : []) {
        const cantidadExtra =
          extra.cantidad !== undefined ? parseInt(extra.cantidad) : 1;
        if (!Number.isInteger(cantidadExtra) || cantidadExtra <= 0) {
          return { error: "Cada extra debe tener una cantidad entera mayor a 0" };
        }

        if (extra.producto_id) {
          const precioExtra = parseMontoValidado(extra.precio);
          if (precioExtra === null || precioExtra <= 0) {
            return {
              error: "Cada extra de catálogo debe tener un precio válido mayor a 0",
            };
          }
          extras.push({
            productoId: extra.producto_id,
            descripcion: null,
            precio: precioExtra,
            cantidad: cantidadExtra,
          });
        } else {
          const descripcionExtra = (extra.descripcion || "").trim();
          const precioExtra = parseMontoValidado(extra.precio);
          if (!descripcionExtra) {
            return { error: "Cada extra manual debe tener una descripción" };
          }
          if (precioExtra === null || precioExtra <= 0) {
            return {
              error: "Cada extra manual debe tener un precio válido mayor a 0",
            };
          }
          extras.push({
            productoId: null,
            descripcion: descripcionExtra,
            precio: precioExtra,
            cantidad: cantidadExtra,
          });
        }
      }
      return { extras };
    };

    // Normaliza cada ítem a uno de dos tipos ANTES de tocar la base: de
    // catálogo (producto_id) o manual/no catalogado (descripcion_manual +
    // precio_manual, ver migración 024) -- un ítem manual no referencia
    // ningún producto real, así que no participa de stock ni de
    // controla_stock más abajo. precioUnitario sale de precio_manual para
    // que el subtotal (cantidad * precio_unitario, columna generada) se
    // calcule igual para los dos tipos sin bifurcar esa cuenta.
    const itemsNormalizados = [];
    for (const item of items) {
      const cantidad = parseInt(item.cantidad);
      if (!Number.isInteger(cantidad) || cantidad <= 0) {
        return res.status(400).json({
          success: false,
          error: "Cada ítem debe tener una cantidad entera mayor a 0",
        });
      }

      const { error: extrasError, extras } = normalizarExtras(item.extras);
      if (extrasError) {
        return res.status(400).json({ success: false, error: extrasError });
      }

      if (item.producto_id) {
        const precioUnitario = parseFloat(item.precio_unitario);
        if (!Number.isFinite(precioUnitario) || precioUnitario <= 0) {
          return res.status(400).json({
            success: false,
            error: "Cada producto de catálogo debe tener un precio unitario válido",
          });
        }
        itemsNormalizados.push({
          esManual: false,
          productoId: item.producto_id,
          productoVarianteId: item.producto_variante_id || null,
          cantidad,
          precioUnitario,
          extras,
        });
      } else {
        const descripcionManual = (item.descripcion_manual || "").trim();
        const precioManual = parseMontoValidado(item.precio_manual);
        if (!descripcionManual) {
          return res.status(400).json({
            success: false,
            error: "Cada ítem manual debe tener una descripción",
          });
        }
        if (precioManual === null || precioManual <= 0) {
          return res.status(400).json({
            success: false,
            error: "Cada ítem manual debe tener un precio válido mayor a 0",
          });
        }
        itemsNormalizados.push({
          esManual: true,
          descripcionManual,
          precioManual,
          cantidad,
          precioUnitario: precioManual,
          extras,
        });
      }
    }

    // sumaItems pliega el precio de cada extra (precio * cantidad) sobre el
    // total de su línea padre -- así el total/montoEsperado/montoCoincide de
    // más abajo ya cubre los extras sin ningún caso especial.
    const sumaItems = itemsNormalizados.reduce((acc, item) => {
      const sumaExtras = item.extras.reduce(
        (accExtra, extra) => accExtra + extra.precio * extra.cantidad,
        0,
      );
      return acc + item.precioUnitario * item.cantidad + sumaExtras;
    }, 0);

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
    // venta como ingreso. Los ítems manuales quedan afuera de este mapa: no
    // tienen producto_id, así que directamente no entran al loop de stock.
    const productoIds = itemsNormalizados
      .filter((item) => !item.esManual)
      .map((item) => item.productoId);
    const controlaStockMap = await getControlaStockMap(connection, productoIds);
    // Un ítem puede ser un combo (precio_tipo='combo'): no tiene stock
    // propio, así que en vez del descuento simple se descuenta su receta
    // completa (ver aplicarMovimientoStockCombo).
    const precioTipoMap = await getPrecioTipoMap(connection, productoIds);

    for (const item of itemsNormalizados) {
      let ventaItemId;

      if (item.esManual) {
        // Ítem no catalogado (ver migración 024): ni stock ni
        // controla_stock aplican porque no hay producto real detrás.
        const [itemResult] = await connection.query(
          `INSERT INTO venta_items (venta_id, producto_id, producto_variante_id, descripcion_manual, precio_manual, cantidad, precio_unitario)
           VALUES (?, NULL, NULL, ?, ?, ?, ?)`,
          [
            ventaId,
            item.descripcionManual,
            item.precioManual,
            item.cantidad,
            item.precioUnitario,
          ],
        );
        ventaItemId = itemResult.insertId;
      } else {
        const [itemResult] = await connection.query(
          `INSERT INTO venta_items (venta_id, producto_id, producto_variante_id, cantidad, precio_unitario)
           VALUES (?, ?, ?, ?, ?)`,
          [
            ventaId,
            item.productoId,
            item.productoVarianteId,
            item.cantidad,
            item.precioUnitario,
          ],
        );
        ventaItemId = itemResult.insertId;
      }

      // Extras (ver migración 025): cuelgan de este venta_item recién
      // insertado sin importar si la línea es de catálogo o manual. Un extra
      // que referencia un producto real NO descuenta su stock -- se lo
      // trata como un ajuste de precio/descripción sobre la línea, no como
      // una segunda venta con movimiento de inventario propio (ver decisión
      // en la migración 025).
      for (const extra of item.extras) {
        await connection.query(
          `INSERT INTO venta_item_extras (venta_item_id, producto_id, descripcion, precio, cantidad)
           VALUES (?, ?, ?, ?, ?)`,
          [ventaItemId, extra.productoId || null, extra.descripcion, extra.precio, extra.cantidad],
        );
      }

      if (item.esManual) {
        continue;
      }

      if (precioTipoMap.get(parseInt(item.productoId)) === "combo") {
        const { ok } = await aplicarMovimientoStockCombo(connection, {
          comboProductoId: item.productoId,
          cantidadCombos: item.cantidad,
          tipo: "salida_venta",
          refColumn: "venta_id",
          refId: ventaId,
        });

        if (!ok) {
          sinStock.push(item.productoId);
        }
        continue;
      }

      // Un ítem con variante siempre controla stock -- las variantes
      // existen justamente para llevar stock propio por medida.
      if (
        !item.productoVarianteId &&
        controlaStockMap.get(parseInt(item.productoId)) === false
      ) {
        continue;
      }

      const { ok } = await aplicarMovimientoStock(connection, {
        productoId: item.productoId,
        varianteId: item.productoVarianteId,
        cantidad: item.cantidad,
        direccion: "salida",
        tipo: "salida_venta",
        refColumn: "venta_id",
        refId: ventaId,
      });

      if (!ok) {
        sinStock.push(item.productoVarianteId || item.productoId);
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
