// src/components/admin/AdminLayout.jsx
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    if (window.confirm('¿Cerrar sesión?')) {
      logout();
      navigate('/admin/login');
    }
  };

  const menuItems = [
    {
      name: 'Dashboard',
      icon: 'fa-home',
      path: '/admin',
      exact: true
    },
    {
      name: 'Productos',
      icon: 'fa-box',
      path: '/admin/productos'
    },
    // Aquí se agregarán más items después (Pedidos, etc.)
  ];

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className={`bg-secondary text-white transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-20'
      } flex flex-col`}>
        {/* Logo / Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
              <img 
                src="/images/logo.png" 
                alt="DecoMotivo" 
                className="w-full h-full object-contain invert brightness-0 invert"
              />
            </div>
            {sidebarOpen && (
              <span className="font-semibold">Admin</span>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white hover:text-primary transition-colors"
          >
            <i className={`fas fa-${sidebarOpen ? 'bars' : 'bars'}`}></i>
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 py-4">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 hover:bg-gray-700 transition-colors ${
                isActive(item.path, item.exact) ? 'bg-red-600 border-l-4 border-red-400' : ''
              }`}
            >
              <i className={`fas ${item.icon} ${sidebarOpen ? 'mr-3' : 'mx-auto'}`}></i>
              {sidebarOpen && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>

        {/* User Info + Logout */}
        <div className="border-t border-gray-700 p-4">
          {sidebarOpen ? (
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">Conectado como:</p>
              <p className="font-medium mb-3">{user?.nombre || 'Admin'}</p>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
              >
                <i className="fas fa-sign-out-alt"></i>
                <span>Cerrar Sesión</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex justify-center text-gray-300 hover:text-white transition-colors"
              title="Cerrar sesión"
            >
              <i className="fas fa-sign-out-alt"></i>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-secondary"
            >
              <i className="fas fa-bars text-xl"></i>
            </button>
            <h2 className="text-xl font-semibold text-secondary">
              Panel de Administración
            </h2>
          </div>

          {/* Botón Ver Tienda Pública - AQUÍ ESTÁ EL CAMBIO */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden md:block">
              {new Date().toLocaleDateString('es-AR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors"
            >
              <i className="fas fa-external-link-alt"></i>
              <span className="hidden sm:inline">Ver tienda pública</span>
            </a>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;