// Normaliza un valor de checkbox/flag a 0 o 1 para guardar en una columna
// TINYINT. Acepta boolean true, y las representaciones más comunes que
// puede mandar un cliente HTTP (string "true", número/string 1) -- antes
// cada flag de producto (activo, destacado, personalizable, visible_publico)
// solo aceptaba `true`/"true" literal y trataba cualquier otra cosa (ej. 1
// numérico) como falso en silencio.
const VALORES_VERDADEROS = [true, "true", 1, "1"];

const parseBooleano = (valor, valoresVerdaderosExtra = []) =>
  VALORES_VERDADEROS.includes(valor) || valoresVerdaderosExtra.includes(valor)
    ? 1
    : 0;

module.exports = { parseBooleano };
