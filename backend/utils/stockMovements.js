// Mapa producto_id -> controla_stock. Los productos con controla_stock=false
// (ej. fotocopias/impresiones) no participan de ningún movimiento de stock.
const getControlaStockMap = async (connection, productoIds) => {
  if (productoIds.length === 0) return new Map();

  const [rows] = await connection.query(
    `SELECT id, controla_stock FROM productos WHERE id IN (${productoIds.map(() => "?").join(",")})`,
    productoIds,
  );

  return new Map(rows.map((row) => [row.id, Boolean(row.controla_stock)]));
};

// Mapa producto_id -> precio_tipo. Quien llama a aplicarMovimientoStock
// necesita saber, antes de tocar cantidad, si el producto es un combo
// (receta sin stock propio) para desviar a aplicarMovimientoStockCombo en
// vez del UPDATE simple. Consulta separada de getControlaStockMap (en vez de
// agregarle la columna) porque no todos los llamadores necesitan precio_tipo
// y así no se cambia la forma del Map que ya consume el código existente.
const getPrecioTipoMap = async (connection, productoIds) => {
  if (productoIds.length === 0) return new Map();

  const [rows] = await connection.query(
    `SELECT id, precio_tipo FROM productos WHERE id IN (${productoIds.map(() => "?").join(",")})`,
    productoIds,
  );

  return new Map(rows.map((row) => [row.id, row.precio_tipo]));
};

// Receta de un combo: por cada componente, cuánto stock tiene disponible
// ahora mismo (de producto_variantes.cantidad si el componente es una
// variante puntual, si no de productos.cantidad) y cuánto necesita el combo
// de ese componente por unidad vendida.
const getComboRecipe = async (connection, comboProductoId) => {
  const [rows] = await connection.query(
    `SELECT
      pci.componente_producto_id as componenteProductoId,
      pci.componente_variante_id as componenteVarianteId,
      pci.cantidad,
      pr.titulo as nombreComponente,
      COALESCE(pv.cantidad, pr.cantidad) as stockDisponible
     FROM producto_combo_items pci
     JOIN productos pr ON pr.id = pci.componente_producto_id
     LEFT JOIN producto_variantes pv ON pv.id = pci.componente_variante_id
     WHERE pci.combo_producto_id = ?`,
    [comboProductoId],
  );

  return rows.map((row) => ({
    componenteProductoId: row.componenteProductoId,
    componenteVarianteId: row.componenteVarianteId,
    cantidad: row.cantidad,
    nombreComponente: row.nombreComponente,
    stockDisponible: row.stockDisponible,
  }));
};

// Stock disponible de un combo = el mínimo, entre todos sus componentes, de
// cuántos combos completos alcanza a armar ese componente con el stock que
// tiene ahora (floor(stockDisponible / cantidadRequerida)). Sin items en la
// receta no hay combo que armar -- 0, no Infinity.
const calcularStockCombo = async (connection, comboProductoId) => {
  const receta = await getComboRecipe(connection, comboProductoId);
  if (receta.length === 0) return 0;

  return Math.min(
    ...receta.map((item) => Math.floor(item.stockDisponible / item.cantidad)),
  );
};

// Aplica un movimiento de stock a UN producto o, si se pasa `varianteId`,
// a esa variante puntual (salida con guarda atómica anti-condición-de-
// carrera, o entrada sin guarda porque solo suma) y deja su registro en
// movimientos_stock. `refColumn` es el nombre de la columna de referencia
// en movimientos_stock ('pedido_id' | 'venta_id' | 'compra_id'), siempre
// hardcodeado por quien llama, nunca desde el request. `tabla` sale de si
// varianteId vino o no -- nunca de un valor del request -- así que no hay
// riesgo de inyección al interpolarla.
//
// Devuelve { ok: false } si es una salida y no había stock suficiente (no
// se descontó nada); { ok: true } si se aplicó y se registró el movimiento.
const aplicarMovimientoStock = async (
  connection,
  { productoId, varianteId, cantidad, direccion, tipo, refColumn, refId },
) => {
  const tabla = varianteId ? "producto_variantes" : "productos";
  const idParaUpdate = varianteId || productoId;

  if (direccion === "salida") {
    const [result] = await connection.query(
      `UPDATE ${tabla} SET cantidad = cantidad - ? WHERE id = ? AND cantidad >= ?`,
      [cantidad, idParaUpdate, cantidad],
    );
    if (result.affectedRows === 0) {
      return { ok: false };
    }
  } else {
    await connection.query(
      `UPDATE ${tabla} SET cantidad = cantidad + ? WHERE id = ?`,
      [cantidad, idParaUpdate],
    );
  }

  await connection.query(
    `INSERT INTO movimientos_stock (producto_id, producto_variante_id, tipo, cantidad, ${refColumn}) VALUES (?, ?, ?, ?, ?)`,
    [productoId, varianteId || null, tipo, cantidad, refId],
  );

  return { ok: true };
};

// Hermana de aplicarMovimientoStock para cuando el producto vendido es un
// combo (precio_tipo='combo'): en vez de tocar un contador propio (el combo
// no tiene), recorre su receta (getComboRecipe) y aplica, por cada
// componente, el mismo UPDATE atómico "cantidad = cantidad - ? WHERE
// cantidad >= ?" multiplicando la cantidad requerida por la cantidad de
// combos vendidos -- y deja una fila en movimientos_stock POR COMPONENTE con
// el mismo refColumn/refId que se le hubiera puesto al combo, para que el
// movimiento quede trazado contra el mismo pedido/venta.
//
// Solo soporta direccion='salida' (vender un combo): no hay caso de negocio
// hoy para "entrada de combo" (revertir/recibir combos no vendidos vueltos
// a stock no aplica porque el combo no tiene stock propio que reponer).
//
// Si CUALQUIER componente no tiene stock suficiente, corta en el momento y
// devuelve { ok: false } sin haber hecho commit -- como esto corre dentro de
// la transacción del caller (ver orderController/ventasController), ese
// { ok: false } dispara el rollback de todo el pedido/venta, incluyendo los
// UPDATEs de componentes anteriores ya aplicados en este mismo loop.
const aplicarMovimientoStockCombo = async (
  connection,
  { comboProductoId, cantidadCombos, tipo, refColumn, refId },
) => {
  const receta = await getComboRecipe(connection, comboProductoId);

  for (const item of receta) {
    const { ok } = await aplicarMovimientoStock(connection, {
      productoId: item.componenteProductoId,
      varianteId: item.componenteVarianteId,
      cantidad: item.cantidad * cantidadCombos,
      direccion: "salida",
      tipo,
      refColumn,
      refId,
    });

    if (!ok) {
      return { ok: false };
    }
  }

  return { ok: true };
};

module.exports = {
  getControlaStockMap,
  getPrecioTipoMap,
  getComboRecipe,
  calcularStockCombo,
  aplicarMovimientoStock,
  aplicarMovimientoStockCombo,
};
