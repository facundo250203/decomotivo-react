const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const sanitizeBody = require("../middleware/sanitizeBody");
const {
  getAllClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente,
  getCuentaCorriente,
  registrarPagoCuentaCorriente,
  CAMPOS_EDITABLES_CLIENTE,
} = require("../controllers/clientesController");

router.get("/", authenticateToken, getAllClientes);
router.get("/:id", authenticateToken, getClienteById);
router.post("/", authenticateToken, createCliente);
router.put(
  "/:id",
  authenticateToken,
  sanitizeBody(CAMPOS_EDITABLES_CLIENTE),
  updateCliente,
);
router.delete("/:id", authenticateToken, deleteCliente);

// Cuenta corriente (saldo + historial de movimientos)
router.get("/:id/cuenta-corriente", authenticateToken, getCuentaCorriente);

// Registrar un pago suelto del cliente contra su deuda
router.post("/:id/pagos", authenticateToken, registrarPagoCuentaCorriente);

module.exports = router;
