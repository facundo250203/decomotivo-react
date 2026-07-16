// src/pages/admin/VentaDirectaForm.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import ProductSearchSelect from "../../components/admin/ProductSearchSelect";
import { ventasAPI, adminProductsAPI, clientesAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getErrorInfo } from "../../utils/errorHandler";

const VentaDirectaForm = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [productos, setProductos] = useState([]);
  const [loadingProductos, setLoadingProductos] = useState(true);
  const [clientes, setClientes] = useState([]);

  const [clienteId, setClienteId] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [descuento, setDescuento] = useState(0);
  const [montoEfectivo, setMontoEfectivo] = useState("");
  const [montoTransferencia, setMontoTransferencia] = useState("");
  const [montoCuentaCorriente, setMontoCuentaCorriente] = useState("");
  const [notas, setNotas] = useState("");

  // Saldo > 0 = el cliente debe esa plata. Saldo < 0 = tiene saldo a favor
  // por ese valor absoluto -- se aplica siempre automático al cobrar (sin
  // opt-out), ver ventasController.createVentaDirecta.
  const [saldoCliente, setSaldoCliente] = useState(0);

  const [items, setItems] = useState([
    { producto_id: "", producto_variante_id: "", precio_unitario: 0, cantidad: 1 },
  ]);

  useEffect(() => {
    fetchProductos();
    fetchClientes();
  }, []);

  useEffect(() => {
    if (!clienteId) {
      setSaldoCliente(0);
      return;
    }
    clientesAPI
      .getCuentaCorriente(clienteId, token)
      .then((response) => {
        if (response.success) setSaldoCliente(response.data.saldo);
      })
      .catch((error) => console.error("Error obteniendo cuenta corriente:", error));
  }, [clienteId, token]);

  const fetchProductos = async () => {
    try {
      setLoadingProductos(true);
      const response = await adminProductsAPI.getAll(token);
      if (response.success) {
        setProductos((response.data || []).filter((p) => p.activo));
      }
    } catch (error) {
      const { title, message, detail } = getErrorInfo(error);
      toast.error(title, message, detail);
    } finally {
      setLoadingProductos(false);
    }
  };

  const fetchClientes = async () => {
    try {
      const response = await clientesAPI.getAll(token);
      if (response.success) {
        setClientes(response.data || []);
      }
    } catch (error) {
      console.error("Error cargando clientes:", error);
    }
  };

  const handleClienteChange = (e) => {
    const id = e.target.value;
    const cliente = clientes.find((c) => c.id === parseInt(id));
    setClienteId(id);
    if (cliente) {
      setClienteNombre(cliente.nombre_completo);
      setClienteTelefono(cliente.telefono || "");
    } else {
      // Sin cliente vinculado no hay a quién fiarle -- una venta de
      // mostrador anónima no puede ir a cuenta corriente.
      setMontoCuentaCorriente("");
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    if (field === "producto_id") {
      const producto = productos.find((p) => p.id === parseInt(value));
      newItems[index].producto_variante_id = "";
      if (producto && producto.precio_tipo !== "variantes" && producto.precio_valor) {
        newItems[index].precio_unitario = producto.precio_valor;
      }
    }

    if (field === "producto_variante_id" && value) {
      const producto = productos.find(
        (p) => p.id === parseInt(newItems[index].producto_id),
      );
      const variante = producto?.variantes?.find(
        (v) => v.id === parseInt(value),
      );
      if (variante) {
        newItems[index].precio_unitario = variante.precio_valor;
      }
    }

    setItems(newItems);
  };

  const agregarItem = () => {
    setItems([
      ...items,
      { producto_id: "", producto_variante_id: "", precio_unitario: 0, cantidad: 1 },
    ]);
  };

  const eliminarItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calcularSumaItems = () => {
    return items.reduce((sum, item) => {
      return (
        sum + parseFloat(item.precio_unitario || 0) * parseInt(item.cantidad || 0)
      );
    }, 0);
  };

  const montoEsperado = calcularSumaItems() - parseFloat(descuento || 0);

  // El saldo a favor se aplica siempre automático (sin opt-out) -- reduce
  // lo que hay que cobrar antes de comparar contra lo cargado a mano.
  const saldoAFavorDisponible = saldoCliente < 0 ? -saldoCliente : 0;
  const saldoAFavorAplicado = Math.min(saldoAFavorDisponible, montoEsperado);
  const montoAPagar = montoEsperado - saldoAFavorAplicado;

  const montoCargado =
    (parseFloat(montoEfectivo) || 0) +
    (parseFloat(montoTransferencia) || 0) +
    (parseFloat(montoCuentaCorriente) || 0);
  const diferencia = montoCargado - montoAPagar;

  const formatPrecio = (precio) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(precio);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const itemsValidos = items.filter(
      (item) => item.producto_id && item.cantidad > 0,
    );
    if (itemsValidos.length === 0) {
      toast.warning("Sin productos", "Agregá al menos un producto a la venta.");
      return;
    }

    const itemSinMedida = itemsValidos.find((item) => {
      const producto = productos.find(
        (p) => p.id === parseInt(item.producto_id),
      );
      return (
        producto?.precio_tipo === "variantes" && !item.producto_variante_id
      );
    });
    if (itemSinMedida) {
      toast.warning(
        "Falta elegir la medida",
        "Uno de los productos tiene variantes -- elegí una medida antes de guardar.",
      );
      return;
    }

    if (montoCuentaCorriente && !clienteId) {
      toast.warning(
        "Falta el cliente",
        "Para vender a cuenta corriente hay que vincular un cliente registrado.",
      );
      return;
    }

    if (Math.abs(diferencia) > 0.01) {
      toast.warning(
        "El monto no coincide",
        "El efectivo + transferencia + a cuenta debe coincidir con el total a pagar.",
      );
      return;
    }

    try {
      setLoading(true);
      const ventaData = {
        cliente_id: clienteId || undefined,
        cliente_nombre: clienteNombre || undefined,
        cliente_telefono: clienteTelefono || undefined,
        descuento: parseFloat(descuento) || 0,
        monto_efectivo: parseFloat(montoEfectivo) || 0,
        monto_transferencia: parseFloat(montoTransferencia) || 0,
        monto_cuenta_corriente: parseFloat(montoCuentaCorriente) || 0,
        notas: notas || undefined,
        items: itemsValidos.map((item) => ({
          producto_id: parseInt(item.producto_id),
          producto_variante_id: item.producto_variante_id
            ? parseInt(item.producto_variante_id)
            : null,
          precio_unitario: parseFloat(item.precio_unitario),
          cantidad: parseInt(item.cantidad),
        })),
      };

      const response = await ventasAPI.createDirecta(ventaData, token);
      if (response.success) {
        toast.success("Venta registrada", "La venta se cargó correctamente.");
        navigate("/admin/ventas");
      }
    } catch (error) {
      const { title, message, detail } = getErrorInfo(error);
      toast.error(title, message, detail);
      if (error?.status === 401)
        setTimeout(() => navigate("/admin/login"), 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl">
        <div className="mb-6">
          <Link
            to="/admin/ventas"
            className="text-primary hover:underline mb-2 inline-block"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Volver a ventas
          </Link>
          <h2 className="text-2xl font-bold text-secondary">
            Nueva Venta Directa
          </h2>
          <p className="text-gris-medio">
            Venta de mostrador: se paga y se entrega en el momento
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Cliente (opcional) */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <i className="fas fa-user text-primary"></i>
                  Cliente (opcional)
                </h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cliente registrado
                  </label>
                  <select
                    value={clienteId}
                    onChange={handleClienteChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Sin vincular / mostrador anónimo</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre_completo}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={clienteNombre}
                      onChange={(e) => setClienteNombre(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Dejalo vacío si es venta de mostrador"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={clienteTelefono}
                      onChange={(e) => setClienteTelefono(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Productos */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <i className="fas fa-box text-primary"></i>
                    Productos
                  </h3>
                  <button
                    type="button"
                    onClick={agregarItem}
                    className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
                  >
                    <i className="fas fa-plus mr-1"></i>
                    Agregar Producto
                  </button>
                </div>

                {loadingProductos ? (
                  <p className="text-center text-gray-500">
                    Cargando productos...
                  </p>
                ) : (
                  <div className="space-y-4">
                    {items.map((item, index) => {
                      const productoSeleccionado = productos.find(
                        (p) => p.id === parseInt(item.producto_id),
                      );
                      const imagenPrincipal =
                        productoSeleccionado?.imagenes?.[0];

                      return (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <span className="font-medium text-gray-700">
                            Producto {index + 1}
                          </span>
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => eliminarItem(index)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="md:col-span-2">
                            <label className="block text-sm text-gray-600 mb-1">
                              Producto *
                            </label>
                            <ProductSearchSelect
                              productos={productos}
                              value={item.producto_id}
                              onChange={(id) =>
                                handleItemChange(index, "producto_id", id)
                              }
                              getOptionLabel={(prod) =>
                                `${prod.titulo} - ${
                                  (prod.precio_tipo === "fijo" ||
                                    prod.precio_tipo === "combo") &&
                                  prod.precio_valor
                                    ? formatPrecio(prod.precio_valor)
                                    : prod.precio_tipo === "desde" ||
                                        prod.precio_tipo === "variantes"
                                      ? `Desde ${formatPrecio(prod.precio_valor)}`
                                      : "Consultar"
                                } ${
                                  prod.precio_tipo === "variantes"
                                    ? `(${prod.variantes?.length || 0} medidas)`
                                    : prod.controla_stock
                                      ? `(stock: ${prod.cantidad})`
                                      : "(sin stock)"
                                }`
                              }
                            />
                          </div>

                          {productoSeleccionado?.precio_tipo === "variantes" && (
                            <div className="md:col-span-2">
                              <label className="block text-sm text-gray-600 mb-1">
                                Medida *
                              </label>
                              <select
                                value={item.producto_variante_id}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "producto_variante_id",
                                    e.target.value,
                                  )
                                }
                                required
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                              >
                                <option value="">Seleccionar medida</option>
                                {productoSeleccionado.variantes
                                  ?.filter((v) => v.activo)
                                  .map((v) => (
                                    <option key={v.id} value={v.id}>
                                      {v.nombre} - {formatPrecio(v.precio_valor)}{" "}
                                      (stock: {v.cantidad})
                                    </option>
                                  ))}
                              </select>
                            </div>
                          )}

                          {productoSeleccionado && (
                            <div className="md:col-span-2 flex gap-3 bg-gray-50 border rounded-lg p-3">
                              {imagenPrincipal ? (
                                <img
                                  src={imagenPrincipal.url}
                                  alt={imagenPrincipal.alt_text || productoSeleccionado.titulo}
                                  className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                                />
                              ) : (
                                <div className="w-16 h-16 flex items-center justify-center bg-gray-200 rounded-md flex-shrink-0 text-gray-400">
                                  <i className="fas fa-image"></i>
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-medium text-gray-800 truncate">
                                  {productoSeleccionado.titulo}
                                </p>
                                <p className="text-sm text-gray-500 line-clamp-2">
                                  {productoSeleccionado.descripcion ||
                                    "Sin descripción cargada."}
                                </p>
                              </div>
                            </div>
                          )}

                          <div>
                            <label className="block text-sm text-gray-600 mb-1">
                              Precio Unitario *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.precio_unitario}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "precio_unitario",
                                  e.target.value,
                                )
                              }
                              required
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                            />
                            {productoSeleccionado?.precio_tipo ===
                              "consultar" && (
                              <p className="text-xs text-orange-600 mt-1">
                                Este producto es &quot;a consultar&quot; —
                                ingresá el precio acordado con el cliente.
                              </p>
                            )}
                            {productoSeleccionado?.precio_tipo === "desde" && (
                              <p className="text-xs text-orange-600 mt-1">
                                Precio de referencia (desde). Ajustalo si
                                acordaste otro precio con el cliente.
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm text-gray-600 mb-1">
                              Cantidad *
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={item.cantidad}
                              onChange={(e) =>
                                handleItemChange(index, "cantidad", e.target.value)
                              }
                              required
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                            />
                          </div>

                          <div className="md:col-span-2 text-right">
                            <span className="text-sm text-gray-600">
                              Subtotal:{" "}
                            </span>
                            <span className="font-semibold text-lg">
                              {formatPrecio(
                                parseFloat(item.precio_unitario || 0) *
                                  parseInt(item.cantidad || 0),
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Notas */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <i className="fas fa-sticky-note text-primary"></i>
                  Notas
                </h3>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Resumen y pago */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
                <h3 className="text-lg font-semibold mb-4">Pago</h3>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Total productos:</span>
                    <span className="font-medium">
                      {formatPrecio(calcularSumaItems())}
                    </span>
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

                  <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t">
                    <span>A cobrar:</span>
                    <span>{formatPrecio(montoEsperado)}</span>
                  </div>

                  {clienteId && saldoCliente !== 0 && (
                    <div
                      className={`flex justify-between text-sm ${
                        saldoCliente > 0 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      <span>
                        {saldoCliente > 0
                          ? "El cliente debe:"
                          : "Saldo a favor del cliente:"}
                      </span>
                      <span className="font-medium">
                        {formatPrecio(Math.abs(saldoCliente))}
                      </span>
                    </div>
                  )}

                  {saldoAFavorAplicado > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Saldo a favor aplicado:</span>
                      <span className="font-medium">
                        -{formatPrecio(saldoAFavorAplicado)}
                      </span>
                    </div>
                  )}

                  {saldoAFavorAplicado > 0 && (
                    <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                      <span>Total a pagar:</span>
                      <span>{formatPrecio(montoAPagar)}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 mb-4">
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
                      placeholder="0.00"
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
                      placeholder="0.00"
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
                        placeholder="0.00"
                      />
                    </div>
                  )}
                </div>

                {Math.abs(diferencia) > 0.01 && (
                  <p className="text-sm text-red-600 mb-4">
                    {diferencia > 0
                      ? `Sobran ${formatPrecio(diferencia)} respecto al total a pagar.`
                      : `Faltan ${formatPrecio(Math.abs(diferencia))} para completar el total a pagar.`}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Registrando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check mr-2"></i>
                      Registrar Venta
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default VentaDirectaForm;
