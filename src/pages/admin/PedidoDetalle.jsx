// src/pages/admin/PedidoDetalle.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import { adminOrdersAPI, ventasAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getErrorInfo } from "../../utils/errorHandler";

const PedidoDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [pedido, setPedido] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [modalPago, setModalPago] = useState(null); // 'senar' | 'pago' | null
  const [montoEfectivo, setMontoEfectivo] = useState("");
  const [montoTransferencia, setMontoTransferencia] = useState("");
  const toast = useToast();

  useEffect(() => {
    fetchPedido();
  }, [id]);

  const fetchPedido = async () => {
    try {
      setLoading(true);
      const [pedidoResponse, pagosResponse] = await Promise.all([
        adminOrdersAPI.getById(id, token),
        ventasAPI.getAll({ pedido_id: id }, token),
      ]);
      if (pedidoResponse.success) {
        setPedido(pedidoResponse.data);
      }
      if (pagosResponse.success) {
        setPagos(pagosResponse.data);
      }
    } catch (error) {
      const { title, message, detail } = getErrorInfo(error);
      toast.error(title, message, detail);
      if (error?.status === 401)
        setTimeout(() => navigate("/admin/login"), 2000);
      navigate("/admin/pedidos");
    } finally {
      setLoading(false);
    }
  };

  const totalPagado = pagos.reduce((acc, pago) => acc + pago.monto_total, 0);

  const abrirModalPago = (tipo) => {
    setMontoEfectivo("");
    setMontoTransferencia("");
    setModalPago(tipo);
  };

  const cerrarModalPago = () => setModalPago(null);

  const confirmarPago = async () => {
    const efectivo = parseFloat(montoEfectivo) || 0;
    const transferencia = parseFloat(montoTransferencia) || 0;

    if (efectivo <= 0 && transferencia <= 0) {
      toast.warning(
        "Monto requerido",
        "Ingresá un monto en efectivo y/o transferencia.",
      );
      return;
    }

    try {
      setCambiandoEstado(true);

      if (modalPago === "senar") {
        await adminOrdersAPI.updateStatus(
          id,
          "senado",
          { monto_efectivo: efectivo, monto_transferencia: transferencia },
          token,
        );
        toast.success("Pedido señado", "El pedido pasó a estado señado.");
      } else {
        await adminOrdersAPI.registerPayment(
          id,
          { monto_efectivo: efectivo, monto_transferencia: transferencia },
          token,
        );
        toast.success("Pago registrado", "El pago se registró correctamente.");
      }

      cerrarModalPago();
      fetchPedido();
    } catch (error) {
      const { title, message, detail } = getErrorInfo(error);
      toast.error(title, message, detail);
    } finally {
      setCambiandoEstado(false);
    }
  };

  const handleMarcarEntregado = async () => {
    if (!window.confirm('¿Marcar este pedido como "entregado"?')) return;
    try {
      setCambiandoEstado(true);
      await adminOrdersAPI.updateStatus(id, "entregado", {}, token);
      toast.success("Estado actualizado", 'El pedido pasó a "entregado".');
      fetchPedido();
    } catch (error) {
      const { title, message, detail } = getErrorInfo(error);
      toast.error(title, message, detail);
    } finally {
      setCambiandoEstado(false);
    }
  };

  const formatFecha = (fecha) => {
    if (!fecha) return "-";
    return new Date(fecha).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrecio = (precio) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(precio);
  };

  const getEstadoColor = (estado) => {
    const colores = {
      solicitado: "text-blue-600 bg-blue-100",
      senado: "text-yellow-600 bg-yellow-100",
      entregado: "text-green-600 bg-green-100",
    };
    return colores[estado] || "text-gray-600 bg-gray-100";
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

  const saldoPendiente = pedido.total - totalPagado;

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
            {pedido.estado === "solicitado" && (
              <button
                onClick={() => abrirModalPago("senar")}
                disabled={cambiandoEstado}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <i className="fas fa-hand-holding-usd"></i>
                Marcar como Señado
              </button>
            )}
            {pedido.estado === "senado" && (
              <button
                onClick={handleMarcarEntregado}
                disabled={cambiandoEstado}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <i className="fas fa-check-circle"></i>
                Marcar como Entregado
              </button>
            )}
            {(pedido.estado === "senado" || pedido.estado === "entregado") &&
              saldoPendiente > 0.01 && (
                <button
                  onClick={() => abrirModalPago("pago")}
                  disabled={cambiandoEstado}
                  className="bg-secondary text-white px-4 py-2 rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <i className="fas fa-money-bill-wave"></i>
                  Registrar pago
                </button>
              )}
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
              {pedido.cliente_id && (
                <Link
                  to={`/admin/clientes/${pedido.cliente_id}`}
                  className="text-sm font-normal text-primary hover:underline ml-auto"
                >
                  Ver ficha del cliente
                </Link>
              )}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Nombre</p>
                <p className="font-medium">{pedido.cliente_nombre}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Teléfono</p>
                <p className="font-medium">{pedido.cliente_telefono || "-"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500 mb-1">Email</p>
                <p className="font-medium">{pedido.cliente_email || "-"}</p>
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
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        {item.producto_titulo}
                        {item.cajas_vendidas && (
                          <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            <i className="fas fa-box mr-1"></i>
                            Caja x{item.cajas_vendidas}
                          </span>
                        )}
                      </h4>
                      {item.descripcion && (
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Personalización:</span>{" "}
                          {item.descripcion}
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
                    <span>
                      Precio unitario: {formatPrecio(item.precio_unitario)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Historial de pagos */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <i className="fas fa-receipt text-primary"></i>
              Historial de pagos
            </h3>
            {pagos.length === 0 ? (
              <p className="text-gray-500 text-sm">
                Todavía no se registró ningún pago para este pedido.
              </p>
            ) : (
              <div className="space-y-2">
                {pagos.map((pago) => (
                  <div
                    key={pago.id}
                    className="flex justify-between items-center border rounded-lg p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium capitalize">
                        {pago.tipo === "sena" ? "Seña" : "Pago"}
                      </p>
                      <p className="text-gray-500">{formatFecha(pago.fecha)}</p>
                    </div>
                    <div className="text-right">
                      {pago.monto_efectivo > 0 && (
                        <p className="text-gray-600">
                          Efectivo: {formatPrecio(pago.monto_efectivo)}
                        </p>
                      )}
                      {pago.monto_transferencia > 0 && (
                        <p className="text-gray-600">
                          Transferencia: {formatPrecio(pago.monto_transferencia)}
                        </p>
                      )}
                      <p className="font-semibold">
                        {formatPrecio(pago.monto_total)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notas */}
          {pedido.notas && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <i className="fas fa-sticky-note text-primary"></i>
                Notas
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">
                {pedido.notas}
              </p>
            </div>
          )}
        </div>

        {/* Resumen y Estado */}
        <div className="space-y-6">
          {/* Estado */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Estado del Pedido</h3>
            <div
              className={`text-center py-6 rounded-lg ${getEstadoColor(pedido.estado)}`}
            >
              <p className="text-2xl font-bold uppercase">{pedido.estado}</p>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Solicitado:</span>
                <span className="font-medium">
                  {formatFecha(pedido.fecha_pedido)}
                </span>
              </div>
              {pedido.fecha_senado && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Señado:</span>
                  <span className="font-medium">
                    {formatFecha(pedido.fecha_senado)}
                  </span>
                </div>
              )}
              {pedido.fecha_entregado && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Entregado:</span>
                  <span className="font-medium">
                    {formatFecha(pedido.fecha_entregado)}
                  </span>
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
                <span>Pagado hasta ahora:</span>
                <span>{formatPrecio(totalPagado)}</span>
              </div>
              <div className="flex justify-between text-orange-600 font-semibold">
                <span>Saldo pendiente:</span>
                <span>{formatPrecio(Math.max(saldoPendiente, 0))}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de carga de pago (señar o registrar pago adicional) */}
      {modalPago && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">
              {modalPago === "senar"
                ? "Confirmar seña"
                : "Registrar pago adicional"}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Indicá cuánto se pagó en efectivo y/o transferencia.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-texto mb-2">
                  Efectivo
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={montoEfectivo}
                  onChange={(e) => setMontoEfectivo(e.target.value)}
                  className="w-full px-4 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-texto mb-2">
                  Transferencia
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={montoTransferencia}
                  onChange={(e) => setMontoTransferencia(e.target.value)}
                  className="w-full px-4 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={confirmarPago}
                disabled={cambiandoEstado}
                className="flex-1 bg-primary text-white py-2 px-4 rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
              >
                Confirmar
              </button>
              <button
                onClick={cerrarModalPago}
                disabled={cambiandoEstado}
                className="px-4 py-2 border border-gris-claro rounded-lg hover:bg-gris-claro transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default PedidoDetalle;
