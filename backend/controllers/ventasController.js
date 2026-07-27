const { promisePool } = require("../config/database");
const { applyDateRangeFilter } = require("../utils/dateRangeFilter");
const { montoCoincide, parseMontoValidado } = require("../utils/montoValidation");
const {
  getControlaStockMap,
  getPrecioTipoMap,
  aplicarMovimientoStock,
  aplicarMovimientoStockCombo,
} = require("../utils/stockMovements");
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
        -- Solo para tipo='sena': permite al front distinguir una seña
        -- parcial de una que cubrió el 100% del pedido (mismo monto), sin
        -- cambiar cómo se guarda el dato -- un pedido solo se señala una
        -- vez (ver orderController), así que comparar esta única venta
        -- contra el total alcanza, no hace falta sumar varias.
        p.total as pedido_total,
        -- NULLIF(...,'') a propósito: si v.cliente_id es NULL (seña/pago de
        -- un pedido, el cliente vive en el pedido, no en la venta), el JOIN
        -- a clientes no matchea y CONCAT_WS(' ', NULL, NULL) da '' (no NULL
        -- -- a diferencia de CONCAT, CONCAT_WS nunca devuelve NULL salvo que
        -- el separador lo sea). Sin el NULLIF, COALESCE toma ese '' como
        -- "valor válido" y nunca llega al fallback de p.cliente_nombre.
        COALESCE(v.cliente_nombre, NULLIF(CONCAT_WS(' ', cl.nombre, cl.apellido), ''), p.cliente_nombre) as cliente_nombre,
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
          GROUP BY vi.venta_id, pr.id, vi.descripcion_manual
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
        pedido_total: row.pedido_total !== null ? parseFloat(row.pedido_total) : null,
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
        COALESCE(v.cliente_nombre, NULLIF(CONCAT_WS(' ', cl.nombre, cl.apellido), ''), p.cliente_nombre) as cliente_nombre_resuelto,
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

    // LEFT JOIN a producto_variantes para resolver el NOMBRE de la variante
    // (ej. "Común x 1") -- hasta ahora solo se devolvía el id crudo
    // producto_variante_id y el frontend no tenía forma de mostrar qué
    // variante puntual participó de la línea.
    const [items] = await promisePool.query(
      `SELECT vi.*, COALESCE(pr.titulo, vi.descripcion_manual) as producto_titulo,
        pv.nombre as variante_nombre
       FROM venta_items vi
       LEFT JOIN productos pr ON pr.id = vi.producto_id
       LEFT JOIN producto_variantes pv ON pv.id = vi.producto_variante_id
       WHERE vi.venta_id = ?`,
      [id],
    );

    // Extras (ver migración 025) se traen en una segunda consulta -- uno o
    // más por venta_item -- y se anidan por venta_item_id más abajo, en vez
    // de un JOIN directo contra venta_items, para no multiplicar filas de
    // items cuando una línea tiene más de un extra. Desde la migración 029
    // un extra también puede traer producto_variante_id, mismo join que
    // arriba para resolver su nombre.
    const itemIds = items.map((item) => item.id);
    let extrasRows = [];
    if (itemIds.length > 0) {
      const [rows] = await promisePool.query(
        `SELECT vie.*, COALESCE(pr.titulo, vie.descripcion) as extra_titulo,
          pv.nombre as variante_nombre
         FROM venta_item_extras vie
         LEFT JOIN productos pr ON pr.id = vie.producto_id
         LEFT JOIN producto_variantes pv ON pv.id = vie.producto_variante_id
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
            productoVarianteId: extra.producto_variante_id || null,
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
        // cajas_vendidas (ver migración 027): puramente informativo para
        // reconstruir "Caja x10" en el detalle -- cantidad y precioUnitario
        // ya vienen calculados desde el frontend (cantidad = cajas *
        // unidades_por_caja, precioUnitario = precio_caja / unidades_por_caja),
        // acá no se recalcula nada, solo se guarda el dato para mostrarlo.
        const cajasVendidas = item.cajas_vendidas
          ? parseInt(item.cajas_vendidas)
          : null;

        itemsNormalizados.push({
          esManual: false,
          productoId: item.producto_id,
          productoVarianteId: item.producto_variante_id || null,
          cantidad,
          precioUnitario,
          cajasVendidas,
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

    // El faltante nunca se permite (con o sin cliente): cerrar una venta
    // cobrando de menos sería directamente regalar mercadería. El sobrante,
    // en cambio, solo se permite si hay a quién acreditarle esa plata -- un
    // cliente vinculado a la venta. Caso real de mostrador: el cliente paga
    // $1000 por una compra de $400 y no quiere el vuelto en efectivo: ese
    // sobrante pasa a ser saldo a favor del cliente (tipo 'vuelto_a_favor',
    // ver migración 032) en vez de bloquear la venta. Sin cliente vinculado
    // (mostrador anónimo) el sobrante se sigue rechazando igual que antes --
    // no hay cuenta corriente donde acreditarlo.
    let vueltoAFavor = 0;
    if (!montoCoincide(montoCargado, montoAPagar)) {
      const diferenciaCargo = montoCargado - montoAPagar;
      const esFaltante = diferenciaCargo < 0;

      if (esFaltante || !cliente_id) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          error:
            saldoAFavorAplicado > 0
              ? `El monto cargado (${montoCargado.toFixed(2)}) no coincide con el total a pagar (${montoAPagar.toFixed(2)}), ya descontado el saldo a favor aplicado (${saldoAFavorAplicado.toFixed(2)})`
              : `El monto cargado (${montoCargado.toFixed(2)}) no coincide con el total de los productos menos el descuento (${montoEsperado.toFixed(2)})`,
        });
      }

      vueltoAFavor = Math.round(diferenciaCargo * 100) / 100;
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
    // Un extra que referencia un producto real de catálogo DESCUENTA stock
    // igual que un ítem normal (confirmado por el dueño del negocio: es una
    // unidad real que sale del inventario), así que sus producto_id entran
    // a la misma unión de IDs para no quedar con controlaStockMap/
    // precioTipoMap en `undefined` y caer mal en las comparaciones de abajo.
    const productoIds = itemsNormalizados
      .filter((item) => !item.esManual)
      .map((item) => item.productoId);
    const extraProductoIds = itemsNormalizados.flatMap((item) =>
      item.extras
        .filter((extra) => extra.productoId)
        .map((extra) => extra.productoId),
    );
    const todosLosProductoIds = [
      ...new Set([...productoIds, ...extraProductoIds]),
    ];
    const controlaStockMap = await getControlaStockMap(
      connection,
      todosLosProductoIds,
    );
    // Un ítem puede ser un combo (precio_tipo='combo'): no tiene stock
    // propio, así que en vez del descuento simple se descuenta su receta
    // completa (ver aplicarMovimientoStockCombo). Mismo criterio para un
    // extra que referencia un combo.
    const precioTipoMap = await getPrecioTipoMap(
      connection,
      todosLosProductoIds,
    );

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
          `INSERT INTO venta_items (venta_id, producto_id, producto_variante_id, cantidad, cajas_vendidas, precio_unitario)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            ventaId,
            item.productoId,
            item.productoVarianteId,
            item.cantidad,
            item.cajasVendidas,
            item.precioUnitario,
          ],
        );
        ventaItemId = itemResult.insertId;
      }

      // Extras (ver migración 025): cuelgan de este venta_item recién
      // insertado sin importar si la línea es de catálogo o manual. Un extra
      // de texto libre (sin producto_id) es puramente un ajuste de precio/
      // descripción y nunca toca stock -- no hay producto real detrás. Un
      // extra que SÍ referencia un producto real de catálogo descuenta su
      // stock exactamente igual que un ítem normal (confirmado por el dueño
      // del negocio: es una unidad real que sale de inventario, no un simple
      // ajuste de precio), usando la cantidad del extra -- no la del ítem
      // padre -- y las mismas reglas combo / controla_stock=false / falla
      // a `sinStock` que ya aplica el loop de ítems más abajo. Desde la
      // migración 029 un extra SÍ puede traer variante (producto_variante_id)
      // -- necesario para productos precio_tipo='variantes', donde
      // productos.cantidad es un placeholder en 0 y el stock real vive en la
      // variante puntual.
      for (const extra of item.extras) {
        await connection.query(
          `INSERT INTO venta_item_extras (venta_item_id, producto_id, producto_variante_id, descripcion, precio, cantidad)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            ventaItemId,
            extra.productoId || null,
            extra.productoVarianteId || null,
            extra.descripcion,
            extra.precio,
            extra.cantidad,
          ],
        );

        if (!extra.productoId) {
          continue;
        }

        if (precioTipoMap.get(parseInt(extra.productoId)) === "combo") {
          const { ok: comboOk } = await aplicarMovimientoStockCombo(
            connection,
            {
              comboProductoId: extra.productoId,
              cantidadCombos: extra.cantidad,
              tipo: "salida_venta",
              refColumn: "venta_id",
              refId: ventaId,
            },
          );

          if (!comboOk) {
            sinStock.push(extra.productoId);
          }
          continue;
        }

        // Mismo criterio que el ítem principal: un extra con variante
        // siempre controla stock (la variante existe justamente para llevar
        // stock propio por medida); sin variante, se respeta controla_stock.
        if (
          !extra.productoVarianteId &&
          controlaStockMap.get(parseInt(extra.productoId)) === false
        ) {
          continue;
        }

        const { ok: extraOk } = await aplicarMovimientoStock(connection, {
          productoId: extra.productoId,
          varianteId: extra.productoVarianteId,
          cantidad: extra.cantidad,
          direccion: "salida",
          tipo: "salida_venta",
          refColumn: "venta_id",
          refId: ventaId,
        });

        if (!extraOk) {
          sinStock.push(extra.productoVarianteId || extra.productoId);
        }
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

    // Vuelto no retirado (ver validación de montoCargado/montoAPagar más
    // arriba): ya se confirmó ahí que solo llega acá con vueltoAFavor > 0
    // cuando hay cliente vinculado, así que no hace falta re-chequear
    // cliente_id en este punto.
    if (vueltoAFavor > 0) {
      await registrarMovimientoCuentaCorriente(connection, {
        clienteId: cliente_id,
        tipo: "vuelto_a_favor",
        monto: vueltoAFavor,
        ventaId,
        notas: "Vuelto no retirado por el cliente, acreditado a su cuenta",
      });
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Venta registrada exitosamente",
      data: {
        id: ventaId,
        monto_total: montoCargado,
        saldo_a_favor_aplicado: saldoAFavorAplicado,
        vuelto_a_favor: vueltoAFavor,
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
// EDITAR VENTA DIRECTA (alcance limitado, ver decisión del dueño)
// Solo se pueden tocar los campos "de cabecera" -- fecha, cliente, notas,
// descuento y las 3 formas de pago. venta_items/venta_item_extras y stock
// son inmutables acá a propósito: si el vendedor se equivocó en QUÉ se
// vendió, la corrección es borrar la venta (ver deleteVentaDirecta, que sí
// revierte todo) y cargarla de nuevo, no editar los ítems in-place.
// ============================================
const updateVentaDirecta = async (req, res) => {
  const connection = await promisePool.getConnection();

  try {
    const { id } = req.params;
    const {
      fecha,
      cliente_id,
      cliente_nombre,
      cliente_telefono,
      notas,
      descuento = 0,
      monto_efectivo = 0,
      monto_transferencia = 0,
      monto_cuenta_corriente = 0,
    } = req.body;

    const montoCuentaCorrienteNum = parseMontoValidado(monto_cuenta_corriente);
    const efectivoValidado = parseMontoValidado(monto_efectivo);
    const transferenciaValidada = parseMontoValidado(monto_transferencia);
    const descuentoNum = parseMontoValidado(descuento);

    if (
      montoCuentaCorrienteNum === null ||
      efectivoValidado === null ||
      transferenciaValidada === null ||
      descuentoNum === null
    ) {
      return res.status(400).json({
        success: false,
        error: "Los montos deben ser números válidos y no negativos",
      });
    }

    const nuevoClienteId = cliente_id ? parseInt(cliente_id) : null;

    if (montoCuentaCorrienteNum > 0 && !nuevoClienteId) {
      return res.status(400).json({
        success: false,
        error: "Para vender a cuenta corriente hay que vincular un cliente registrado",
      });
    }

    if (fecha && Number.isNaN(new Date(fecha).getTime())) {
      return res.status(400).json({
        success: false,
        error: "La fecha ingresada no es válida",
      });
    }

    await connection.beginTransaction();

    // Lock de la fila -- misma técnica que createVentaDirecta usa sobre el
    // cliente, acá sobre la venta, para que dos ediciones concurrentes de la
    // misma venta no lean el mismo estado "viejo" y calculen un delta de
    // cuenta corriente incorrecto.
    const [ventas] = await connection.query(
      "SELECT * FROM ventas WHERE id = ? FOR UPDATE",
      [id],
    );
    if (ventas.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, error: "Venta no encontrada" });
    }

    const ventaActual = ventas[0];
    if (ventaActual.tipo !== "venta_directa") {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: "Solo se pueden editar ventas directas",
      });
    }

    if (nuevoClienteId) {
      const [clientesRows] = await connection.query(
        "SELECT id, activo FROM clientes WHERE id = ?",
        [nuevoClienteId],
      );
      if (clientesRows.length === 0 || !clientesRows[0].activo) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          error: "El cliente no existe o está inactivo",
        });
      }
    }

    // sumaItems se recalcula desde los venta_items/venta_item_extras YA
    // guardados (nunca del body -- editar no toca ítems, ver comentario de
    // arriba), mismo cálculo que createVentaDirecta hace sobre los ítems
    // recién armados.
    const [[sumaRow]] = await connection.query(
      `SELECT
         COALESCE(SUM(vi.subtotal), 0) as suma_items,
         COALESCE((
           SELECT SUM(vie.subtotal)
           FROM venta_item_extras vie
           JOIN venta_items vi2 ON vi2.id = vie.venta_item_id
           WHERE vi2.venta_id = ?
         ), 0) as suma_extras
       FROM venta_items vi
       WHERE vi.venta_id = ?`,
      [id, id],
    );
    const sumaItems = parseFloat(sumaRow.suma_items) + parseFloat(sumaRow.suma_extras);

    // Mismo guardia que createVentaDirecta: el descuento no puede igualar ni
    // superar el total de los ítems.
    if (descuentoNum >= sumaItems) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error:
          "El descuento debe ser un número válido, no negativo, y menor al total de los productos",
      });
    }

    const montoEsperado = sumaItems - descuentoNum;
    const montoCargado = efectivoValidado + transferenciaValidada + montoCuentaCorrienteNum;

    // A diferencia de createVentaDirecta, acá NO se recalcula/reaplica saldo
    // a favor -- ese ajuste ya ocurrió (o no) en el momento de la creación y
    // no es parte del alcance acordado para editar. El invariante a validar
    // es simplemente monto cargado === total de ítems - descuento.
    if (!montoCoincide(montoCargado, montoEsperado)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: `El monto cargado (${montoCargado.toFixed(2)}) no coincide con el total de los productos menos el descuento (${montoEsperado.toFixed(2)})`,
      });
    }

    // Reconciliación de cuenta corriente: si el cliente cambió, se revierte
    // completo el movimiento viejo contra el cliente viejo y se da de alta
    // completo el nuevo contra el cliente nuevo (no tiene sentido calcular un
    // "delta" entre dos clientes distintos). Si el cliente es el mismo, solo
    // se registra la diferencia entre el monto viejo y el nuevo.
    const montoCcViejo = parseFloat(ventaActual.monto_cuenta_corriente);
    const clienteViejoId = ventaActual.cliente_id;
    const clienteCambio = clienteViejoId !== nuevoClienteId;

    if (clienteCambio) {
      if (montoCcViejo > 0 && clienteViejoId) {
        await registrarMovimientoCuentaCorriente(connection, {
          clienteId: clienteViejoId,
          tipo: "pago_cliente",
          monto: montoCcViejo,
          ventaId: id,
          notas: `Reversión por cambio de cliente al editar la venta #${id}`,
        });
      }
      if (montoCuentaCorrienteNum > 0) {
        await registrarMovimientoCuentaCorriente(connection, {
          clienteId: nuevoClienteId,
          tipo: "venta_fiado",
          monto: montoCuentaCorrienteNum,
          ventaId: id,
          notas: `Alta por cambio de cliente al editar la venta #${id}`,
        });
      }
    } else {
      const delta = montoCuentaCorrienteNum - montoCcViejo;
      if (delta > 0.01) {
        await registrarMovimientoCuentaCorriente(connection, {
          clienteId: nuevoClienteId,
          tipo: "venta_fiado",
          monto: delta,
          ventaId: id,
          notas: `Ajuste por edición de la venta #${id} (aumento de monto a cuenta corriente)`,
        });
      } else if (delta < -0.01) {
        await registrarMovimientoCuentaCorriente(connection, {
          clienteId: nuevoClienteId,
          tipo: "pago_cliente",
          monto: -delta,
          ventaId: id,
          notas: `Ajuste por edición de la venta #${id} (disminución de monto a cuenta corriente)`,
        });
      }
    }

    await connection.query(
      `UPDATE ventas SET fecha = ?, cliente_id = ?, cliente_nombre = ?, cliente_telefono = ?, notas = ?, descuento = ?, monto_efectivo = ?, monto_transferencia = ?, monto_cuenta_corriente = ?
       WHERE id = ?`,
      [
        fecha || ventaActual.fecha,
        nuevoClienteId,
        cliente_nombre || null,
        cliente_telefono || null,
        notas || null,
        descuentoNum,
        efectivoValidado,
        transferenciaValidada,
        montoCuentaCorrienteNum,
        id,
      ],
    );

    await connection.commit();

    res.json({
      success: true,
      message: "Venta actualizada correctamente",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error editando venta directa:", error);
    res.status(500).json({
      success: false,
      error: "Error al editar la venta",
      message: error.message,
    });
  } finally {
    connection.release();
  }
};

