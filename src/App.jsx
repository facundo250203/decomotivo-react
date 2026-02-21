// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

// Context
import { AuthProvider } from "./context/AuthContext";

// Layouts y componentes comunes
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import ProtectedRoute from "./components/admin/ProtectedRoute";

// Páginas públicas
import Inicio from "./pages/Inicio";
import Productos from "./pages/Productos";
import Contacto from "./pages/Contacto";
import Tablas from "./pages/Tablas";
import MatesVasos from "./pages/MatesVasos";
import MDF from "./pages/MDF";
import Otros from "./pages/Otros";
import Combos from "./pages/Combos";
import Decoraciones from "./pages/Decoraciones";
import FAQ from "./pages/FAQ";
import Gracias from "./pages/Gracias";
import NotFound from "./pages/NotFound";

// Páginas de admin
import Login from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import ProductList from "./pages/admin/ProductList";
import ProductForm from "./pages/admin/ProductForm";
import ProductDetail from "./pages/admin/ProductDetail";
import PedidosList from "./pages/admin/PedidosList";
import PedidoDetalle from "./pages/admin/PedidoDetalle";
import PedidoForm from "./pages/admin/PedidoForm";
import ProductCategory from './components/ProductCategory';
import { ToastProvider } from "./context/ToastContext";

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <Routes>
              {/* ============================================ */}
              {/* RUTAS DE ADMIN (sin Header ni Footer) */}
              {/* ============================================ */}

              {/* Login (público, sin autenticación) */}
              <Route path="/admin/login" element={<Login />} />

              {/* Dashboard (protegido) */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* ========== PRODUCTOS ========== */}

              {/* Lista de Productos (protegido) */}
              <Route
                path="/admin/productos"
                element={
                  <ProtectedRoute>
                    <ProductList />
                  </ProtectedRoute>
                }
              />

              {/* Crear Producto (protegido) */}
              <Route
                path="/admin/productos/nuevo"
                element={
                  <ProtectedRoute>
                    <ProductForm />
                  </ProtectedRoute>
                }
              />

              {/* Editar Producto (protegido) */}
              <Route
                path="/admin/productos/editar/:id"
                element={
                  <ProtectedRoute>
                    <ProductForm />
                  </ProtectedRoute>
                }
              />

              {/* Ver Detalle de Producto (protegido) */}
              <Route
                path="/admin/productos/:id"
                element={
                  <ProtectedRoute>
                    <ProductDetail />
                  </ProtectedRoute>
                }
              />

              {/* ========== PEDIDOS ========== */}

              {/* Lista de Pedidos (protegido) */}
              <Route
                path="/admin/pedidos"
                element={
                  <ProtectedRoute>
                    <PedidosList />
                  </ProtectedRoute>
                }
              />

              {/* Crear Pedido (protegido) */}
              <Route
                path="/admin/pedidos/nuevo"
                element={
                  <ProtectedRoute>
                    <PedidoForm />
                  </ProtectedRoute>
                }
              />

              {/* Ver Detalle de Pedido (protegido) */}
              <Route
                path="/admin/pedidos/:id"
                element={
                  <ProtectedRoute>
                    <PedidoDetalle />
                  </ProtectedRoute>
                }
              />

              {/* Editar Pedido (protegido) */}
              <Route
                path="/admin/pedidos/editar/:id"
                element={
                  <ProtectedRoute>
                    <PedidoForm />
                  </ProtectedRoute>
                }
              />

              {/* ============================================ */}
              {/* RUTAS PÚBLICAS (con Header y Footer) */}
              {/* ============================================ */}

              {/* Página de inicio - RUTA RAÍZ */}
              <Route
                path="/"
                element={
                  <>
                    <Header />
                    <main className="min-h-screen">
                      <Inicio />
                    </main>
                    <Footer />
                  </>
                }
              />

              {/* Página de inicio - RUTA /inicio (para el menú) */}
              <Route
                path="/inicio"
                element={
                  <>
                    <Header />
                    <main className="min-h-screen">
                      <Inicio />
                    </main>
                    <Footer />
                  </>
                }
              />

              {/* Página de productos (todos) */}
              <Route
                path="/productos"
                element={
                  <>
                    <Header />
                    <main className="min-h-screen">
                      <Productos />
                    </main>
                    <Footer />
                  </>
                }
              />

              {/* Páginas de categorías */}
              <Route
                path="/tablas"
                element={
                  <>
                    <Header />
                    <main className="min-h-screen">
                      <Tablas />
                    </main>
                    <Footer />
                  </>
                }
              />

              <Route
                path="/mates-vasos"
                element={
                  <>
                    <Header />
                    <main className="min-h-screen">
                      <MatesVasos />
                    </main>
                    <Footer />
                  </>
                }
              />

              <Route
                path="/mdf"
                element={
                  <>
                    <Header />
                    <main className="min-h-screen">
                      <MDF />
                    </main>
                    <Footer />
                  </>
                }
              />

              <Route
                path="/otros"
                element={
                  <>
                    <Header />
                    <main className="min-h-screen">
                      <Otros />
                    </main>
                    <Footer />
                  </>
                }
              />

              <Route
                path="/combos"
                element={
                  <>
                    <Header />
                    <main className="min-h-screen">
                      <Combos />
                    </main>
                    <Footer />
                  </>
                }
              />

              <Route
                path="/decoraciones"
                element={
                  <>
                    <Header />
                    <main className="min-h-screen">
                      <Decoraciones />
                    </main>
                    <Footer />
                  </>
                }
              />
              {/* Libreria */}
              <Route
                path="/libreria"
                element={
                  <>
                    <Header />
                    <main className="min-h-screen">
                      <ProductCategory categorySlug="libreria" />
                    </main>
                    <Footer />
                  </>
                }
              />
              {/* Contacto */}
              <Route
                path="/contacto"
                element={
                  <>
                    <Header />
                    <main className="min-h-screen">
                      <Contacto />
                    </main>
                    <Footer />
                  </>
                }
              />

              {/* FAQ */}
              <Route
                path="/faq"
                element={
                  <>
                    <Header />
                    <main className="min-h-screen">
                      <FAQ />
                    </main>
                    <Footer />
                  </>
                }
              />

              {/* Página de gracias */}
              <Route
                path="/gracias"
                element={
                  <>
                    <Header />
                    <main className="min-h-screen">
                      <Gracias />
                    </main>
                    <Footer />
                  </>
                }
              />

              {/* 404 - Not Found */}
              <Route
                path="*"
                element={
                  <>
                    <Header />
                    <main className="min-h-screen">
                      <NotFound />
                    </main>
                    <Footer />
                  </>
                }
              />
            </Routes>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
