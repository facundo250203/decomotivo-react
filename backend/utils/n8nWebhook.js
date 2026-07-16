// Aviso saliente hacia N8N (fire-and-forget): un solo webhook, N8N enruta
// internamente según "evento" (Switch/IF node), en vez de mantener una URL
// distinta por cada automatización acá.
//
// NUNCA debe romper el flujo principal: si N8N_WEBHOOK_URL no está
// configurada, o si el POST falla (n8n caído, red, etc.), esto solo lo
// registra en consola y sigue. Los llamadores no deben esperar (await) a
// que termine -- por diseño no bloquea la respuesta al cliente.
const notificarN8N = (evento, datos) => {
  const url = process.env.N8N_WEBHOOK_URL;

  if (!url) {
    console.log(`[n8n] N8N_WEBHOOK_URL no configurada, se omite el aviso "${evento}".`);
    return;
  }

  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      evento,
      datos,
      timestamp: new Date().toISOString(),
    }),
  }).catch((error) => {
    console.error(`[n8n] Error avisando el evento "${evento}":`, error.message);
  });
};

module.exports = { notificarN8N };
