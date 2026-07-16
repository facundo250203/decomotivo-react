// src/pages/admin/ClienteDetalle.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import { clientesAPI, adminOrdersAPI, ventasAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getErrorInfo } from "../../utils/errorHandler";

const ClienteDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const toast = useToast();
  const [cliente, setCliente] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodo();
  }, [id]);

  const fetchTodo = async () => {
    try {
      setLoading(true);
      const [clienteRes, pedidosRes, ventasRes] = await Promise.all([
        clientesAPI.getById(id, token),
        adminOrdersAPI.getAll({ cliente_id: id }, token),
        ventasAPI.getAll({ cliente_id: id }, token),
      ]);
      if (clienteRes.success) setCliente(clienteRes.data);
      if (pedidosRes.success) setPedidos(pedidosRes.data || []);
      if (ventasRes.success) setVentas(ventasRes.data || []);
    } catch (error) {
      const { title, message, detail } = getErrorInfo(error);
      toast.error(title, message, detail);
      navigate("/admin/clientes");
    } finally {
      setLoading(false);
    }
  };

  const formatFecha = (fecha) => {
    if (!fecha) return "-";
    return new Date(fecha).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatPrecio = (precio) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(precio);
  };

  const totalGastado = ventas.reduce((acc, v) => acc + v.monto_total, 0);

  const getEstadoBadge = (estado) => {
    const badges = {
      solicitado: "bg-blue-100 text-blue-800",
      senado: "bg-yellow-100 text-yellow-800",
      entregado: "bg-green-100 text-green-800",
    };
    return badges[estado] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gris-medio">Cargando cliente...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!cliente) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-xl text-gray-600">Cliente no encontrado</p>
          <Link
            to="/admin/clientes"
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
      <div className="mb-6">
        <Link
          to="/admin/clientes"
          className="text-primary hover:underline mb-2 inline-block"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Volver a clientes
        </Link>
        <h2 className="text-2xl font-bold text-secondary">
          {cliente.nombre_completo}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Pedidos */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <i className="fas fa-shopping-cart text-primary"></i>
              Pedidos ({pedidos.length})
            </h3>
            {pedidos.length === 0 ? (
              <p className="text-gray-500 text-sm">
                Este cliente todavía no tiene pedidos.
              </p>
            ) : (
              <div className="space-y-2">
                {pedidos.map((pedido) => (
                  <Link
                    key={pedido.id}
                    to={`/admin/pedidos/${pedido.id}`}
                    className="flex justify-between items-center border rounded-lg p-3 text-sm hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium">Pedido #{pedido.id}</p>
                      <p className="text-gray-500">
                        {formatFecha(pedido.fecha_pedido)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-semibold ${getEstadoBadge(pedido.estado)}`}
                      >
                        {pedido.estado}
                      </span>
                      <span className="font-semibold">
                        {formatPrecio(pedido.total)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Ventas */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <i className="fas fa-receipt text-primary"></i>
              Historial de pagos y ventas ({ventas.length})
            </h3>
            {ventas.length === 0 ? (
              <p className="text-gray-500 text-sm">
                Este cliente todavía no tiene ventas registradas.
              </p>
            ) : (
              <div className="space-y-2">
                {ventas.map((venta) => (
                  <div
                    key={venta.id}
                    className="flex justify-between items-center border rounded-lg p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium capitalize">
                        {venta.tipo === "venta_directa"
                          ? "Venta directa"
                          : venta.tipo === "sena"
                            ? "Seña"
                            : "Pago"}
                      </p>
                      <p className="text-gray-500">
                        {formatFecha(venta.fecha)}
                      </p>
                    </div>
                    <span className="font-semibold">
                      {formatPrecio(venta.monto_total)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Resumen y datos */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Datos de contacto</h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-gray-500">Teléfono:</span>{" "}
                {cliente.telefono || "-"}
              </p>
              <p>
                <span className="text-gray-500">Email:</span>{" "}
                {cliente.email || "-"}
              </p>
              <p>
                <span className="text-gray-500">Dirección:</span>{" "}
                {cliente.direccion || "-"}
              </p>
              {cliente.notas && (
                <p>
                  <span className="text-gray-500">Notas:</span> {cliente.notas}
                </p>
              )}
            </div>
            <Link
              to={`/admin/clientes/editar/${cliente.id}`}
              className="inline-block mt-4 text-primary hover:underline text-sm"
            >
              <i className="fas fa-edit mr-1"></i>
              Editar datos
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Resumen</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Total pedidos:</span>
                <span className="font-medium">{pedidos.length}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t">
                <span>Total gastado:</span>
                <span>{formatPrecio(totalGastado)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ClienteDetalle;
