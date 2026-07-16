// Convierte a número validado; null si el valor no es un número finito >= 0.
// Sin esto, un monto no numérico (ej. "abc") pasa la validación de "> 0"
// porque NaN <= 0 da false, y termina rompiendo el INSERT en la base con un
// error crudo en vez de un 400 claro.
const parseMontoValidado = (valor) => {
  if (valor === undefined || valor === null || valor === "") return 0;
  const parsed = parseFloat(valor);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

// Compara un monto cargado contra un total esperado, con tolerancia de un
// centavo por redondeo de punto flotante. Genérico a propósito: no asume
// qué componentes se sumaron para armar montoCargado (efectivo+
// transferencia en pedidos/pagos sueltos, o efectivo+transferencia+cuenta
// corriente en ventasController.createVentaDirecta) -- cada caller arma esa
// suma según sus propias formas de pago.
const montoCoincide = (montoCargado, montoEsperado, tolerancia = 0.01) =>
  Math.abs(montoCargado - montoEsperado) <= tolerancia;

module.exports = { parseMontoValidado, montoCoincide };
