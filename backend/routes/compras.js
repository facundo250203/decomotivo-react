const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const {
  getCompras,
  getCompraById,
  createCompra,
} = require("../controllers/comprasController");

router.get("/", authenticateToken, getCompras);
router.get("/:id", authenticateToken, getCompraById);
router.post("/", authenticateToken, createCompra);

module.exports = router;
