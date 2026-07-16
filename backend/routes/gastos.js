const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const {
  getGastos,
  getGastoById,
  createGasto,
  updateGasto,
  deleteGasto,
} = require("../controllers/gastosController");

// ============================================
// TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN (uso humano, JWT normal)
// ============================================

// Listar gastos (filtros: desde, hasta)
router.get("/", authenticateToken, getGastos);

// Obtener gasto por ID
router.get("/:id", authenticateToken, getGastoById);

// Crear gasto
router.post("/", authenticateToken, createGasto);

// Corregir un gasto mal cargado
router.put("/:id", authenticateToken, updateGasto);

// Eliminar gasto
router.delete("/:id", authenticateToken, deleteGasto);

module.exports = router;
