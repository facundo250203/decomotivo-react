// backend/controllers/orderController.js
const { promisePool } = require('../config/database');
const {
  getControlaStockMap,
  getPrecioTipoMap,
  aplicarMovimientoStock,
  aplicarMovimientoStockCombo,
} = require('../utils/stockMovements');
const { parseMontoValidado } = require('../utils/montoValidation');
const { notificarN8N } = require('../utils/n8nWebhook');

// ============================================
// HELPER: Estructurar pedido con sus items
// ============================================
const structureOrderWithItems = (rows) => {
  if (rows.length === 0) return null;

  const order = {
    id: rows[0].id,
    cliente_id: rows[0].cliente_id,
    cliente_nombre: rows[0].cliente_nombre,
    cliente_telefono: rows[0].cliente_telefono,
    cliente_email: rows[0].cliente_email,
    subtotal: parseFloat(rows[0].subtotal),
    descuento: parseFloat(rows[0].descuento),
    total: parseFloat(rows[0].total),
    monto_sena: parseFloat(rows[0].monto_sena),
    estado: rows[0].estado,
    fecha_pedido: rows[0].fecha_pedido,
    fecha_senado: rows[0].fecha_senado,
    fecha_entregado: rows[0].fecha_entregado,
    notas: rows[0].notas,
    items: rows
      .filter(row => row.item_id)
      .map(row => ({
        id: row.item_id,
        producto_id: row.item_producto_id,
        producto_titulo: row.producto_titulo,
        descripcion: row.item_descripcion,
        precio_unitario: parseFloat(row.item_precio_unitario),
        cantidad: row.item_cantidad,
        subtotal: parseFloat(row.item_subtotal)
      }))
  };

  return order;
};

// ============================================
// CREAR PEDIDO
// ============================================
const createOrder = async (req, res) => {
  const connection = await promisePool.getConnection();
  
  try {
    const {
      cliente_id,
      cliente_nombre,
      cliente_telefono,
      cliente_email,
      items, // Array de { producto_id, descripcion, precio_unitario, cantidad }
      descuento = 0,
      notas
    } = req.body;

    // Validaciones
    if (!cliente_nombre) {
      return res.status(400).json({
        success: false,
        error: 'El nombre del cliente es requerido'
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Debe agregar al menos un producto al pedido'
      });
    }

    await connection.beginTransaction();

    // Calcular subtotal
    let subtotal = 0;
    for (const item of items) {
      subtotal += parseFloat(item.precio_unitario) * parseInt(item.cantidad);
    }

    // Calcular total
    const total = subtotal - parseFloat(descuento);

    // Insertar pedido. monto_sena queda con su default (0): la seña real se
    // registra recién cuando el pedido pasa a estado 'senado' (ver
    // updateOrderStatus), no en la creación.
    const [result] = await connection.query(
      `INSERT INTO pedidos (
        cliente_id, cliente_nombre, cliente_telefono, cliente_email,
        subtotal, descuento, total, notas
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cliente_id || null,
        cliente_nombre,
        cliente_telefono || null,
        cliente_email || null,
        subtotal,
        descuento,
        total,
        notas || null
      ]
    );

    const pedidoId = result.insertId;

    // Insertar items del pedido
    for (const item of items) {
      const itemSubtotal = parseFloat(item.precio_unitario) * parseInt(item.cantidad);
      
      await connection.query(
        `INSERT INTO pedido_items (
          pedido_id, producto_id, producto_variante_id, descripcion,
          precio_unitario, cantidad, subtotal
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          pedidoId,
          item.producto_id,
          item.producto_variante_id || null,
          item.descripcion || null,
          item.precio_unitario,
          item.cantidad,
          itemSubtotal
        ]
      );
    }

    await connection.commit();

    // Obtener el pedido completo creado
    const [pedidoCompleto] = await promisePool.query(`
      SELECT 
        p.*,
        pi.id as item_id,
        pi.producto_id as item_producto_id,
        pi.descripcion as item_descripcion,
        pi.precio_unitario as item_precio_unitario,
        pi.cantidad as item_cantidad,
        pi.subtotal as item_subtotal,
        pr.titulo as producto_titulo
      FROM pedidos p
      LEFT JOIN pedido_items pi ON p.id = pi.pedido_id
      LEFT JOIN productos pr ON pi.producto_id = pr.id
      WHERE p.id = ?
    `, [pedidoId]);

    const order = structureOrderWithItems(pedidoCompleto);

    // Fire-and-forget: no se espera (await) esto, no debe demorar ni romper
    // la respuesta al cliente si n8n está caído o sin configurar.
    notificarN8N('pedido_creado', {
      pedido_id: order.id,
      cliente_nombre: order.cliente_nombre,
      cliente_telefono: order.cliente_telefono,
      total: order.total,
    });

    res.status(201).json({
      success: true,
      message: 'Pedido creado exitosamente',
      data: order
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error creando pedido:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear el pedido',
      message: error.message
    });
  } finally {
    connection.release();
  }
};

