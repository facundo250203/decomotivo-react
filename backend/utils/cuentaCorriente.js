// Saldo > 0 = el cliente debe esa plata (fiado pendiente).
// Saldo < 0 = el cliente tiene saldo a favor por ese valor absoluto.
// Se calcula sumando movimientos_cuenta_corriente en vez de guardar un
// total mutable, mismo patrón que cajaController usa para el saldo de caja
// (ver migración 023 para el detalle de qué tipo suma y cuál resta).
// 'pago_cliente' y 'vuelto_a_favor' (ver migración 032) comparten el bucket
// "resta": los dos le dan crédito al cliente, uno por un pago suelto contra
// su deuda y el otro por vuelto de una venta puntual que no retiró -- el
// CASE de abajo no necesita distinguirlos porque a los fines del saldo
// pesan igual, solo cambia cómo y cuándo se genera cada uno.
const calcularSaldoCliente = async (executor, clienteId) => {
  const [rows] = await executor.query(
    `SELECT COALESCE(SUM(
       CASE WHEN tipo IN ('venta_fiado', 'saldo_a_favor_aplicado') THEN monto ELSE -monto END
     ), 0) as saldo
     FROM movimientos_cuenta_corriente WHERE cliente_id = ?`,
    [clienteId],
  );
  return parseFloat(rows[0].saldo);
};

const registrarMovimientoCuentaCorriente = async (
  executor,
  { clienteId, tipo, monto, ventaId = null, notas = null },
) => {
  await executor.query(
    `INSERT INTO movimientos_cuenta_corriente (cliente_id, tipo, monto, venta_id, notas)
     VALUES (?, ?, ?, ?, ?)`,
    [clienteId, tipo, monto, ventaId, notas],
  );
};

module.exports = { calcularSaldoCliente, registrarMovimientoCuentaCorriente };
