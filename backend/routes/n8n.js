const express = require("express");
const router = express.Router();
const { requireApiKey } = require("../middleware/apiKey");
const {
  getResumenSemanal,
  getPedidosPagoPendiente,
  getPedidosEstancados,
} = require("../controllers/n8nController");

// Todas protegidas con API key (uso máquina-a-máquina, n8n) -- mismo patrón
// que /api/stock/bajo, nunca JWT humano.
router.get("/resumen-semanal", requireApiKey, getResumenSemanal);
router.get("/pedidos-pago-pendiente", requireApiKey, getPedidosPagoPendiente);
router.get("/pedidos-estancados", requireApiKey, getPedidosEstancados);

module.exports = router;
