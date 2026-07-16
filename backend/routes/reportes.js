const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { getResumen } = require("../controllers/reportesController");

router.get("/resumen", authenticateToken, getResumen);

module.exports = router;
