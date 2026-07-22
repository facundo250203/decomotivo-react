const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const {
  getSaldoCaja,
  getCierresCaja,
  getUltimoCierre,
  crearCierre,
  updateUltimoCierre,
} = require("../controllers/cajaController");

router.get("/saldo", authenticateToken, getSaldoCaja);
router.get("/cierres", authenticateToken, getCierresCaja);
router.get("/cierres/ultimo", authenticateToken, getUltimoCierre);
router.post("/cierres", authenticateToken, crearCierre);
// Solo el cierre más reciente es editable (ver comentario en el controller).
router.put("/cierres/:id", authenticateToken, updateUltimoCierre);

module.exports = router;
