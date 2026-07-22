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
import Ofertas from "./pages/Ofertas";
import Combos from "./pages/Combos";
import Contacto from "./pages/Contacto";
import CategoryPage from "./pages/CategoryPage";
import FAQ from "./pages/FAQ";
import Gracias from "./pages/Gracias";
import NotFound from "./pages/NotFound";

// Páginas de admin
import Login from "./pages/admin/Login";
import InicioAdmin from "./pages/admin/Inicio";
import Dashboard from "./pages/admin/Dashboard";
import ProductList from "./pages/admin/ProductList";
import ProductForm from "./pages/admin/ProductForm";
import ProductDetail from "./pages/admin/ProductDetail";
import PedidosList from "./pages/admin/PedidosList";
import PedidoDetalle from "./pages/admin/PedidoDetalle";
import PedidoForm from "./pages/admin/PedidoForm";
import VentasList from "./pages/admin/VentasList";
import VentaDirectaForm from "./pages/admin/VentaDirectaForm";
import VentaDetalle from "./pages/admin/VentaDetalle";
import SalidasList from "./pages/admin/SalidasList";
import SalidaForm from "./pages/admin/SalidaForm";
import CajaDashboard from "./pages/admin/CajaDashboard";
import ProveedoresList from "./pages/admin/ProveedoresList";
import ProveedorForm from "./pages/admin/ProveedorForm";
import ProveedorDetalle from "./pages/admin/ProveedorDetalle";
import ComprasList from "./pages/admin/ComprasList";
import CompraForm from "./pages/admin/CompraForm";
import ClientesList from "./pages/admin/ClientesList";
import ClienteForm from "./pages/admin/ClienteForm";
import ClienteDetalle from "./pages/admin/ClienteDetalle";
import CategoriasList from "./pages/admin/CategoriasList";
import CategoriaForm from "./pages/admin/CategoriaForm";
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

              {/* Inicio del admin (protegido) */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <InicioAdmin />
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

              {/* ========== VENTAS ========== */}

              <Route
                path="/admin/ventas"
                element={
                  <ProtectedRoute>
                    <VentasList />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/ventas/nueva"
                element={
                  <ProtectedRoute>
                    <VentaDirectaForm />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/ventas/:id"
                element={
                  <ProtectedRoute>
                    <VentaDetalle />
                  </ProtectedRoute>
                }
              />

              {/* ========== SALIDAS ========== */}

              <Route
                path="/admin/salidas"
                element={
                  <ProtectedRoute>
                    <SalidasList />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/salidas/nueva"
                element={
                  <ProtectedRoute>
                    <SalidaForm />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/salidas/editar/:id"
                element={
                  <ProtectedRoute>
                    <SalidaForm />
                  </ProtectedRoute>
                }
              />

              {/* ========== CAJA ========== */}

              <Route
                path="/admin/caja"
                element={
                  <ProtectedRoute>
                    <CajaDashboard />
                  </ProtectedRoute>
                }
              />

              {/* ========== DASHBOARD ========== */}

              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* ========== PROVEEDORES ========== */}

              <Route
                path="/admin/proveedores"
                element={
                  <ProtectedRoute>
                    <ProveedoresList />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/proveedores/nuevo"
                element={
                  <ProtectedRoute>
                    <ProveedorForm />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/proveedores/editar/:id"
                element={
                  <ProtectedRoute>
                    <ProveedorForm />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/proveedores/:id"
                element={
                  <ProtectedRoute>
                    <ProveedorDetalle />
                  </ProtectedRoute>
                }
              />

              {/* ========== COMPRAS ========== */}

              <Route
                path="/admin/compras"
                element={
                  <ProtectedRoute>
                    <ComprasList />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/compras/nueva"
                element={
                  <ProtectedRoute>
                    <CompraForm />
                  </ProtectedRoute>
                }
              />

              {/* ========== CLIENTES ========== */}

              <Route
                path="/admin/clientes"
                element={
                  <ProtectedRoute>
                    <ClientesList />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/clientes/nuevo"
                element={
                  <ProtectedRoute>
                    <ClienteForm />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/clientes/editar/:id"
                element={
                  <ProtectedRoute>
                    <ClienteForm />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/clientes/:id"
                element={
                  <ProtectedRoute>
                    <ClienteDetalle />
                  </ProtectedRoute>
                }
              />

              {/* ========== CATEGORÍAS ========== */}

              <Route
                path="/admin/categorias"
                element={
                  <ProtectedRoute>
                    <CategoriasList />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/categorias/nueva"
                element={
                  <ProtectedRoute>
                    <CategoriaForm />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/categorias/editar/:id"
                element={
                  <ProtectedRoute>
                    <CategoriaForm />
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

              {/* Ofertas: no es una categoría real de la DB, es un filtro
                  sobre productos.en_oferta (ver src/pages/Ofertas.jsx) */}
              <Route
                path="/ofertas"
                element={
                  <>
                    <Header />
                    <main className="min-h-screen">
                      <Ofertas />
                    </main>
                    <Footer />
                  </>
                }
              />

              {/* Combos: no es una categoría real de la DB, es un filtro
                  sobre productos.precio_tipo='combo' (ver src/pages/Combos.jsx) */}
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

              {/* Página de categoría (dinámica: tablas, mates, mdf,
                  otros, combos, decoraciones, libreria, tecnologia, y
                  cualquier categoría nueva que se agregue a la DB) */}
              <Route
                path="/:categorySlug"
                element={
                  <>
                    <Header />
                    <main className="min-h-screen">
                      <CategoryPage />
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
