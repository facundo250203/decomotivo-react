// src/pages/admin/SalidasList.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import { gastosAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getErrorInfo } from "../../utils/errorHandler";

const hoyISO = () => new Date().toISOString().slice(0, 10);

const SalidasList = () => {
  const { token } = useAuth();
  const toast = useToast();
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState(hoyISO());

  useEffect(() => {
    fetchGastos();
  }, [desde, hasta]);

  const fetchGastos = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (desde) filters.desde = desde;
      if (hasta) filters.hasta = hasta;
      const response = await gastosAPI.getAll(filters, token);
      if (response.success) {
        setGastos(response.data || []);
      }
    } catch (error) {
      const { title, message, detail } = getErrorInfo(error);
      toast.error(title, message, detail);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, concepto) => {
    if (!window.confirm(`¿Eliminar la salida "${concepto}"?`)) return;
    try {
      await gastosAPI.delete(id, token);
      toast.success("Salida eliminada", `"${concepto}" fue eliminada.`);
      fetchGastos();
    } catch (error) {
      const { title, message, detail } = getErrorInfo(error);
      toast.error(title, message, detail);
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

  const totales = gastos.reduce(
    (acc, g) => ({
      efectivo: acc.efectivo + g.monto_efectivo,
      transferencia: acc.transferencia + g.monto_transferencia,
      total: acc.total + g.monto_total,
    }),
    { efectivo: 0, transferencia: 0, total: 0 },
  );

  return (
    <AdminLayout>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-secondary">Salidas</h2>
            <p className="text-gris-medio">
              Gastos y salidas de dinero que no son compra de mercadería
              (servicios, retiros, sueldos, etc.)
            </p>
          </div>
          <Link
            to="/admin/salidas/nueva"
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-accent transition-colors flex items-center gap-2"
          >
            <i className="fas fa-plus"></i>
            Nueva Salida
          </Link>
        </div>
      </div>

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-500">Efectivo</p>
          <p className="text-2xl font-bold text-red-600">
            {formatPrecio(totales.efectivo)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-500">Transferencia</p>
          <p className="text-2xl font-bold text-red-600">
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
            <p className="text-gris-medio">Cargando salidas...</p>
          </div>
        </div>
      ) : gastos.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow-md text-center">
          <i className="fas fa-money-bill-wave text-6xl text-gray-300 mb-4"></i>
          <p className="text-xl text-gray-600">
            No hay salidas registradas en este rango de fechas
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
                    Concepto
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
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {gastos.map((gasto) => (
                  <tr key={gasto.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFecha(gasto.fecha)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {gasto.concepto}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {gasto.monto_efectivo > 0
                        ? formatPrecio(gasto.monto_efectivo)
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {gasto.monto_transferencia > 0
                        ? formatPrecio(gasto.monto_transferencia)
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatPrecio(gasto.monto_total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          to={`/admin/salidas/editar/${gasto.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar"
                        >
                          <i className="fas fa-edit"></i>
                        </Link>
                        <button
                          onClick={() => handleDelete(gasto.id, gasto.concepto)}
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
    </AdminLayout>
  );
};

export default SalidasList;
