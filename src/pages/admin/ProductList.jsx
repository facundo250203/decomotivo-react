// src/pages/admin/ProductList.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { productsAPI, categoriesAPI, adminProductsAPI } from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';

const ProductList = () => {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'destacados', 'activos'

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      if (response.success) {
        setCategories(response.data || []);
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll();
      
      if (response.success) {
        setProducts(response.data || []);
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId, productTitle) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${productTitle}"?`)) {
      return;
    }

    try {
      const response = await adminProductsAPI.delete(productId, token);
      
      if (response.success) {
        alert('Producto eliminado correctamente');
        fetchProducts(); // Recargar lista
      } else {
        alert('Error al eliminar el producto: ' + response.error);
      }
    } catch (error) {
      console.error('Error eliminando producto:', error);
      alert('Error al eliminar el producto');
    }
  };

  // Filtrar productos con TODOS los filtros combinados
  const filteredProducts = products.filter(product => {
    // Filtro por texto (búsqueda)
    const matchesSearch = searchText === '' || 
      product.titulo.toLowerCase().includes(searchText.toLowerCase());

    // Filtro por categoría
    const matchesCategory = selectedCategory === 'all' || 
      product.categoria_id === parseInt(selectedCategory);

    // Filtro por estado
    let matchesStatus = true;
    if (statusFilter === 'destacados') {
      matchesStatus = product.destacado;
    } else if (statusFilter === 'activos') {
      matchesStatus = product.activo;
    }

    // Debe cumplir TODOS los filtros
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Limpiar todos los filtros
  const clearFilters = () => {
    setSearchText('');
    setSelectedCategory('all');
    setStatusFilter('all');
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-secondary">Gestión de Productos</h2>
          <p className="text-gris-medio">
            {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          to="/admin/productos/nuevo"
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
        >
          <i className="fas fa-plus"></i>
          Nuevo Producto
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda por texto */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-texto mb-2">
              Buscar por nombre
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Buscar producto..."
                className="w-full px-4 py-2 pl-10 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gris-medio"></i>
            </div>
          </div>

          {/* Filtro por categoría */}
          <div>
            <label className="block text-sm font-medium text-texto mb-2">
              Categoría
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por estado */}
          <div>
            <label className="block text-sm font-medium text-texto mb-2">
              Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">Todos</option>
              <option value="activos">Solo activos</option>
              <option value="destacados">Solo destacados</option>
            </select>
          </div>
        </div>

        {/* Botón limpiar filtros */}
        {(searchText !== '' || selectedCategory !== 'all' || statusFilter !== 'all') && (
          <div className="mt-4">
            <button
              onClick={clearFilters}
              className="text-sm text-primary hover:text-primary-dark flex items-center gap-1"
            >
              <i className="fas fa-times"></i>
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gris-medio">Cargando productos...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Sin resultados */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <i className="fas fa-box-open text-6xl text-gris-claro mb-4"></i>
              <p className="text-xl text-secondary font-semibold mb-2">
                No se encontraron productos
              </p>
              <p className="text-gris-medio mb-6">
                {searchText || selectedCategory !== 'all' || statusFilter !== 'all'
                  ? 'Intenta cambiar los filtros de búsqueda'
                  : 'Comienza creando tu primer producto'
                }
              </p>
              {(searchText || selectedCategory !== 'all' || statusFilter !== 'all') && (
                <button
                  onClick={clearFilters}
                  className="text-primary hover:text-primary-dark font-medium"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            /* Lista de productos */
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gris-claro">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                        Producto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                        Categoría
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                        Precio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-secondary uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gris-claro">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        {/* Producto */}
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-16 w-16 flex-shrink-0 mr-4">
                              {product.imagenes && product.imagenes.length > 0 ? (
                                <img
                                  src={product.imagenes[0].url}
                                  alt={product.titulo}
                                  className="h-16 w-16 rounded object-cover border border-gris-claro"
                                />
                              ) : (
                                <div className="h-16 w-16 rounded bg-gris-claro flex items-center justify-center">
                                  <i className="fas fa-image text-gris-medio text-2xl"></i>
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-secondary">
                                {product.titulo}
                              </div>
                              <div className="text-sm text-gris-medio">
                                {product.slug}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Categoría */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-texto">
                            {product.categoria?.nombre || 'Sin categoría'}
                          </span>
                        </td>

                        {/* Precio */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {product.precio_tipo === 'consultar' ? (
                            <span className="text-sm text-gris-medio italic">
                              Consultar
                            </span>
                          ) : (
                            <div className="text-sm">
                              {product.precio_tipo === 'desde' && (
                                <span className="text-gris-medio">Desde </span>
                              )}
                              <span className="font-medium text-secondary">
                                ${product.precio_valor?.toLocaleString('es-AR')}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Estado */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex text-xs px-2 py-1 rounded-full ${
                              product.activo
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {product.activo ? 'Activo' : 'Inactivo'}
                            </span>
                            {product.destacado && (
                              <span className="inline-flex text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                                <i className="fas fa-star mr-1"></i>
                                Destacado
                              </span>
                            )}
                            {product.personalizable && (
                              <span className="inline-flex text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                <i className="fas fa-edit mr-1"></i>
                                Personalizable
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Acciones */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/admin/productos/editar/${product.id}`}
                              className="text-primary hover:text-primary-dark"
                              title="Editar"
                            >
                              <i className="fas fa-edit"></i>
                            </Link>
                            <button
                              onClick={() => handleDelete(product.id, product.titulo)}
                              className="text-red-600 hover:text-red-900"
                              title="Eliminar"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
};

export default ProductList;