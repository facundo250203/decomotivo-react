// src/pages/admin/CajaDashboard.jsx
import { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { cajaAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getErrorInfo } from "../../utils/errorHandler";

const hoyISO = () => new Date().toISOString().slice(0, 10);

const CajaDashboard = () => {
  const { token } = useAuth();
  const toast = useToast();
  const [saldo, setSaldo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [desde, setDesde] = useState(hoyISO());
  const [hasta, setHasta] = useState(hoyISO());

  const [ultimoCierre, setUltimoCierre] = useState(null);
  const [cierres, setCierres] = useState([]);
  const [loadingCierre, setLoadingCierre] = useState(true);
  const [efectivoContado, setEfectivoContado] = useState("");
  const [notasCierre, setNotasCierre] = useState("");
  const [cerrando, setCerrando] = useState(false);

  useEffect(() => {
    fetchSaldo();
  }, [desde, hasta]);

  useEffect(() => {
    fetchCierres();
  }, []);

  const fetchSaldo = async () => {
    try {
      setLoading(true);
      const response = await cajaAPI.getSaldo({ desde, hasta }, token);
      if (response.success) {
        setSaldo(response.data);
      }
    } catch (error) {
      const { title, message, detail } = getErrorInfo(error);
      toast.error(title, message, detail);
    } finally {
      setLoading(false);
    }
  };

  const fetchCierres = async () => {
    try {
      setLoadingCierre(true);
      const [ultimoRes, historialRes] = await Promise.all([
        cajaAPI.getUltimoCierre(token),
        cajaAPI.getCierres(token),
      ]);
      if (ultimoRes.success) setUltimoCierre(ultimoRes.data);
      if (historialRes.success) setCierres(historialRes.data || []);
    } catch (error) {
      const { title, message, detail } = getErrorInfo(error);
      toast.error(title, message, detail);
    } finally {
      setLoadingCierre(false);
    }
  };

  const yaSeCerroHoy = cierres.some((c) => c.fecha.slice(0, 10) === hoyISO());

  const handleCerrarCaja = async (e) => {
    e.preventDefault();
    if (efectivoContado === "" || parseFloat(efectivoContado) < 0) {
      toast.warning(
        "Falta el conteo",
        "Ingresá el efectivo que contaste en el cajón.",
      );
      return;
    }

    try {
      setCerrando(true);
      const response = await cajaAPI.crearCierre(
        { efectivo_contado: parseFloat(efectivoContado), notas: notasCierre || undefined },
        token,
      );
      if (response.success) {
        const dif = response.data.diferencia_efectivo;
        if (dif === 0) {
          toast.success("Caja cerrada", "El conteo coincide, sin diferencias.");
        } else if (dif > 0) {
          toast.success(
            "Caja cerrada",
            `Sobran ${formatPrecio(dif)} respecto a lo esperado.`,
          );
        } else {
          toast.warning(
            "Caja cerrada con diferencia",
            `Faltan ${formatPrecio(Math.abs(dif))} respecto a lo esperado.`,
          );
        }
        setEfectivoContado("");
        setNotasCierre("");
        fetchCierres();
      }
    } catch (error) {
      const { title, message, detail } = getErrorInfo(error);
      toast.error(title, message, detail);
    } finally {
      setCerrando(false);
    }
  };

  const formatPrecio = (precio) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(precio || 0);
  };

  const formatFecha = (fecha) => {
    return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-secondary">Caja</h2>
        <p className="text-gris-medio">
          Saldo neto: ventas - compras a proveedor - salidas
        </p>
      </div>

      {/* Acumulado real (del último cierre de caja) */}
      <div className="bg-secondary text-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-1">Acumulado Real</h3>
        {loadingCierre ? (
          <p className="text-sm opacity-80">Cargando...</p>
        ) : ultimoCierre ? (
          <>
            <p className="text-xs opacity-80 mb-3">
              Según el último cierre de caja del {formatFecha(ultimoCierre.fecha)}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm opacity-80">Efectivo</p>
                <p className="text-2xl font-bold">
                  {formatPrecio(ultimoCierre.acumulado_efectivo)}
                </p>
              </div>
              <div>
                <p className="text-sm opacity-80">Transferencia</p>
                <p className="text-2xl font-bold">
                  {formatPrecio(ultimoCierre.acumulado_transferencia)}
                </p>
              </div>
              <div>
                <p className="text-sm opacity-80">Total</p>
                <p className="text-2xl font-bold">
                  {formatPrecio(
                    ultimoCierre.acumulado_efectivo +
                      ultimoCierre.acumulado_transferencia,
                  )}
                </p>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm opacity-80">
            Todavía no cerraste ninguna caja. El primer cierre arranca el
            acumulado desde cero.
          </p>
        )}
      </div>

      {/* Cierre de caja del día */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-secondary mb-1">
          Cierre de Caja de Hoy
        </h3>
        {loadingCierre ? (
          <p className="text-sm text-gris-medio">Cargando...</p>
        ) : yaSeCerroHoy ? (
          <p className="text-sm text-green-600">
            <i className="fas fa-check-circle mr-2"></i>
            Ya cerraste la caja de hoy.
          </p>
        ) : (
          <form onSubmit={handleCerrarCaja} className="space-y-4">
            <p className="text-sm text-gris-medio">
              Contá el efectivo real del cajón e ingresalo acá. El sistema
              compara contra lo que se cargó hoy en ventas/compras/salidas.
            </p>
            <div className="max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Efectivo contado *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={efectivoContado}
                onChange={(e) => setEfectivoContado(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas (opcional)
              </label>
              <textarea
                value={notasCierre}
                onChange={(e) => setNotasCierre(e.target.value)}
                rows="2"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Ej: faltan $500, revisar venta de la tarde"
              />
            </div>
            <button
              type="submit"
              disabled={cerrando}
              className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cerrando ? "Cerrando..." : "Cerrar Caja de Hoy"}
            </button>
          </form>
        )}
      </div>

      {/* Historial de cierres */}
      {cierres.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Esperado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Diferencia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acumulado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cierres.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFecha(c.fecha)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatPrecio(c.efectivo_esperado)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatPrecio(c.efectivo_contado)}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                        c.diferencia_efectivo > 0
                          ? "text-green-600"
                          : c.diferencia_efectivo < 0
                            ? "text-red-600"
                            : "text-gray-500"
                      }`}
                    >
                      {c.diferencia_efectivo > 0 ? "+" : ""}
                      {formatPrecio(c.diferencia_efectivo)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatPrecio(
                        c.acumulado_efectivo + c.acumulado_transferencia,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Saldo por período (exploración libre de fechas) */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-semibold text-secondary mb-3">
          Consultar por período
        </h3>
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

      {loading || !saldo ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gris-medio">Calculando saldo...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { titulo: "Efectivo", datos: saldo.efectivo },
            { titulo: "Transferencia", datos: saldo.transferencia },
          ].map((col) => (
            <div key={col.titulo} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-secondary mb-4">
                {col.titulo}
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-green-600">
                  <span>Ventas</span>
                  <span className="font-medium">
                    + {formatPrecio(col.datos.ventas)}
                  </span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Compras a proveedor</span>
                  <span className="font-medium">
                    - {formatPrecio(col.datos.compras)}
                  </span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Salidas</span>
                  <span className="font-medium">
                    - {formatPrecio(col.datos.gastos)}
                  </span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t">
                  <span>Saldo</span>
                  <span>{formatPrecio(col.datos.saldo)}</span>
                </div>
              </div>
            </div>
          ))}

          <div className="md:col-span-2 bg-secondary text-white rounded-lg shadow-md p-6 flex justify-between items-center">
            <span className="text-lg font-semibold">
              Saldo neto del período
            </span>
            <span className="text-3xl font-bold">
              {formatPrecio(saldo.saldo_total)}
            </span>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default CajaDashboard;
