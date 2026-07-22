// src/pages/admin/CajaDashboard.jsx
import { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { cajaAPI } from "../../services/api";
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
  const [transferenciaContado, setTransferenciaContado] = useState("");
  const [notasCierre, setNotasCierre] = useState("");
  const [cerrando, setCerrando] = useState(false);

  // Edición del último cierre (ver updateUltimoCierre en el backend -- solo
  // el más reciente se puede corregir, cualquier otro más viejo ya tiene
  // cierres posteriores construidos sobre su acumulado).
  const [editandoCierreId, setEditandoCierreId] = useState(null);
  const [editEfectivoContado, setEditEfectivoContado] = useState("");
  const [editTransferenciaContado, setEditTransferenciaContado] = useState("");
  const [editNotas, setEditNotas] = useState("");
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

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
        "Ingresá el efectivo total que hay en el cajón ahora.",
      );
      return;
    }
    if (transferenciaContado === "" || parseFloat(transferenciaContado) < 0) {
      toast.warning(
        "Falta el conteo",
        "Ingresá el total de transferencias verificadas hasta ahora.",
      );
      return;
    }

    try {
      setCerrando(true);
      const response = await cajaAPI.crearCierre(
        {
          efectivo_contado: parseFloat(efectivoContado),
          transferencia_contado: parseFloat(transferenciaContado),
          notas: notasCierre || undefined,
        },
        token,
      );
      if (response.success) {
        const difEfectivo = response.data.diferencia_efectivo;
        const difTransferencia = response.data.diferencia_transferencia;

        if (difEfectivo === 0 && difTransferencia === 0) {
          toast.success(
            "Caja cerrada",
            "El conteo coincide, sin diferencias en efectivo ni transferencia.",
          );
        } else {
          const partes = [];
          if (difEfectivo !== 0) {
            partes.push(
              `${difEfectivo > 0 ? "sobran" : "faltan"} ${formatPrecio(Math.abs(difEfectivo))} en efectivo`,
            );
          }
          if (difTransferencia !== 0) {
            partes.push(
              `${difTransferencia > 0 ? "sobran" : "faltan"} ${formatPrecio(Math.abs(difTransferencia))} en transferencia`,
            );
          }
          const hayFaltante = difEfectivo < 0 || difTransferencia < 0;
          const mensaje = `${partes.join(" y ")} respecto a lo esperado.`;
          if (hayFaltante) {
            toast.warning("Caja cerrada con diferencia", mensaje);
          } else {
            toast.success("Caja cerrada", mensaje);
          }
        }
        setEfectivoContado("");
        setTransferenciaContado("");
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

  const abrirEdicionCierre = (cierre) => {
    setEditandoCierreId(cierre.id);
    setEditEfectivoContado(String(cierre.efectivo_contado));
    setEditTransferenciaContado(String(cierre.transferencia_contado));
    setEditNotas(cierre.notas || "");
  };

  const cancelarEdicionCierre = () => setEditandoCierreId(null);

  const handleGuardarEdicionCierre = async (id) => {
    if (editEfectivoContado === "" || parseFloat(editEfectivoContado) < 0) {
      toast.warning("Falta el conteo", "Ingresá el efectivo total en caja.");
      return;
    }
    if (
      editTransferenciaContado === "" ||
      parseFloat(editTransferenciaContado) < 0
    ) {
      toast.warning(
        "Falta el conteo",
        "Ingresá el total de transferencias verificadas.",
      );
      return;
    }

    try {
      setGuardandoEdicion(true);
      const response = await cajaAPI.editarUltimoCierre(
        id,
        {
          efectivo_contado: parseFloat(editEfectivoContado),
          transferencia_contado: parseFloat(editTransferenciaContado),
          notas: editNotas || undefined,
        },
        token,
      );
      if (response.success) {
        toast.success("Cierre actualizado", "Los cambios se guardaron correctamente.");
        setEditandoCierreId(null);
        fetchCierres();
      }
    } catch (error) {
      const { title, message, detail } = getErrorInfo(error);
      toast.error(title, message, detail);
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const formatPrecio = (precio) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(precio || 0);
  };

  // La API puede devolver `fecha` como "YYYY-MM-DD" pelado o como string ISO
  // completo ("...T00:00:00.000Z", si el driver de MySQL lo trajo como
  // objeto Date y JSON.stringify lo serializó) -- slice(0,10) toma los
  // primeros 10 caracteres en cualquiera de los dos casos, así el
  // "T00:00:00" de abajo nunca se pega sobre un string que ya termina en
  // "Z" (eso daba "Invalid Date").
  const formatFecha = (fecha) => {
    return new Date(`${fecha.slice(0, 10)}T00:00:00`).toLocaleDateString(
      "es-AR",
      { day: "2-digit", month: "2-digit", year: "numeric" },
    );
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
              Contá el TOTAL que hay ahora, no solo el movimiento de hoy: el
              efectivo real del cajón (arrastra todo lo acumulado antes) y el
              total de transferencias que ya verificaste recibidas. El
              sistema compara contra lo que se cargó hoy en ventas/compras/
              salidas.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Efectivo total en caja (ahora) *
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
                  Transferencia total verificada (ahora) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={transferenciaContado}
                  onChange={(e) => setTransferenciaContado(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
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
                    Ventas Efectivo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acumulado Efectivo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transferencia Esperado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transferencia Contado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Diferencia Transferencia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ventas Transferencia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acumulado Transferencia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cierres.map((c, index) => {
                  const esElMasReciente = index === 0;
                  const editando = editandoCierreId === c.id;

                  if (editando) {
                    return (
                      <tr key={c.id} className="bg-yellow-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatFecha(c.fecha)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatPrecio(c.efectivo_esperado)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editEfectivoContado}
                            onChange={(e) => setEditEfectivoContado(e.target.value)}
                            className="w-32 px-2 py-1 border rounded focus:ring-2 focus:ring-primary"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          -
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          -
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          -
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatPrecio(c.transferencia_esperado)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editTransferenciaContado}
                            onChange={(e) =>
                              setEditTransferenciaContado(e.target.value)
                            }
                            className="w-32 px-2 py-1 border rounded focus:ring-2 focus:ring-primary"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          -
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          -
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editNotas}
                            onChange={(e) => setEditNotas(e.target.value)}
                            className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-primary text-sm"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleGuardarEdicionCierre(c.id)}
                              disabled={guardandoEdicion}
                              className="text-green-600 hover:text-green-800 disabled:opacity-50"
                              title="Guardar"
                            >
                              <i className="fas fa-check"></i>
                            </button>
                            <button
                              onClick={cancelarEdicionCierre}
                              disabled={guardandoEdicion}
                              className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
                              title="Cancelar"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFecha(c.fecha)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatPrecio(c.efectivo_contado - c.diferencia_efectivo)}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatPrecio(c.efectivo_esperado)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatPrecio(c.acumulado_efectivo)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatPrecio(
                        c.transferencia_contado - c.diferencia_transferencia,
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatPrecio(c.transferencia_contado)}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                        c.diferencia_transferencia > 0
                          ? "text-green-600"
                          : c.diferencia_transferencia < 0
                            ? "text-red-600"
                            : "text-gray-500"
                      }`}
                    >
                      {c.diferencia_transferencia > 0 ? "+" : ""}
                      {formatPrecio(c.diferencia_transferencia)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatPrecio(c.transferencia_esperado)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatPrecio(c.acumulado_transferencia)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs whitespace-pre-wrap">
                      {c.notas || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {esElMasReciente ? (
                        <button
                          onClick={() => abrirEdicionCierre(c)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar (solo el más reciente se puede corregir)"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                  );
                })}
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
