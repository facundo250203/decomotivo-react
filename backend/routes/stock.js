const express = require("express");
const router = express.Router();
const { requireApiKey } = require("../middleware/apiKey");
const { getLowStockProducts } = require("../controllers/stockController");

// GET /api/stock/bajo — protegido con API key (uso máquina-a-máquina, n8n)
router.get("/bajo", requireApiKey, getLowStockProducts);

module.exports = router;
