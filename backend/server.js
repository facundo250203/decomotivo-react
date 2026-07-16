// backend/server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

// Rutas
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const categoryRoutes = require("./routes/categories");
const adminRoutes = require("./routes/admin");
const orderRoutes = require("./routes/orders");
const stockRoutes = require("./routes/stock");
const ventasRoutes = require("./routes/ventas");
const proveedoresRoutes = require("./routes/proveedores");
const comprasRoutes = require("./routes/compras");
const cajaRoutes = require("./routes/caja");
const clientesRoutes = require("./routes/clientes");
const gastosRoutes = require("./routes/gastos");
const reportesRoutes = require("./routes/reportes");
const n8nRoutes = require("./routes/n8n");

const app = express();

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// RUTAS
// ============================================
app.use("/api/auth", authRoutes);
app.use("/api/productos", productRoutes);
app.use("/api/categorias", categoryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/pedidos", orderRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/ventas", ventasRoutes);
app.use("/api/proveedores", proveedoresRoutes);
app.use("/api/compras", comprasRoutes);
app.use("/api/caja", cajaRoutes);
app.use("/api/clientes", clientesRoutes);
app.use("/api/gastos", gastosRoutes);
app.use("/api/reportes", reportesRoutes);
app.use("/api/n8n", n8nRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "DecoMotivo API funcionando" });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Error interno del servidor" });
});

// ============================================
// INICIAR SERVIDOR (solo en local)
// ============================================
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
}

// ============================================
// EXPORTAR para Vercel ← ESTO ES LO CLAVE
// ============================================
module.exports = app;