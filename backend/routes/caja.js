const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const {
  getSaldoCaja,
  getCierresCaja,
  getUltimoCierre,
  crearCierre,
} = require("../controllers/cajaController");

router.get("/saldo", authenticateToken, getSaldoCaja);
router.get("/cierres", authenticateToken, getCierresCaja);
router.get("/cierres/ultimo", authenticateToken, getUltimoCierre);
router.post("/cierres", authenticateToken, crearCierre);

module.exports = router;
