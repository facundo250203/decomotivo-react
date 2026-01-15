// src/pages/admin/PedidosList.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminOrdersAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const PedidosList = () => {
  const { token } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estadoFiltro, setEstadoFiltro] = useState('');

  useEffect(() => {
    fetchPedidos();
  }, [estadoFiltro]);

  const fetchPedidos = async () => {
    try {
      setLoading(true);
      const filters = estadoFiltro ? { estado: estadoFiltro } : {};
      const response = await adminOrdersAPI.getAll(filters, token);
      
      if (response.success) {
        setPedidos(response.data || []);
      }
    } catch (error) {
      console.error('Error cargando pedidos:', error);
      alert('Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, clienteNombre) => {
    if (window.confirm(`¿Eliminar pedido de ${clienteNombre}?`)) {
      try {
        await adminOrdersAPI.delete(id, token);
        alert('Pedido eliminado correctamente');
        fetchPedidos();
      } catch (error) {
        console.error('Error eliminando pedido:', error);
        alert('Error al eliminar el pedido');
      }
    }
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrecio = (precio) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(precio);
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      solicitado: 'bg-blue-100 text-blue-800',
      senado: 'bg-yellow-100 text-yellow-800',
      entregado: 'bg-green-100 text-green-800'
    };
    return badges[estado] || 'bg-gray-100 text-gray-800';
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-secondary">Gestión de Pedidos</h2>
            <p className="text-gris-medio">Administra los pedidos de tus clientes</p>
          </div>
          <Link
            to="/admin/pedidos/nuevo"
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-accent transition-colors flex items-center gap-2"
          >
            <i className="fas fa-plus"></i>
            Nuevo Pedido
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex gap-4 items-center">
          <label className="font-semibold text-gray-700">Filtrar por estado:</label>
          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Todos</option>
            <option value="solicitado">Solicitado</option>
            <option value="senado">Señado</option>
            <option value="entregado">Entregado</option>
          </select>
          {estadoFiltro && (
            <button
              onClick={() => setEstadoFiltro('')}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Limpiar filtro
            </button>
          )}
        </div>
      </div>

      {/* Tabla de pedidos */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gris-medio">Cargando pedidos...</p>
          </div>
        </div>
      ) : (
        <>
          {pedidos.length === 0 ? (
            <div className="bg-white p-12 rounded-lg shadow-md text-center">
              <i className="fas fa-box-open text-6xl text-gray-300 mb-4"></i>
              <p className="text-xl text-gray-600">
                {estadoFiltro 
                  ? `No hay pedidos con estado "${estadoFiltro}"`
                  : 'No hay pedidos registrados'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Teléfono
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Seña
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Productos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pedidos.map((pedido) => (
                      <tr key={pedido.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{pedido.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {pedido.cliente_nombre}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {pedido.cliente_telefono || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatPrecio(pedido.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatPrecio(pedido.monto_sena)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex text-xs px-2 py-1 rounded-full font-semibold ${getEstadoBadge(pedido.estado)}`}>
                            {pedido.estado.charAt(0).toUpperCase() + pedido.estado.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {pedido.cantidad_productos} items
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatFecha(pedido.fecha_pedido)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/admin/pedidos/${pedido.id}`}
                              className="text-blue-600 hover:text-blue-900"
                              title="Ver detalle"
                            >
                              <i className="fas fa-eye"></i>
                            </Link>
                            <button
                              onClick={() => handleDelete(pedido.id, pedido.cliente_nombre)}
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

export default PedidosList;