// src/pages/admin/PedidoDetalle.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminOrdersAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const PedidoDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

  useEffect(() => {
    fetchPedido();
  }, [id]);

  const fetchPedido = async () => {
    try {
      setLoading(true);
      const response = await adminOrdersAPI.getById(id, token);
      
      if (response.success) {
        setPedido(response.data);
      }
    } catch (error) {
      console.error('Error cargando pedido:', error);
      alert('Error al cargar el pedido');
      navigate('/admin/pedidos');
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarEstado = async (nuevoEstado) => {
    if (window.confirm(`¿Cambiar el estado del pedido a "${nuevoEstado}"?`)) {
      try {
        setCambiandoEstado(true);
        await adminOrdersAPI.updateStatus(id, nuevoEstado, token);
        alert('Estado actualizado correctamente');
        fetchPedido(); // Recargar datos
      } catch (error) {
        console.error('Error cambiando estado:', error);
        alert('Error al cambiar el estado');
      } finally {
        setCambiandoEstado(false);
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

  const getEstadoColor = (estado) => {
    const colores = {
      solicitado: 'text-blue-600 bg-blue-100',
      senado: 'text-yellow-600 bg-yellow-100',
      entregado: 'text-green-600 bg-green-100'
    };
    return colores[estado] || 'text-gray-600 bg-gray-100';
  };

  const getEstadoBotones = () => {
    if (!pedido) return [];
    
    const { estado } = pedido;
    
    if (estado === 'solicitado') {
      return [
        { label: 'Marcar como Señado', valor: 'senado', icon: 'fa-hand-holding-usd' }
      ];
    } else if (estado === 'senado') {
      return [
        { label: 'Marcar como Entregado', valor: 'entregado', icon: 'fa-check-circle' }
      ];
    }
    
    return [];
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gris-medio">Cargando pedido...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!pedido) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-xl text-gray-600">Pedido no encontrado</p>
          <Link
            to="/admin/pedidos"
            className="text-primary hover:underline mt-4 inline-block"
          >
            Volver a la lista
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/admin/pedidos"
          className="text-primary hover:underline mb-2 inline-block"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Volver a pedidos
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-secondary">
              Pedido #{pedido.id}
            </h2>
            <p className="text-gris-medio">
              Creado el {formatFecha(pedido.fecha_pedido)}
            </p>
          </div>
          <div className="flex gap-2">
            {getEstadoBotones().map((boton) => (
              <button
                key={boton.valor}
                onClick={() => handleCambiarEstado(boton.valor)}
                disabled={cambiandoEstado}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <i className={`fas ${boton.icon}`}></i>
                {boton.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información del Cliente */}
        <div className="lg:col-span-2 space-y-6">
          {/* Datos del cliente */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <i className="fas fa-user text-primary"></i>
              Información del Cliente
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Nombre</p>
                <p className="font-medium">{pedido.cliente_nombre}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Teléfono</p>
                <p className="font-medium">{pedido.cliente_telefono || '-'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500 mb-1">Email</p>
                <p className="font-medium">{pedido.cliente_email || '-'}</p>
              </div>
            </div>
          </div>

          {/* Items del pedido */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <i className="fas fa-box text-primary"></i>
              Productos ({pedido.items.length})
            </h3>
            <div className="space-y-3">
              {pedido.items.map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {item.producto_titulo}
                      </h4>
                      {item.descripcion && (
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Personalización:</span> {item.descripcion}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-semibold text-gray-900">
                        {formatPrecio(item.subtotal)}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Cantidad: {item.cantidad}</span>
                    <span>Precio unitario: {formatPrecio(item.precio_unitario)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notas */}
          {pedido.notas && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <i className="fas fa-sticky-note text-primary"></i>
                Notas
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">{pedido.notas}</p>
            </div>
          )}
        </div>

        {/* Resumen y Estado */}
        <div className="space-y-6">
          {/* Estado */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Estado del Pedido</h3>
            <div className={`text-center py-6 rounded-lg ${getEstadoColor(pedido.estado)}`}>
              <p className="text-2xl font-bold uppercase">
                {pedido.estado}
              </p>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Solicitado:</span>
                <span className="font-medium">{formatFecha(pedido.fecha_pedido)}</span>
              </div>
              {pedido.fecha_senado && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Señado:</span>
                  <span className="font-medium">{formatFecha(pedido.fecha_senado)}</span>
                </div>
              )}
              {pedido.fecha_entregado && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Entregado:</span>
                  <span className="font-medium">{formatFecha(pedido.fecha_entregado)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Resumen financiero */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Resumen</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>{formatPrecio(pedido.subtotal)}</span>
              </div>
              {pedido.descuento > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Descuento:</span>
                  <span>- {formatPrecio(pedido.descuento)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t">
                <span>Total:</span>
                <span>{formatPrecio(pedido.total)}</span>
              </div>
              <div className="flex justify-between text-green-600 font-semibold pt-2 border-t">
                <span>Seña pagada:</span>
                <span>{formatPrecio(pedido.monto_sena)}</span>
              </div>
              <div className="flex justify-between text-orange-600 font-semibold">
                <span>Saldo pendiente:</span>
                <span>{formatPrecio(pedido.total - pedido.monto_sena)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default PedidoDetalle;