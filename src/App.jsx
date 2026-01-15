// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

// Context
import { AuthProvider } from './context/AuthContext';

// Layouts y componentes comunes
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/admin/ProtectedRoute';

// Páginas públicas
import Inicio from './pages/Inicio';
import Productos from './pages/Productos';
import Contacto from './pages/Contacto';
import Tablas from './pages/Tablas';
import MatesVasos from './pages/MatesVasos';
import MDF from './pages/MDF';
import Otros from './pages/Otros';
import Combos from './pages/Combos';
import Decoraciones from './pages/Decoraciones';
import FAQ from './pages/FAQ';
import Gracias from './pages/Gracias';

// Páginas de admin
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import ProductList from './pages/admin/ProductList';
import ProductForm from './pages/admin/ProductForm';

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen flex flex-col">
            <Routes>
              {/* ============================================ */}
              {/* RUTAS PÚBLICAS (con Header y Footer) */}
              {/* ============================================ */}
              <Route
                path="/*"
                element={
                  <>
                    <Header />
                    <main className="flex-1">
                      <Routes>
                        <Route path="/" element={<Inicio />} />
                        <Route path="/inicio" element={<Inicio />} />
                        <Route path="/productos" element={<Productos />} />
                        <Route path="/contacto" element={<Contacto />} />
                        <Route path="/tablas" element={<Tablas />} />
                        <Route path="/mates-vasos" element={<MatesVasos />} />
                        <Route path="/mdf" element={<MDF />} />
                        <Route path="/otros" element={<Otros />} />
                        <Route path="/combos" element={<Combos />} />
                        <Route path="/decoraciones" element={<Decoraciones />} />
                        <Route path="/faq" element={<FAQ />} />
                        <Route path="/gracias" element={<Gracias />} />
                      </Routes>
                    </main>
                    <Footer />
                  </>
                }
              />

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
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;