// ============================================
// OBTENER TODOS LOS PEDIDOS
// ============================================
const getAllOrders = async (req, res) => {
  try {
    const { estado, desde, hasta, cliente_id, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT
        p.id,
        p.cliente_id,
        p.cliente_nombre,
        p.cliente_telefono,
        p.total,
        p.estado,
        p.fecha_pedido,
        COUNT(pi.id) as cantidad_productos,
        (SELECT COALESCE(SUM(v.monto_total), 0) FROM ventas v WHERE v.pedido_id = p.id) as total_pagado
      FROM pedidos p
      LEFT JOIN pedido_items pi ON p.id = pi.pedido_id
      WHERE 1=1
    `;

    const params = [];

    // Filtro por estado
    if (estado) {
      query += ` AND p.estado = ?`;
      params.push(estado);
    }

    if (cliente_id) {
      query += ` AND p.cliente_id = ?`;
      params.push(cliente_id);
    }

    // Filtro por rango de fechas (DATE() evita que un "hasta" de solo
    // fecha se interprete como medianoche y excluya pedidos de ese día)
    if (desde) {
      query += ` AND DATE(p.fecha_pedido) >= ?`;
      params.push(desde);
    }

    if (hasta) {
      query += ` AND DATE(p.fecha_pedido) <= ?`;
      params.push(hasta);
    }

    query += ` GROUP BY p.id ORDER BY p.fecha_pedido DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [orders] = await promisePool.query(query, params);

    // Contar total de pedidos (para paginación)
    let countQuery = `SELECT COUNT(DISTINCT p.id) as total FROM pedidos p WHERE 1=1`;
    const countParams = [];

    if (estado) {
      countQuery += ` AND p.estado = ?`;
      countParams.push(estado);
    }

    if (desde) {
      countQuery += ` AND DATE(p.fecha_pedido) >= ?`;
      countParams.push(desde);
    }

    if (hasta) {
      countQuery += ` AND DATE(p.fecha_pedido) <= ?`;
      countParams.push(hasta);
    }

    const [countResult] = await promisePool.query(countQuery, countParams);

    res.json({
      success: true,
      count: orders.length,
      total: countResult[0].total,
      data: orders
    });

  } catch (error) {
    console.error('Error obteniendo pedidos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener los pedidos',
      message: error.message
    });
  }
};

