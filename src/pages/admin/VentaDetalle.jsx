// src/pages/admin/VentaDetalle.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import ClienteSearchSelect from "../../components/admin/ClienteSearchSelect";
import { ventasAPI, clientesAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getErrorInfo } from "../../utils/errorHandler";

// Detalle de una venta directa (ventas.tipo = 'venta_directa'). Solo lectura
// para ítems/extras/stock -- la única forma de "corregir" qué se vendió es
// eliminar y volver a cargar (ver ventasController.deleteVentaDirecta), así
// que Editar acá solo cubre los campos de cabecera (ver
// ventasController.updateVentaDirecta para el alcance exacto).
const VentaDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const toast = useToast();

  const [venta, setVenta] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const [fecha, setFecha] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [notas, setNotas] = useState("");
  const [descuento, setDescuento] = useState(0);
  const [montoEfectivo, setMontoEfectivo] = useState("");
  const [montoTransferencia, setMontoTransferencia] = useState("");
  const [montoCuentaCorriente, setMontoCuentaCorriente] = useState("");

  useEffect(() => {
    fetchVenta();
    clientesAPI
      .getAll(token)
      .then((response) => {
        if (response.success) setClientes(response.data || []);
      })
      .catch((error) => console.error("Error cargando clientes:", error));
  }, [id]);

  const fetchVenta = async () => {
    try {
      setLoading(true);
      const response = await ventasAPI.getById(id, token);
      if (response.success) {
        setVenta(response.data);
      }
    } catch (error) {
      const { title, message, detail } = getErrorInfo(error);
      toast.error(title, message, detail);
      if (error?.status === 401) {
        setTimeout(() => navigate("/admin/login"), 2000);
        return;
      }
      navigate("/admin/ventas");
    } finally {
      setLoading(false);
    }
  };

  const formatFecha = (f) => {
    if (!f) return "-";
    return new Date(f).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // input datetime-local necesita "YYYY-MM-DDTHH:mm", sin timezone -- se
  // arma a mano en vez de con toISOString() para no correr la hora local a
  // UTC.
  const formatFechaInput = (f) => {
    if (!f) return "";
    const d = new Date(f);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const formatPrecio = (precio) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(precio || 0);

  const abrirEdicion = () => {
    setFecha(formatFechaInput(venta.fecha));
    setClienteId(venta.cliente_id ? String(venta.cliente_id) : "");
    setClienteNombre(venta.cliente_nombre || "");
    setClienteTelefono(venta.cliente_telefono || "");
    setNotas(venta.notas || "");
    setDescuento(venta.descuento || 0);
    setMontoEfectivo(venta.monto_efectivo || "");
    setMontoTransferencia(venta.monto_transferencia || "");
    setMontoCuentaCorriente(venta.monto_cuenta_corriente || "");
    setEditando(true);
  };

  const cancelarEdicion = () => setEditando(false);

  const handleClienteChange = (idSeleccionado) => {
    const cliente = clientes.find((c) => c.id === parseInt(idSeleccionado));
    setClienteId(idSeleccionado);
    if (cliente) {
      setClienteNombre(cliente.nombre_completo);
      setClienteTelefono(cliente.telefono || "");
    } else {
      setMontoCuentaCorriente("");
    }
  };

  // sumaItems (para mostrar el "monto esperado" en vivo) sale de los ítems
  // que YA tiene la venta -- editar nunca los toca, así que este cálculo es
  // puramente informativo para que el vendedor vea si el monto cuadra antes
  // de guardar. El backend recalcula lo mismo por su cuenta con SUM sobre la
  // base, esto no reemplaza esa validación.
  const sumaItems = (venta?.items || []).reduce((acc, item) => {
    const sumaExtras = (item.extras || []).reduce(
      (accExtra, extra) => accExtra + extra.subtotal,
      0,
    );
    return acc + item.subtotal + sumaExtras;
  }, 0);

  const montoEsperado = sumaItems - (parseFloat(descuento) || 0);
  const montoCargado =
    (parseFloat(montoEfectivo) || 0) +
    (parseFloat(montoTransferencia) || 0) +
    (parseFloat(montoCuentaCorriente) || 0);
  const diferencia = montoCargado - montoEsperado;

  const handleGuardar = async (e) => {
    e.preventDefault();

    if (montoCuentaCorriente && parseFloat(montoCuentaCorriente) > 0 && !clienteId) {
      toast.warning(
        "Falta el cliente",
        "Para vender a cuenta corriente hay que vincular un cliente registrado.",
      );
      return;
    }

    if (Math.abs(diferencia) > 0.01) {
      toast.warning(
        "El monto no coincide",
        "El efectivo + transferencia + a cuenta debe coincidir con el total de los productos menos el descuento.",
      );
      return;
    }

    try {
      setGuardando(true);
      const response = await ventasAPI.update(
        id,
        {
          // El input datetime-local ya entrega la hora LOCAL tal cual la
          // tipeó el vendedor (sin info de timezone) -- se manda ese mismo
          // valor como string "YYYY-MM-DD HH:mm:00" en vez de pasar por
          // Date/toISOString, que reinterpretaría "fecha" como local, la
          // convertiría a UTC, y correría la hora guardada (DATETIME de
          // MySQL acá se trata como hora local, igual que CURRENT_TIMESTAMP
          // en el resto de las tablas).
          fecha: fecha ? `${fecha.replace("T", " ")}:00` : undefined,
          cliente_id: clienteId || undefined,
          cliente_nombre: clienteNombre || undefined,
          cliente_telefono: clienteTelefono || undefined,
          notas: notas || undefined,
          descuento: parseFloat(descuento) || 0,
          monto_efectivo: parseFloat(montoEfectivo) || 0,
          monto_transferencia: parseFloat(montoTransferencia) || 0,
          monto_cuenta_corriente: parseFloat(montoCuentaCorriente) || 0,
        },
        token,
      );
      if (response.success) {
        toast.success("Venta actualizada", "Los cambios se guardaron correctamente.");
        setEditando(false);
        fetchVenta();
      }
    } catch (error) {
      const { title, message, detail } = getErrorInfo(error);
      toast.error(title, message, detail);
      if (error?.status === 401)
        setTimeout(() => navigate("/admin/login"), 2000);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async () => {
    if (
      !window.confirm(
        `¿Eliminar esta venta directa #${id}? Se revertirá el stock descontado y cualquier movimiento de cuenta corriente asociado. Esta acción no se puede deshacer.`,
      )
    )
      return;

    try {
      setEliminando(true);
      const response = await ventasAPI.remove(id, token);
      if (response.success) {
        toast.success("Venta eliminada", "El stock y la cuenta corriente fueron revertidos.");
        navigate("/admin/ventas");
      }
    } catch (error) {
      const { title, message, detail } = getErrorInfo(error);
      toast.error(title, message, detail);
    } finally {
      setEliminando(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gris-medio">Cargando venta...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!venta) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-xl text-gray-600">Venta no encontrada</p>
          <Link
            to="/admin/ventas"
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
          to="/admin/ventas"
          className="text-primary hover:underline mb-2 inline-block"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Volver a ventas
        </Link>
        <div className="flex justify-between items-start flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-secondary">
              Venta directa #{venta.id}
            </h2>
            <p className="text-gris-medio">
              Creada el {formatFecha(venta.fecha)}
            </p>
          </div>
          <div className="flex gap-2">
            {!editando && (
              <button
                onClick={abrirEdicion}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-accent transition-colors flex items-center gap-2"
              >
                <i className="fas fa-edit"></i>
                Editar
              </button>
            )}
            <button
              onClick={handleEliminar}
              disabled={eliminando}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <i className="fas fa-trash"></i>
              {eliminando ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Cliente */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <i className="fas fa-user text-primary"></i>
              Cliente
              {venta.cliente_id && !editando && (
                <Link
                  to={`/admin/clientes/${venta.cliente_id}`}
                  className="text-sm font-normal text-primary hover:underline ml-auto"
                >
                  Ver ficha del cliente
                </Link>
              )}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Nombre</p>
                <p className="font-medium">
                  {venta.cliente_nombre || "Venta de mostrador"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Teléfono</p>
                <p className="font-medium">{venta.cliente_telefono || "-"}</p>
              </div>
            </div>
          </div>

          {/* Productos (solo lectura -- ver comentario del componente) */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <i className="fas fa-box text-primary"></i>
              Productos ({venta.items?.length || 0})
            </h3>
            <div className="space-y-3">
              {(venta.items || []).map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2 flex-wrap">
                        {item.variante_nombre
                          ? `${item.producto_titulo} — ${item.variante_nombre}`
                          : item.producto_titulo}
                        {item.es_manual && (
                          <span className="text-xs font-semibold bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                            <i className="fas fa-pen mr-1"></i>
                            Manual
                          </span>
                        )}
                        {item.cajas_vendidas && (
                          <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            <i className="fas fa-box mr-1"></i>
                            Caja x{item.cajas_vendidas}
                          </span>
                        )}
                      </h4>
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

                  {item.extras && item.extras.length > 0 && (
                    <div className="mt-3 pt-3 border-t space-y-1">
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Extras
                      </p>
                      {item.extras.map((extra) => (
                        <div
                          key={extra.id}
                          className="flex justify-between text-sm text-gray-600"
                        >
                          <span>
                            {extra.cantidad}x{" "}
                            {extra.variante_nombre
                              ? `${extra.extra_titulo} — ${extra.variante_nombre}`
                              : extra.extra_titulo}
                          </span>
                          <span>{formatPrecio(extra.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notas */}
          {!editando && venta.notas && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <i className="fas fa-sticky-note text-primary"></i>
                Notas
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">{venta.notas}</p>
            </div>
          )}
        </div>

        {/* Resumen / edición */}
        <div className="space-y-6">
          {editando ? (
            <form
              onSubmit={handleGuardar}
              className="bg-white rounded-lg shadow-md p-6 space-y-4 sticky top-6"
            >
              <h3 className="text-lg font-semibold">Editar venta</h3>
              <p className="text-xs text-gray-500">
                Solo se pueden editar los datos de cabecera. Los productos
                vendidos y el stock no se modifican acá -- si hay que
                corregir qué se vendió, eliminá la venta y cargala de nuevo.
              </p>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Fecha</label>
                <input
                  type="datetime-local"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Cliente registrado
                </label>
                <ClienteSearchSelect
                  clientes={clientes}
                  value={clienteId}
                  onChange={handleClienteChange}
                  getOptionLabel={(c) => c.nombre_completo}
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={clienteTelefono}
                    onChange={(e) => setClienteTelefono(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Notas
                </label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows="2"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="pt-3 border-t space-y-3">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Total productos:</span>
                  <span className="font-medium">{formatPrecio(sumaItems)}</span>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Descuento (ARS)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={descuento}
                    onChange={(e) => setDescuento(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>A cobrar:</span>
                  <span>{formatPrecio(montoEsperado)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Efectivo
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={montoEfectivo}
                    onChange={(e) => setMontoEfectivo(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Transferencia
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={montoTransferencia}
                    onChange={(e) => setMontoTransferencia(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
                {clienteId && (
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      A cuenta (fiado)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={montoCuentaCorriente}
                      onChange={(e) => setMontoCuentaCorriente(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                    />
                  </div>
                )}
              </div>

              {Math.abs(diferencia) > 0.01 && (
                <p className="text-sm text-red-600">
                  {diferencia > 0
                    ? `Sobran ${formatPrecio(diferencia)} respecto al total a pagar.`
                    : `Faltan ${formatPrecio(Math.abs(diferencia))} para completar el total a pagar.`}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 bg-primary text-white py-2 px-4 rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
                >
                  {guardando ? "Guardando..." : "Guardar cambios"}
                </button>
                <button
                  type="button"
                  onClick={cancelarEdicion}
                  disabled={guardando}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <h3 className="text-lg font-semibold mb-4">Pago</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Total productos:</span>
                  <span className="font-medium">{formatPrecio(sumaItems)}</span>
                </div>
                {venta.descuento > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Descuento:</span>
                    <span>- {formatPrecio(venta.descuento)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t">
                  <span>Total:</span>
                  <span>{formatPrecio(venta.monto_total)}</span>
                </div>
                <div className="pt-3 border-t space-y-2 text-sm">
                  {venta.monto_efectivo > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Efectivo:</span>
                      <span>{formatPrecio(venta.monto_efectivo)}</span>
                    </div>
                  )}
                  {venta.monto_transferencia > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Transferencia:</span>
                      <span>{formatPrecio(venta.monto_transferencia)}</span>
                    </div>
                  )}
                  {venta.monto_cuenta_corriente > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>A cuenta (fiado):</span>
                      <span>{formatPrecio(venta.monto_cuenta_corriente)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default VentaDetalle;
