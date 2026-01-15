// backend/controllers/orderController.js
const { promisePool } = require('../config/database');

// ============================================
// HELPER: Estructurar pedido con sus items
// ============================================
const structureOrderWithItems = (rows) => {
  if (rows.length === 0) return null;

  const order = {
    id: rows[0].id,
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
      cliente_nombre,
      cliente_telefono,
      cliente_email,
      items, // Array de { producto_id, descripcion, precio_unitario, cantidad }
      descuento = 0,
      monto_sena = 0,
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

    // Insertar pedido
    const [result] = await connection.query(
      `INSERT INTO pedidos (
        cliente_nombre, cliente_telefono, cliente_email,
        subtotal, descuento, total, monto_sena, notas
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cliente_nombre,
        cliente_telefono || null,
        cliente_email || null,
        subtotal,
        descuento,
        total,
        monto_sena,
        notas || null
      ]
    );

    const pedidoId = result.insertId;

    // Insertar items del pedido
    for (const item of items) {
      const itemSubtotal = parseFloat(item.precio_unitario) * parseInt(item.cantidad);
      
      await connection.query(
        `INSERT INTO pedido_items (
          pedido_id, producto_id, descripcion,
          precio_unitario, cantidad, subtotal
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          pedidoId,
          item.producto_id,
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
    const { estado, desde, hasta, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        p.id,
        p.cliente_nombre,
        p.cliente_telefono,
        p.total,
        p.monto_sena,
        p.estado,
        p.fecha_pedido,
        COUNT(pi.id) as cantidad_productos
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

    // Filtro por rango de fechas
    if (desde) {
      query += ` AND p.fecha_pedido >= ?`;
      params.push(desde);
    }

    if (hasta) {
      query += ` AND p.fecha_pedido <= ?`;
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
      countQuery += ` AND p.fecha_pedido >= ?`;
      countParams.push(desde);
    }

    if (hasta) {
      countQuery += ` AND p.fecha_pedido <= ?`;
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
// ============================================
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    // Validar estado
    if (!['solicitado', 'senado', 'entregado'].includes(estado)) {
      return res.status(400).json({
        success: false,
        error: 'Estado inválido. Debe ser: solicitado, senado o entregado'
      });
    }

    // Verificar que el pedido existe
    const [pedidos] = await promisePool.query(
      'SELECT id FROM pedidos WHERE id = ?',
      [id]
    );

    if (pedidos.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pedido no encontrado'
      });
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

    await promisePool.query(updateQuery, params);

    res.json({
      success: true,
      message: `Pedido actualizado a estado: ${estado}`
    });

  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar el estado del pedido',
      message: error.message
    });
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
      monto_sena,
      notas
    } = req.body;

    // Verificar que el pedido existe
    const [pedidos] = await connection.query(
      'SELECT id FROM pedidos WHERE id = ?',
      [id]
    );

    if (pedidos.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pedido no encontrado'
      });
    }

    await connection.beginTransaction();

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

    if (monto_sena !== undefined) {
      updates.push('monto_sena = ?');
      params.push(monto_sena);
    }

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
  try {
    const { id } = req.params;

    // Verificar que el pedido existe
    const [pedidos] = await promisePool.query(
      'SELECT id FROM pedidos WHERE id = ?',
      [id]
    );

    if (pedidos.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pedido no encontrado'
      });
    }

    // Eliminar pedido (los items se eliminan por CASCADE)
    await promisePool.query('DELETE FROM pedidos WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Pedido eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando pedido:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar el pedido',
      message: error.message
    });
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

    // Total recaudado
    const [totalRecaudado] = await promisePool.query(
      'SELECT SUM(monto_sena) as total_senas, SUM(total) as total_ventas FROM pedidos'
    );

    res.json({
      success: true,
      data: {
        total_pedidos: totalPedidos[0].total,
        por_estado: estadosCount,
        total_senas: parseFloat(totalRecaudado[0].total_senas || 0),
        total_ventas: parseFloat(totalRecaudado[0].total_ventas || 0)
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
  updateOrder,
  deleteOrder,
  getOrderStats
};