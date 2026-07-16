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

module.exports = router;
