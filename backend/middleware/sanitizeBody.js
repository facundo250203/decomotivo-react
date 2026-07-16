// Filtra req.body a solo los campos permitidos, antes de que llegue al
// controller. Sin esto, un UPDATE armado dinámicamente desde
// Object.keys(req.body) deja que cualquier campo del body se convierta en
// una columna de SQL a reescribir (ej. `activo`, `id`) — sin importar si la
// llamada viene del frontend admin o de una herramienta como curl/Postman
// directo contra la API. El frontend ya manda solo los campos correctos,
// pero la API en sí no debe depender de eso para estar segura.
//
// CONVENCIÓN: cualquier endpoint nuevo que arme un UPDATE dinámico desde
// Object.keys(req.body) (en vez de columnas explícitas) DEBE pasar por este
// middleware con su propia lista de campos permitidos -- ya se encontró y
// corrigió este mismo hueco por separado en proveedores, clientes y
// productos; no repetirlo en el próximo endpoint que use ese patrón.
const sanitizeBody = (camposPermitidos) => (req, res, next) => {
  const original = req.body || {};
  req.body = Object.fromEntries(
    Object.entries(original).filter(([campo]) => camposPermitidos.includes(campo)),
  );
  next();
};

module.exports = sanitizeBody;