// ============================================
// ELIMINAR VENTA DIRECTA
// Hard delete -- sin soft-delete/undo (decisión del dueño). Antes de borrar
// la fila hay que revertir todo lo que la creación tocó por fuera de
// `ventas`: stock (por ítem/extra, misma lógica de decisión que
// createVentaDirecta) y cuenta corriente (todo movimiento que haya quedado
// con este venta_id). Si se salteara la reversión de cuenta corriente, la
// venta desaparece pero la deuda/saldo a favor que generó queda fantasma en
// el cliente para siempre -- por eso corre ANTES del DELETE final, dentro de
// la misma transacción.
// ============================================
const deleteVentaDirecta = async (req, res) => {
  const connection = await promisePool.getConnection();

  try {
    const { id } = req.params;

    await connection.beginTransaction();

    const [ventas] = await connection.query(
      "SELECT * FROM ventas WHERE id = ? FOR UPDATE",
      [id],
    );
    if (ventas.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, error: "Venta no encontrada" });
    }

    const venta = ventas[0];
    if (venta.tipo !== "venta_directa") {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: "Solo se pueden eliminar ventas directas",
      });
    }

    const [items] = await connection.query(
      "SELECT * FROM venta_items WHERE venta_id = ?",
      [id],
    );

    const itemIds = items.map((item) => item.id);
    let extras = [];
    if (itemIds.length > 0) {
      const [extraRows] = await connection.query(
        `SELECT * FROM venta_item_extras WHERE venta_item_id IN (${itemIds.map(() => "?").join(",")})`,
        itemIds,
      );
      extras = extraRows;
    }

    // Mismos mapas que createVentaDirecta arma antes de tocar stock -- se
    // recalculan acá con el estado ACTUAL de productos (controla_stock/
    // precio_tipo pudieron cambiar desde que se creó la venta; se asume que
    // no cambiaron, misma limitación implícita que ya tiene createVentaDirecta
    // al decidir con el estado del momento).
    const productoIds = items
      .filter((item) => item.producto_id)
      .map((item) => item.producto_id);
    const extraProductoIds = extras
      .filter((extra) => extra.producto_id)
      .map((extra) => extra.producto_id);
    const todosLosProductoIds = [
      ...new Set([...productoIds, ...extraProductoIds]),
    ];
    const controlaStockMap = await getControlaStockMap(connection, todosLosProductoIds);
    const precioTipoMap = await getPrecioTipoMap(connection, todosLosProductoIds);

    for (const item of items) {
      // Ítem manual (producto_id NULL, ver migración 024): nunca tocó stock
      // en la creación, nada que revertir.
      if (!item.producto_id) continue;

      if (precioTipoMap.get(item.producto_id) === "combo") {
        await aplicarMovimientoStockCombo(connection, {
          comboProductoId: item.producto_id,
          cantidadCombos: item.cantidad,
          direccion: "entrada",
          tipo: "ajuste_manual",
          refColumn: "venta_id",
          refId: id,
        });
        continue;
      }

      // Mismo criterio que createVentaDirecta: sin variante y con
      // controla_stock=false, la línea nunca movió stock.
      if (
        !item.producto_variante_id &&
        controlaStockMap.get(item.producto_id) === false
      ) {
        continue;
      }

      await aplicarMovimientoStock(connection, {
        productoId: item.producto_id,
        varianteId: item.producto_variante_id,
        cantidad: item.cantidad,
        direccion: "entrada",
        tipo: "ajuste_manual",
        refColumn: "venta_id",
        refId: id,
      });
    }

    // Extras con producto_id real también descontaron stock en la creación
    // (confirmado con el dueño del negocio, ver migración 025) -- se
    // revierten con la misma lógica que los ítems. Desde la migración 029 un
    // extra puede traer producto_variante_id, mismo criterio de "con
    // variante siempre controla stock" que el loop de ítems de arriba.
    for (const extra of extras) {
      if (!extra.producto_id) continue;

      if (precioTipoMap.get(extra.producto_id) === "combo") {
        await aplicarMovimientoStockCombo(connection, {
          comboProductoId: extra.producto_id,
          cantidadCombos: extra.cantidad,
          direccion: "entrada",
          tipo: "ajuste_manual",
          refColumn: "venta_id",
          refId: id,
        });
        continue;
      }

      if (
        !extra.producto_variante_id &&
        controlaStockMap.get(extra.producto_id) === false
      )
        continue;

      await aplicarMovimientoStock(connection, {
        productoId: extra.producto_id,
        varianteId: extra.producto_variante_id,
        cantidad: extra.cantidad,
        direccion: "entrada",
        tipo: "ajuste_manual",
        refColumn: "venta_id",
        refId: id,
      });
    }

    // Reversión de cuenta corriente: por cada movimiento que esta venta haya
    // generado (venta_fiado, saldo_a_favor_aplicado o vuelto_a_favor, los
    // tres tipos que createVentaDirecta puede registrar), se compensa con un
    // movimiento de signo contrario del mismo monto. ventaId se mantiene
    // apuntando a la venta que se está por borrar -- el FK tiene ON DELETE
    // SET NULL (migración 023), así que el DELETE de más abajo lo deja en
    // NULL solo, sin romper esta fila.
    //
    // venta_fiado/saldo_a_favor_aplicado caen en el bucket "+monto" de
    // calcularSaldoCliente, así que se compensan restando: un pago_cliente
    // (bucket "-monto"). vuelto_a_favor es al revés -- ya cae en el bucket
    // "-monto" (le da saldo a favor al cliente), así que revertirlo hay que
    // sumarlo de vuelta: un venta_fiado (bucket "+monto") del mismo monto,
    // que le quita al cliente el crédito que se le había otorgado por esta
    // venta.
    const [movimientosCC] = await connection.query(
      "SELECT * FROM movimientos_cuenta_corriente WHERE venta_id = ?",
      [id],
    );
    for (const mov of movimientosCC) {
      if (mov.tipo === "venta_fiado" || mov.tipo === "saldo_a_favor_aplicado") {
        await registrarMovimientoCuentaCorriente(connection, {
          clienteId: mov.cliente_id,
          tipo: "pago_cliente",
          monto: parseFloat(mov.monto),
          ventaId: id,
          notas: `Reversión por eliminación de la venta #${id}`,
        });
      } else if (mov.tipo === "vuelto_a_favor") {
        await registrarMovimientoCuentaCorriente(connection, {
          clienteId: mov.cliente_id,
          tipo: "venta_fiado",
          monto: parseFloat(mov.monto),
          ventaId: id,
          notas: `Reversión de vuelto acreditado por eliminación de la venta #${id}`,
        });
      }
    }

    // venta_items/venta_item_extras cascadean (fk ON DELETE CASCADE, ver
    // migraciones 003/025); movimientos_stock/movimientos_cuenta_corriente
    // sobreviven con venta_id en NULL (ON DELETE SET NULL).
    await connection.query("DELETE FROM ventas WHERE id = ?", [id]);

    await connection.commit();

    res.json({
      success: true,
      message: "Venta eliminada. Stock y cuenta corriente revertidos correctamente.",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error eliminando venta directa:", error);
    res.status(500).json({
      success: false,
      error: "Error al eliminar la venta",
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
  updateVentaDirecta,
  deleteVentaDirecta,
  getResumenDiario,
};
