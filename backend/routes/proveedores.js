const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const sanitizeBody = require("../middleware/sanitizeBody");
const {
  getAllProveedores,
  getProveedorById,
  createProveedor,
  updateProveedor,
  deleteProveedor,
  CAMPOS_EDITABLES_PROVEEDOR,
} = require("../controllers/proveedoresController");

router.get("/", authenticateToken, getAllProveedores);
router.get("/:id", authenticateToken, getProveedorById);
router.post("/", authenticateToken, createProveedor);
router.put(
  "/:id",
  authenticateToken,
  sanitizeBody(CAMPOS_EDITABLES_PROVEEDOR),
  updateProveedor,
);
router.delete("/:id", authenticateToken, deleteProveedor);

module.exports = router;