// ============================================
// OBTENER PEDIDO POR ID (con items completos)
// ============================================
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await promisePool.query(`
      SELECT 
        p.*,
        pi.id as item_id,
        pi.producto_id as item_producto_id,
        pi.descripcion as item_descripcion,
        pi.precio_unitario as item_precio_unitario,
        pi.cantidad as item_cantidad,
        pi.subtotal as item_subtotal,
        pr.titulo as producto_titulo,
        pr.slug as producto_slug
      FROM pedidos p
      LEFT JOIN pedido_items pi ON p.id = pi.pedido_id
      LEFT JOIN productos pr ON pi.producto_id = pr.id
      WHERE p.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pedido no encontrado'
      });
    }

    const order = structureOrderWithItems(rows);

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('Error obteniendo pedido:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener el pedido',
      message: error.message
    });
  }
};

// ============================================
// ACTUALIZAR ESTADO DEL PEDIDO
// El estado describe la etapa de producción/entrega (solicitado -> senado ->
// entregado), NO el estado de pago -- un pedido puede estar entregado sin
// estar pagado del todo. Al pasar a 'senado' se descuenta stock (bloqueando
// si no alcanza) y se registra la seña en `ventas`.
// ============================================
const updateOrderStatus = async (req, res) => {
  const connection = await promisePool.getConnection();

  try {
    const { id } = req.params;
    const { estado, monto_efectivo = 0, monto_transferencia = 0 } = req.body;

    // Validar estado (la conexión se libera una sola vez, en el finally)
    if (!['solicitado', 'senado', 'entregado'].includes(estado)) {
      return res.status(400).json({
        success: false,
        error: 'Estado inválido. Debe ser: solicitado, senado o entregado'
      });
    }

    let efectivoValidado = 0;
    let transferenciaValidada = 0;

    if (estado === 'senado') {
      efectivoValidado = parseMontoValidado(monto_efectivo);
      transferenciaValidada = parseMontoValidado(monto_transferencia);

      if (efectivoValidado === null || transferenciaValidada === null) {
        return res.status(400).json({
          success: false,
          error: 'Los montos deben ser números válidos y no negativos'
        });
      }

      if (efectivoValidado <= 0 && transferenciaValidada <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Para señar un pedido debe indicarse un monto en efectivo y/o transferencia'
        });
      }
    }

    await connection.beginTransaction();

    // Verificar que el pedido existe. FOR UPDATE bloquea la fila hasta que
    // esta transacción termine: si dos requests para señar el mismo pedido
    // llegan casi al mismo tiempo (doble-click, reintento de red), el
    // segundo espera a que el primero confirme (o falle) antes de leer el
    // estado, y ve el estado ya actualizado -- sin esto, ambos podrían leer
    // 'solicitado' a la vez y terminar señando el pedido dos veces.
    const [pedidos] = await connection.query(
      'SELECT id, estado FROM pedidos WHERE id = ? FOR UPDATE',
      [id]
    );

    if (pedidos.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        error: 'Pedido no encontrado'
      });
    }

    // Señar solo es válido desde 'solicitado' -- evita señar dos veces el
    // mismo pedido (doble descuento de stock, doble fila en `ventas`).
    if (estado === 'senado' && pedidos[0].estado !== 'solicitado') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: `No se puede señar: el pedido ya está en estado '${pedidos[0].estado}'`
      });
    }

    if (estado === 'senado') {
      const [items] = await connection.query(
        'SELECT producto_id, producto_variante_id, cantidad FROM pedido_items WHERE pedido_id = ?',
        [id]
      );

      // Productos que no controlan stock (ej. copias/impresiones) no
      // participan del descuento ni del movimiento. Un ítem con variante
      // siempre controla stock -- las variantes existen justamente para
      // llevar stock propio por medida.
      const productoIds = items.map((item) => item.producto_id);
      const controlaStockMap = await getControlaStockMap(connection, productoIds);
      // Un ítem puede ser un combo (precio_tipo='combo'): no tiene stock
      // propio, así que en vez del descuento simple se descuenta su receta
      // completa (ver aplicarMovimientoStockCombo).
      const precioTipoMap = await getPrecioTipoMap(connection, productoIds);

      // Descuento atómico (UPDATE ... WHERE cantidad >= ?, sin necesidad de
      // leer y restar en JS, evita condiciones de carrera) + registro en
      // movimientos_stock por cada ítem; si alguno falla, se junta en
      // sinStock y se hace rollback de todo abajo (incluye los movimientos
      // ya aplicados de ítems anteriores en este mismo pedido).
      const sinStock = [];
      for (const item of items) {
        if (precioTipoMap.get(item.producto_id) === 'combo') {
          const { ok } = await aplicarMovimientoStockCombo(connection, {
            comboProductoId: item.producto_id,
            cantidadCombos: item.cantidad,
            tipo: 'salida_pedido_senado',
            refColumn: 'pedido_id',
            refId: id,
          });

          if (!ok) {
            sinStock.push(item.producto_id);
          }
          continue;
        }

        if (!item.producto_variante_id && controlaStockMap.get(item.producto_id) === false) {
          continue;
        }

        const { ok } = await aplicarMovimientoStock(connection, {
          productoId: item.producto_id,
          varianteId: item.producto_variante_id,
          cantidad: item.cantidad,
          direccion: 'salida',
          tipo: 'salida_pedido_senado',
          refColumn: 'pedido_id',
          refId: id,
        });

        if (!ok) {
          sinStock.push(item.producto_variante_id || item.producto_id);
        }
      }

      if (sinStock.length > 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          error: 'Stock insuficiente para confirmar la seña',
          productos_sin_stock: sinStock
        });
      }

      await connection.query(
        `INSERT INTO ventas (pedido_id, tipo, monto_efectivo, monto_transferencia)
         VALUES (?, 'sena', ?, ?)`,
        [id, efectivoValidado, transferenciaValidada]
      );
    }

    // Actualizar estado y fecha correspondiente
    let updateQuery = 'UPDATE pedidos SET estado = ?';
    const params = [estado];

    if (estado === 'senado') {
      updateQuery += ', fecha_senado = NOW()';
    } else if (estado === 'entregado') {
      updateQuery += ', fecha_entregado = NOW()';
    }

    updateQuery += ' WHERE id = ?';
    params.push(id);

    await connection.query(updateQuery, params);

    await connection.commit();

    if (estado === 'senado') {
      const [[pedidoInfo]] = await promisePool.query(
        'SELECT cliente_nombre, cliente_telefono, total FROM pedidos WHERE id = ?',
        [id],
      );
      notificarN8N('pedido_senado', {
        pedido_id: parseInt(id),
        cliente_nombre: pedidoInfo.cliente_nombre,
        cliente_telefono: pedidoInfo.cliente_telefono,
        total: parseFloat(pedidoInfo.total),
        monto_efectivo: efectivoValidado,
        monto_transferencia: transferenciaValidada,
      });
    }

    res.json({
      success: true,
      message: `Pedido actualizado a estado: ${estado}`
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error actualizando estado:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar el estado del pedido',
      message: error.message
    });
  } finally {
    connection.release();
  }
};

// ============================================
// REGISTRAR UN PAGO ADICIONAL SOBRE UN PEDIDO YA SEÑADO
// No toca stock (ya se descontó al señar). No depende del estado del
// pedido más allá de que ya haya sido señado -- puede recibir pagos en
// estado 'senado' o 'entregado'.
// ============================================
const registerPayment = async (req, res) => {
  const connection = await promisePool.getConnection();

  try {
    const { id } = req.params;
    const { monto_efectivo = 0, monto_transferencia = 0 } = req.body;

    const efectivoValidado = parseMontoValidado(monto_efectivo);
    const transferenciaValidada = parseMontoValidado(monto_transferencia);

    if (efectivoValidado === null || transferenciaValidada === null) {
      return res.status(400).json({
        success: false,
        error: 'Los montos deben ser números válidos y no negativos'
      });
    }

    if (efectivoValidado <= 0 && transferenciaValidada <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Debe indicarse un monto en efectivo y/o transferencia'
      });
    }

    await connection.beginTransaction();

    // FOR UPDATE: mismo motivo que en updateOrderStatus -- si este pago y
    // una transición de estado (o otro pago) llegan casi al mismo tiempo
    // para el mismo pedido, se serializan en vez de leer el estado a la vez.
    const [pedidos] = await connection.query(
      "SELECT id, estado FROM pedidos WHERE id = ? FOR UPDATE",
      [id]
    );

    if (pedidos.length === 0 || !['senado', 'entregado'].includes(pedidos[0].estado)) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        error: 'Pedido no encontrado o todavía no fue señado'
      });
    }

    const [result] = await connection.query(
      `INSERT INTO ventas (pedido_id, tipo, monto_efectivo, monto_transferencia)
       VALUES (?, 'pago_final', ?, ?)`,
      [id, efectivoValidado, transferenciaValidada]
    );

    await connection.commit();

    const [[pedidoInfo]] = await promisePool.query(
      'SELECT cliente_nombre, cliente_telefono FROM pedidos WHERE id = ?',
      [id],
    );
    notificarN8N('pedido_pago_final', {
      pedido_id: parseInt(id),
      cliente_nombre: pedidoInfo.cliente_nombre,
      cliente_telefono: pedidoInfo.cliente_telefono,
      monto_efectivo: efectivoValidado,
      monto_transferencia: transferenciaValidada,
    });

    res.status(201).json({
      success: true,
      message: 'Pago registrado exitosamente',
      data: { id: result.insertId }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error registrando pago:', error);
    res.status(500).json({
      success: false,
      error: 'Error al registrar el pago',
      message: error.message
    });
  } finally {
    connection.release();
  }
};

// ============================================
// ACTUALIZAR PEDIDO COMPLETO
// ============================================
const updateOrder = async (req, res) => {
  const connection = await promisePool.getConnection();
  
  try {
    const { id } = req.params;
    const {
      cliente_nombre,
      cliente_telefono,
      cliente_email,
      descuento,
      notas
    } = req.body;

    await connection.beginTransaction();

    // Verificar que el pedido existe. FOR UPDATE por consistencia con el
    // resto de los endpoints que tocan `pedidos` (updateOrderStatus,
    // registerPayment).
    const [pedidos] = await connection.query(
      'SELECT id FROM pedidos WHERE id = ? FOR UPDATE',
      [id]
    );

    if (pedidos.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        error: 'Pedido no encontrado'
      });
    }

    // Construir query de actualización dinámico
    const updates = [];
    const params = [];

    if (cliente_nombre !== undefined) {
      updates.push('cliente_nombre = ?');
      params.push(cliente_nombre);
    }

    if (cliente_telefono !== undefined) {
      updates.push('cliente_telefono = ?');
      params.push(cliente_telefono);
    }

    if (cliente_email !== undefined) {
      updates.push('cliente_email = ?');
      params.push(cliente_email);
    }

    if (descuento !== undefined) {
      updates.push('descuento = ?');
      params.push(descuento);
      
      // Recalcular total
      const [pedidoActual] = await connection.query(
        'SELECT subtotal FROM pedidos WHERE id = ?',
        [id]
      );
      const nuevoTotal = parseFloat(pedidoActual[0].subtotal) - parseFloat(descuento);
      updates.push('total = ?');
      params.push(nuevoTotal);
    }

    // monto_sena a propósito NO es editable acá: es un campo legado, la
    // fuente de verdad del monto pagado es `ventas` (ver updateOrderStatus
    // y registerPayment).
    if (notas !== undefined) {
      updates.push('notas = ?');
      params.push(notas);
    }

    if (updates.length > 0) {
      const updateQuery = `UPDATE pedidos SET ${updates.join(', ')} WHERE id = ?`;
      params.push(id);
      await connection.query(updateQuery, params);
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Pedido actualizado exitosamente'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error actualizando pedido:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar el pedido',
      message: error.message
    });
  } finally {
    connection.release();
  }
};

// ============================================
// ELIMINAR PEDIDO
// ============================================
const deleteOrder = async (req, res) => {
  const connection = await promisePool.getConnection();

  try {
    const { id } = req.params;

    await connection.beginTransaction();

    // FOR UPDATE: evita que este delete se cruce con un updateOrderStatus
    // concurrente sobre el mismo pedido (ej. borrarlo justo mientras se lo
    // está señando, dejando una fila de `ventas`/movimientos_stock huérfana).
    const [pedidos] = await connection.query(
      'SELECT id FROM pedidos WHERE id = ? FOR UPDATE',
      [id]
    );

    if (pedidos.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        error: 'Pedido no encontrado'
      });
    }

    // Eliminar pedido (los items se eliminan por CASCADE)
    await connection.query('DELETE FROM pedidos WHERE id = ?', [id]);

    await connection.commit();

    res.json({
      success: true,
      message: 'Pedido eliminado exitosamente'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error eliminando pedido:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar el pedido',
      message: error.message
    });
  } finally {
    connection.release();
  }
};

// ============================================
// OBTENER ESTADÍSTICAS DE PEDIDOS
// ============================================
const getOrderStats = async (req, res) => {
  try {
    // Contar pedidos por estado
    const [estadosCount] = await promisePool.query(`
      SELECT estado, COUNT(*) as cantidad
      FROM pedidos
      GROUP BY estado
    `);

    // Total de pedidos
    const [totalPedidos] = await promisePool.query(
      'SELECT COUNT(*) as total FROM pedidos'
    );

    // Total recaudado: se calcula sobre `ventas` (fuente de verdad), no
    // sobre el campo legado pedidos.monto_sena.
    const [totalRecaudado] = await promisePool.query(`
      SELECT
        SUM(CASE WHEN v.tipo = 'sena' THEN v.monto_total ELSE 0 END) as total_senas,
        SUM(v.monto_total) as total_pagado_pedidos
      FROM ventas v
      WHERE v.pedido_id IS NOT NULL
    `);

    const [totalValorPedidos] = await promisePool.query(
      'SELECT SUM(total) as total_ventas FROM pedidos'
    );

    res.json({
      success: true,
      data: {
        total_pedidos: totalPedidos[0].total,
        por_estado: estadosCount,
        total_senas: parseFloat(totalRecaudado[0].total_senas || 0),
        total_pagado_pedidos: parseFloat(totalRecaudado[0].total_pagado_pedidos || 0),
        total_ventas: parseFloat(totalValorPedidos[0].total_ventas || 0)
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas',
      message: error.message
    });
  }
};

// ============================================
// EXPORTAR
// ============================================
module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  registerPayment,
  updateOrder,
  deleteOrder,
  getOrderStats
};