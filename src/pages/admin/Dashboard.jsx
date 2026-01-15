// src/pages/admin/Dashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { productsAPI, categoriesAPI } from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalProductos: 0,
    productosDestacados: 0,
    totalCategorias: 0,
    loading: true
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Obtener productos
        const productosResponse = await productsAPI.getAll();
        const categoriasResponse = await categoriesAPI.getAll();

        if (productosResponse.success && categoriasResponse.success) {
          const productos = productosResponse.data || [];
          const destacados = productos.filter(p => p.destacado);

          setStats({
            totalProductos: productos.length,
            productosDestacados: destacados.length,
            totalCategorias: categoriasResponse.data?.length || 0,
            loading: false
          });
        }
      } catch (error) {
        console.error('Error cargando estadísticas:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Productos',
      value: stats.totalProductos,
      icon: 'fas fa-box',
      color: 'bg-blue-500',
      link: '/admin/productos'
    },
    {
      title: 'Productos Destacados',
      value: stats.productosDestacados,
      icon: 'fas fa-star',
      color: 'bg-yellow-500',
      link: '/admin/productos'
    },
    {
      title: 'Categorías',
      value: stats.totalCategorias,
      icon: 'fas fa-tags',
      color: 'bg-green-500',
      link: '/admin/productos'
    }
  ];

  return (
    <AdminLayout>
      {/* Bienvenida */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-secondary mb-2">
          ¡Bienvenido, {user?.nombre}! 👋
        </h2>
        <p className="text-gris-medio">
          Este es tu panel de control para gestionar DecoMotivo
        </p>
      </div>

      {/* Stats Cards */}
      {stats.loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-gris-medio">Cargando estadísticas...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statCards.map((card, index) => (
            <Link
              key={index}
              to={card.link}
              className="bg-blanco rounded-xl shadow-custom p-6 hover:shadow-custom-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center text-blanco text-xl`}>
                  <i className={card.icon}></i>
                </div>
                <i className="fas fa-arrow-right text-gris-claro"></i>
              </div>
              <h3 className="text-gris-medio text-sm mb-1">{card.title}</h3>
              <p className="text-3xl font-bold text-secondary">{card.value}</p>
            </Link>
          ))}
        </div>
      )}

      {/* Acciones Rápidas */}
      <div className="bg-blanco rounded-xl shadow-custom p-6">
        <h3 className="text-xl font-bold text-secondary mb-4 flex items-center gap-2">
          <i className="fas fa-bolt text-primary"></i>
          Acciones Rápidas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/admin/productos/nuevo"
            className="flex items-center gap-4 p-4 border-2 border-primary/20 rounded-lg hover:border-primary hover:bg-primary/5 transition-all duration-300 group"
          >
            <div className="bg-primary text-blanco w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <i className="fas fa-plus"></i>
            </div>
            <div>
              <h4 className="font-semibold text-secondary">Crear Producto</h4>
              <p className="text-sm text-gris-medio">Agregar un nuevo producto al catálogo</p>
            </div>
          </Link>

          <Link
            to="/admin/productos"
            className="flex items-center gap-4 p-4 border-2 border-secondary/20 rounded-lg hover:border-secondary hover:bg-secondary/5 transition-all duration-300 group"
          >
            <div className="bg-secondary text-blanco w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <i className="fas fa-list"></i>
            </div>
            <div>
              <h4 className="font-semibold text-secondary">Ver Productos</h4>
              <p className="text-sm text-gris-medio">Gestionar productos existentes</p>
            </div>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;