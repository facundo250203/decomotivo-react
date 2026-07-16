const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const {
  getVentas,
  getVentaById,
  createVentaDirecta,
  getResumenDiario,
} = require("../controllers/ventasController");

// ============================================
// TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN (uso humano, JWT normal)
// ============================================

// Resumen diario de caja
router.get("/resumen", authenticateToken, getResumenDiario);

// Listar ventas (filtros: desde, hasta, pedido_id)
router.get("/", authenticateToken, getVentas);

// Obtener venta por ID
router.get("/:id", authenticateToken, getVentaById);

// Crear venta directa de mostrador
router.post("/", authenticateToken, createVentaDirecta);

module.exports = router;
