const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const {
  getVentas,
  getVentaById,
  createVentaDirecta,
  updateVentaDirecta,
  deleteVentaDirecta,
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

// Editar venta directa (alcance limitado -- ver comentario en el controller)
router.put("/:id", authenticateToken, updateVentaDirecta);

// Eliminar venta directa (revierte stock y cuenta corriente)
router.delete("/:id", authenticateToken, deleteVentaDirecta);

module.exports = router;
