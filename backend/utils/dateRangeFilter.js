// Agrega el filtro de rango de fechas "desde"/"hasta" a una query armada a
// mano (ventas, compras, gastos). Usa DATE(columna) en vez de comparar
// contra la columna DATETIME completa: un "hasta" de solo fecha (ej.
// 2026-07-03) MySQL lo interpreta como medianoche, así que sin esto se
// excluyen los registros cargados más tarde ese mismo día.
//
// `columna` siempre viene hardcodeada desde el controller (nunca del
// request), así que no hay riesgo de inyección al interpolarla.
const applyDateRangeFilter = (query, params, { desde, hasta }, columna = "fecha") => {
  let resultado = query;

  if (desde) {
    resultado += ` AND DATE(${columna}) >= ?`;
    params.push(desde);
  }

  if (hasta) {
    resultado += ` AND DATE(${columna}) <= ?`;
    params.push(hasta);
  }

  return resultado;
};

module.exports = { applyDateRangeFilter };
