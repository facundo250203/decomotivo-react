// src/pages/admin/VentasList.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import { ventasAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getErrorInfo } from "../../utils/errorHandler";

// No usar toISOString() acá -- siempre da la fecha en UTC, y a partir de las
// 21:00 hora Argentina (UTC-3) ya cruzó la medianoche UTC y devuelve "mañana".
// Se arma la fecha desde los componentes LOCALES en cambio.
const hoyISO = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const VentasList = () => {
  const { token } = useAuth();
  const toast = useToast();
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [desde, setDesde] = useState(hoyISO());
  const [hasta, setHasta] = useState(hoyISO());

  useEffect(() => {
    fetchVentas();
  }, [desde, hasta]);

  const fetchVentas = async () => {
    try {
      setLoading(true);
      const response = await ventasAPI.getAll({ desde, hasta }, token);
      if (response.success) {
        setVentas(response.data || []);
      }
    } catch (error) {
      const { title, message, detail } = getErrorInfo(error);
      toast.error(title, message, detail);
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

  const etiquetaTipo = (venta) => {
    // Una "seña" que cubre el 100% del pedido es, en la práctica, un pago
    // completo -- se distingue así en vez de en el dato guardado porque un
    // pedido solo se señala una vez (no hay un tipo de venta separado para
    // "pago completo desde el inicio").
    if (
      venta.tipo === "sena" &&
      venta.pedido_total != null &&
      venta.pedido_total - venta.monto_total <= 0.01
    ) {
      return "Pago Completo";
    }
    const etiquetas = {
      sena: "Seña",
      pago_final: "Pago",
      venta_directa: "Venta directa",
    };
    return etiquetas[venta.tipo] || venta.tipo;
  };

  const totales = ventas.reduce(
    (acc, v) => ({
      efectivo: acc.efectivo + v.monto_efectivo,
      transferencia: acc.transferencia + v.monto_transferencia,
      total: acc.total + v.monto_total,
    }),
    { efectivo: 0, transferencia: 0, total: 0 },
  );

  return (
    <AdminLayout>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-secondary">Ventas</h2>
            <p className="text-gris-medio">
              Señas, pagos y ventas directas
            </p>
          </div>
          <Link
            to="/admin/ventas/nueva"
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-accent transition-colors flex items-center gap-2"
          >
            <i className="fas fa-plus"></i>
            Nueva Venta Directa
          </Link>
        </div>
      </div>

      {/* Filtros de fecha */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Desde
            </label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hasta
            </label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Resumen de totales del período */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-500">Efectivo</p>
          <p className="text-2xl font-bold text-green-600">
            {formatPrecio(totales.efectivo)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-500">Transferencia</p>
          <p className="text-2xl font-bold text-blue-600">
            {formatPrecio(totales.transferencia)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-500">Total del período</p>
          <p className="text-2xl font-bold text-secondary">
            {formatPrecio(totales.total)}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gris-medio">Cargando ventas...</p>
          </div>
        </div>
      ) : ventas.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow-md text-center">
          <i className="fas fa-cash-register text-6xl text-gray-300 mb-4"></i>
          <p className="text-xl text-gray-600">
            No hay ventas registradas en este rango de fechas
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Productos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Efectivo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transferencia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pedido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ventas.map((venta) => (
                  <tr key={venta.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFecha(venta.fecha)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {etiquetaTipo(venta)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {venta.cliente_nombre || "Venta de mostrador"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                      {venta.productos ||
                        (venta.pedido_id ? "Ítems del pedido" : "-")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {venta.monto_efectivo > 0
                        ? formatPrecio(venta.monto_efectivo)
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {venta.monto_transferencia > 0
                        ? formatPrecio(venta.monto_transferencia)
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatPrecio(venta.monto_total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {venta.pedido_id ? (
                        <Link
                          to={`/admin/pedidos/${venta.pedido_id}`}
                          className="text-blue-600 hover:underline"
                        >
                          #{venta.pedido_id}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {venta.tipo === "venta_directa" ? (
                        <Link
                          to={`/admin/ventas/${venta.id}`}
                          className="text-primary hover:underline"
                        >
                          Ver detalle
                        </Link>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default VentasList;
