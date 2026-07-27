// src/pages/admin/VentaDirectaForm.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import ProductSearchSelect from "../../components/admin/ProductSearchSelect";
import ClienteSearchSelect from "../../components/admin/ClienteSearchSelect";
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

  // es_manual + descripcion_manual: ítem no catalogado (ver migración 024).
  // Comparten precio_unitario/cantidad con los ítems de catálogo -- solo al
  // armar el payload en handleSubmit se traducen a producto_id o a
  // descripcion_manual/precio_manual según corresponda. extras (ver
  // migración 025): array anidado, aplica igual a líneas de catálogo y
  // manuales -- no descuenta stock ni cuando referencia un producto real.
  const itemVacio = () => ({
    producto_id: "",
    producto_variante_id: "",
    precio_unitario: 0,
    cantidad: 1,
    // Venta por caja (ver migración 027): vender_por_caja/cajas/
    // precio_total_caja son estado transitorio de este form, nunca se
    // mandan tal cual al backend -- solo sirven para calcular cantidad
    // (cajas * unidades_por_caja del producto) y precio_unitario
    // (precio_total_caja / cantidad) antes de armar el payload, que sigue
    // teniendo la misma forma de siempre (cantidad + precio_unitario).
    vender_por_caja: false,
    cajas: 1,
    precio_total_caja: 0,
    es_manual: false,
    descripcion_manual: "",
    extras: [],
  });

  // Un extra cuelga de una línea (ver migración 025): producto real del
  // catálogo (precio autocompletado pero editable) o texto libre + precio a
  // mano -- siempre agregado a mano con el botón "Agregar extra", nunca
  // automático.
  const extraVacio = () => ({
    producto_id: "",
    producto_variante_id: "",
    descripcion: "",
    precio: 0,
    cantidad: 1,
    es_manual: false,
  });

  const [items, setItems] = useState([itemVacio()]);

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

  const handleClienteChange = (id) => {
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
      // Cambiar de producto invalida cualquier venta por caja que hubiera
      // quedado cargada de la selección anterior.
      newItems[index].vender_por_caja = false;
      newItems[index].cantidad = 1;
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

    if (field === "vender_por_caja") {
      const producto = productos.find(
        (p) => p.id === parseInt(newItems[index].producto_id),
      );
      if (value && producto?.unidades_por_caja) {
        newItems[index].cajas = 1;
        newItems[index].cantidad = producto.unidades_por_caja;
        newItems[index].precio_total_caja = producto.precio_caja;
        newItems[index].precio_unitario =
          producto.precio_caja / producto.unidades_por_caja;
      } else {
        newItems[index].cantidad = 1;
        newItems[index].precio_unitario = producto?.precio_valor || 0;
      }
    }

    if (field === "cajas") {
      const producto = productos.find(
        (p) => p.id === parseInt(newItems[index].producto_id),
      );
      const cajas = parseInt(value) || 0;
      if (producto?.unidades_por_caja) {
        const cantidad = cajas * producto.unidades_por_caja;
        const precioTotalCaja = cajas * producto.precio_caja;
        newItems[index].cantidad = cantidad;
        newItems[index].precio_total_caja = precioTotalCaja;
        newItems[index].precio_unitario = cantidad > 0 ? precioTotalCaja / cantidad : 0;
      }
    }

    if (field === "precio_total_caja") {
      const cantidad = parseInt(newItems[index].cantidad) || 0;
      const precioTotalCaja = parseFloat(value) || 0;
      newItems[index].precio_unitario = cantidad > 0 ? precioTotalCaja / cantidad : 0;
    }

    setItems(newItems);
  };

  const agregarItem = () => {
    setItems([itemVacio(), ...items]);
  };

  const agregarItemManual = () => {
    setItems([{ ...itemVacio(), es_manual: true }, ...items]);
  };

  // Cambia una línea entre catálogo <-> manual sin perder cantidad/precio ya
  // cargados. El vendedor a veces tipea un ítem manual porque no encontró el
  // producto en el buscador, pero existe en el catálogo -- necesita poder
  // arreglar esa línea en el momento, no solo borrarla y empezar de nuevo.
  const toggleItemManual = (index) => {
    const newItems = [...items];
    const item = newItems[index];
    newItems[index] = item.es_manual
      ? { ...item, es_manual: false, descripcion_manual: "", producto_id: "", producto_variante_id: "" }
      : { ...item, es_manual: true, producto_id: "", producto_variante_id: "" };
    setItems(newItems);
  };

  const eliminarItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const agregarExtra = (itemIndex) => {
    const newItems = [...items];
    newItems[itemIndex] = {
      ...newItems[itemIndex],
      extras: [extraVacio(), ...(newItems[itemIndex].extras || [])],
    };
    setItems(newItems);
  };

  const handleExtraChange = (itemIndex, extraIndex, field, value) => {
    const newItems = [...items];
    const newExtras = [...newItems[itemIndex].extras];
    newExtras[extraIndex] = { ...newExtras[extraIndex], [field]: value };

    if (field === "producto_id") {
      const producto = productos.find((p) => p.id === parseInt(value));
      // Cambiar de producto invalida cualquier variante que hubiera quedado
      // elegida para el producto anterior (mismo motivo que handleItemChange
      // resetea producto_variante_id de un ítem al cambiar de producto).
      newExtras[extraIndex].producto_variante_id = "";
      if (producto && producto.precio_tipo !== "variantes" && producto.precio_valor) {
        newExtras[extraIndex].precio = producto.precio_valor;
      }
    }

    if (field === "producto_variante_id" && value) {
      const producto = productos.find(
        (p) => p.id === parseInt(newExtras[extraIndex].producto_id),
      );
      // El padre de un producto precio_tipo='variantes' no tiene
      // precio_valor propio -- el precio real sale de la variante elegida.
      const variante = producto?.variantes?.find(
        (v) => v.id === parseInt(value),
      );
      if (variante) {
        newExtras[extraIndex].precio = variante.precio_valor;
      }
    }

    newItems[itemIndex] = { ...newItems[itemIndex], extras: newExtras };
    setItems(newItems);
  };

  // Igual que toggleItemManual pero un nivel más abajo -- cambia un extra
  // entre "producto de catálogo" y "texto libre" sin perder precio/cantidad.
  const toggleExtraManual = (itemIndex, extraIndex) => {
    const newItems = [...items];
    const newExtras = [...newItems[itemIndex].extras];
    const extra = newExtras[extraIndex];
    newExtras[extraIndex] = extra.es_manual
      ? { ...extra, es_manual: false, descripcion: "", producto_id: "", producto_variante_id: "" }
      : { ...extra, es_manual: true, producto_id: "", producto_variante_id: "" };
    newItems[itemIndex] = { ...newItems[itemIndex], extras: newExtras };
    setItems(newItems);
  };

  const eliminarExtra = (itemIndex, extraIndex) => {
    const newItems = [...items];
    newItems[itemIndex] = {
      ...newItems[itemIndex],
      extras: newItems[itemIndex].extras.filter((_, i) => i !== extraIndex),
    };
    setItems(newItems);
  };

  const calcularSubtotalExtras = (item) =>
    (item.extras || []).reduce(
      (sum, extra) =>
        sum + parseFloat(extra.precio || 0) * parseInt(extra.cantidad || 0),
      0,
    );

  const calcularSumaItems = () => {
    return items.reduce((sum, item) => {
      return (
        sum +
        parseFloat(item.precio_unitario || 0) * parseInt(item.cantidad || 0) +
        calcularSubtotalExtras(item)
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

    const itemsValidos = items.filter((item) =>
      item.es_manual
        ? item.descripcion_manual.trim() && item.precio_unitario > 0 && item.cantidad > 0
        : item.producto_id && item.cantidad > 0,
    );
    if (itemsValidos.length === 0) {
      toast.warning("Sin productos", "Agregá al menos un producto a la venta.");
      return;
    }

    const itemSinMedida = itemsValidos.find((item) => {
      if (item.es_manual) return false;
      const producto = productos.find(
        (p) => p.id === parseInt(item.producto_id),
      );
      return (
        producto?.precio_tipo === "variantes" && !item.producto_variante_id
      );
    });
    if (itemSinMedida) {
      toast.warning(
        "Falta elegir la variante",
        "Uno de los productos tiene variantes -- elegí una variante antes de guardar.",
      );
      return;
    }

    // Mismo chequeo que itemSinMedida, pero para extras (ver migración 029):
    // un extra que referencia un producto con variantes tampoco puede
    // guardarse sin elegir cuál, o el backend no sabría de qué variante
    // descontar stock.
    const extraSinMedida = itemsValidos
      .flatMap((item) => item.extras || [])
      .find((extra) => {
        if (extra.es_manual || !extra.producto_id) return false;
        const producto = productos.find(
          (p) => p.id === parseInt(extra.producto_id),
        );
        return (
          producto?.precio_tipo === "variantes" && !extra.producto_variante_id
        );
      });
    if (extraSinMedida) {
      toast.warning(
        "Falta elegir la variante",
        "Uno de los extras tiene variantes -- elegí una variante antes de guardar.",
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

    // El faltante nunca se permite. El sobrante solo se permite si hay un
    // cliente vinculado -- el excedente se le acredita como saldo a favor
    // (vuelto no retirado, ver ventasController.createVentaDirecta); sin
    // cliente no hay a quién acreditarle esa plata, así que sigue bloqueando
    // igual que antes.
    if (diferencia < -0.01 || (diferencia > 0.01 && !clienteId)) {
      toast.warning(
        diferencia < -0.01 ? "El monto no coincide" : "Falta el cliente",
        diferencia < -0.01
          ? "El efectivo + transferencia + a cuenta debe coincidir con el total a pagar."
          : "Para acreditar el vuelto como saldo a favor hay que vincular un cliente registrado.",
      );
      return;
    }

    // Igual que itemsValidos: un extra a medio completar (borrador vacío) se
    // descarta en silencio en vez de bloquear el submit -- el vendedor puede
    // haber abierto "Agregar extra" y arrepentirse sin tener que borrarlo a mano.
    const construirExtrasPayload = (item) =>
      (item.extras || [])
        .filter((extra) =>
          extra.es_manual
            ? extra.descripcion.trim() && extra.precio > 0 && extra.cantidad > 0
            : extra.producto_id && extra.precio > 0 && extra.cantidad > 0,
        )
        .map((extra) =>
          extra.es_manual
            ? {
                descripcion: extra.descripcion.trim(),
                precio: parseFloat(extra.precio),
                cantidad: parseInt(extra.cantidad),
              }
            : {
                producto_id: parseInt(extra.producto_id),
                producto_variante_id: extra.producto_variante_id
                  ? parseInt(extra.producto_variante_id)
                  : null,
                precio: parseFloat(extra.precio),
                cantidad: parseInt(extra.cantidad),
              },
        );

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
        items: itemsValidos.map((item) =>
          item.es_manual
            ? {
                descripcion_manual: item.descripcion_manual.trim(),
                precio_manual: parseFloat(item.precio_unitario),
                cantidad: parseInt(item.cantidad),
                extras: construirExtrasPayload(item),
              }
            : {
                producto_id: parseInt(item.producto_id),
                producto_variante_id: item.producto_variante_id
                  ? parseInt(item.producto_variante_id)
                  : null,
                precio_unitario: parseFloat(item.precio_unitario),
                cantidad: parseInt(item.cantidad),
                cajas_vendidas: item.vender_por_caja ? parseInt(item.cajas) : null,
                extras: construirExtrasPayload(item),
              },
        ),
      };

      const response = await ventasAPI.createDirecta(ventaData, token);
      if (response.success) {
        // Igual que en CajaDashboard.crearCierre: el mensaje del toast se arma
        // según lo que devolvió el backend en vez de ser siempre el mismo texto
        // fijo, para que el vuelto acreditado como saldo a favor (ver
        // ventasController.createVentaDirecta) quede visible en el momento,
        // no solo mirando después la ficha del cliente.
        const vueltoAFavor = response.data?.vuelto_a_favor || 0;
        toast.success(
          "Venta registrada",
          vueltoAFavor > 0
            ? `La venta se cargó correctamente. Se acreditaron ${formatPrecio(vueltoAFavor)} como saldo a favor del cliente.`
            : "La venta se cargó correctamente.",
        );
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
                  <ClienteSearchSelect
                    clientes={clientes}
                    value={clienteId}
                    onChange={handleClienteChange}
                    getOptionLabel={(c) => c.nombre_completo}
                    placeholder="Sin vincular / mostrador anónimo -- buscar cliente..."
                  />
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
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={agregarItem}
                      className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
                    >
                      <i className="fas fa-plus mr-1"></i>
                      Agregar Producto
                    </button>
                    <button
                      type="button"
                      onClick={agregarItemManual}
                      className="text-sm bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 transition-colors"
                    >
                      <i className="fas fa-pen mr-1"></i>
                      Agregar Ítem Manual
                    </button>
                  </div>
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
                          <span className="font-medium text-gray-700 flex items-center gap-2">
                            Producto {index + 1}
                            {item.es_manual && (
                              <span className="text-xs font-semibold bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                                <i className="fas fa-pen mr-1"></i>
                                Manual
                              </span>
                            )}
                            {item.vender_por_caja && (
                              <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                <i className="fas fa-box mr-1"></i>
                                Caja x{item.cajas}
                              </span>
                            )}
                          </span>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => toggleItemManual(index)}
                              className="text-primary hover:underline text-xs"
                            >
                              {item.es_manual
                                ? "Buscar producto de catálogo"
                                : "Convertir en ítem manual"}
                            </button>
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
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {item.es_manual ? (
                            <div className="md:col-span-2">
                              <label className="block text-sm text-gray-600 mb-1">
                                Descripción *
                              </label>
                              <input
                                type="text"
                                value={item.descripcion_manual}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "descripcion_manual",
                                    e.target.value,
                                  )
                                }
                                placeholder="Ej: reparación de mate, producto sin catalogar..."
                                required
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                              />
                            </div>
                          ) : (
                          <>
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
                                        (prod.precio_tipo === "variantes" &&
                                          prod.precio_valor_max >
                                            prod.precio_valor)
                                      ? `Desde ${formatPrecio(prod.precio_valor)}`
                                      : prod.precio_tipo === "variantes" &&
                                          prod.precio_valor
                                        ? formatPrecio(prod.precio_valor)
                                        : "Consultar"
                                } ${
                                  prod.precio_tipo === "variantes"
                                    ? `(${prod.variantes?.length || 0} variantes)`
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
                                Variante *
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
                                <option value="">Seleccionar variante</option>
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
                          </>
                          )}

                          {/* Vender por caja (ver migración 027): solo
                              aparece si el producto elegido tiene
                              unidades_por_caja cargado en su ficha. */}
                          {!item.es_manual && productoSeleccionado?.unidades_por_caja && (
                            <div className="md:col-span-2">
                              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                                <input
                                  type="checkbox"
                                  checked={item.vender_por_caja}
                                  onChange={(e) =>
                                    handleItemChange(
                                      index,
                                      "vender_por_caja",
                                      e.target.checked,
                                    )
                                  }
                                  className="w-4 h-4 text-primary rounded focus:ring-primary"
                                />
                                Vender por caja (x{productoSeleccionado.unidades_por_caja} unidades)
                              </label>
                            </div>
                          )}

                          {item.vender_por_caja ? (
                            <>
                              <div>
                                <label className="block text-sm text-gray-600 mb-1">
                                  Cantidad de cajas *
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.cajas}
                                  onChange={(e) =>
                                    handleItemChange(index, "cajas", e.target.value)
                                  }
                                  required
                                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                                />
                              </div>
                              <div>
                                <label className="block text-sm text-gray-600 mb-1">
                                  Precio total de las cajas *
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.precio_total_caja}
                                  onChange={(e) =>
                                    handleItemChange(
                                      index,
                                      "precio_total_caja",
                                      e.target.value,
                                    )
                                  }
                                  required
                                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                                />
                              </div>
                              <p className="md:col-span-2 text-xs text-gray-500">
                                = {item.cantidad} unidades a{" "}
                                {formatPrecio(item.precio_unitario)} c/u
                              </p>
                            </>
                          ) : (
                            <>
                              <div>
                                <label className="block text-sm text-gray-600 mb-1">
                                  {item.es_manual ? "Precio *" : "Precio Unitario *"}
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
                            </>
                          )}

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

                          {/* Extras (ver migración 025): siempre agregados a
                              mano, nunca automáticos -- cuelgan de esta línea
                              sin importar si es de catálogo o manual. */}
                          <div className="md:col-span-2 border-t pt-3 mt-1">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-700">
                                Extras
                              </span>
                              <button
                                type="button"
                                onClick={() => agregarExtra(index)}
                                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                              >
                                <i className="fas fa-plus mr-1"></i>
                                Agregar extra
                              </button>
                            </div>

                            {(item.extras || []).length === 0 ? (
                              <p className="text-xs text-gray-400">
                                Sin extras en esta línea.
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {item.extras.map((extra, extraIndex) => (
                                  <div
                                    key={extraIndex}
                                    className="bg-gray-50 border rounded-lg p-3"
                                  >
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="text-xs text-gray-500">
                                        Extra {extraIndex + 1}
                                      </span>
                                      <div className="flex items-center gap-3">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            toggleExtraManual(index, extraIndex)
                                          }
                                          className="text-primary hover:underline text-xs"
                                        >
                                          {extra.es_manual
                                            ? "Buscar producto"
                                            : "Texto libre"}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            eliminarExtra(index, extraIndex)
                                          }
                                          className="text-red-600 hover:text-red-800 text-xs"
                                        >
                                          <i className="fas fa-trash"></i>
                                        </button>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                      {extra.es_manual ? (
                                        <div className="md:col-span-3">
                                          <input
                                            type="text"
                                            value={extra.descripcion}
                                            onChange={(e) =>
                                              handleExtraChange(
                                                index,
                                                extraIndex,
                                                "descripcion",
                                                e.target.value,
                                              )
                                            }
                                            placeholder="Ej: grabado personalizado..."
                                            className="w-full px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary"
                                          />
                                        </div>
                                      ) : (
                                        <div className="md:col-span-3">
                                          <ProductSearchSelect
                                            productos={productos}
                                            value={extra.producto_id}
                                            onChange={(id) =>
                                              handleExtraChange(
                                                index,
                                                extraIndex,
                                                "producto_id",
                                                id,
                                              )
                                            }
                                            placeholder="Buscar producto para el extra..."
                                            getOptionLabel={(prod) =>
                                              `${prod.titulo}${
                                                prod.precio_valor
                                                  ? ` - ${formatPrecio(prod.precio_valor)}`
                                                  : ""
                                              }`
                                            }
                                          />
                                          {(() => {
                                            const productoExtra = productos.find(
                                              (p) => p.id === parseInt(extra.producto_id),
                                            );
                                            if (productoExtra?.precio_tipo !== "variantes") {
                                              return null;
                                            }
                                            return (
                                              <select
                                                value={extra.producto_variante_id}
                                                onChange={(e) =>
                                                  handleExtraChange(
                                                    index,
                                                    extraIndex,
                                                    "producto_variante_id",
                                                    e.target.value,
                                                  )
                                                }
                                                required
                                                className="w-full mt-2 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary"
                                              >
                                                <option value="">Seleccionar variante</option>
                                                {productoExtra.variantes
                                                  ?.filter((v) => v.activo)
                                                  .map((v) => (
                                                    <option key={v.id} value={v.id}>
                                                      {v.nombre} - {formatPrecio(v.precio_valor)}{" "}
                                                      (stock: {v.cantidad})
                                                    </option>
                                                  ))}
                                              </select>
                                            );
                                          })()}
                                        </div>
                                      )}

                                      <div>
                                        <label className="block text-xs text-gray-500 mb-1">
                                          Precio
                                        </label>
                                        <input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          value={extra.precio}
                                          onChange={(e) =>
                                            handleExtraChange(
                                              index,
                                              extraIndex,
                                              "precio",
                                              e.target.value,
                                            )
                                          }
                                          className="w-full px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs text-gray-500 mb-1">
                                          Cantidad
                                        </label>
                                        <input
                                          type="number"
                                          min="1"
                                          value={extra.cantidad}
                                          onChange={(e) =>
                                            handleExtraChange(
                                              index,
                                              extraIndex,
                                              "cantidad",
                                              e.target.value,
                                            )
                                          }
                                          className="w-full px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary"
                                        />
                                      </div>
                                      <div className="flex items-end justify-end text-sm text-gray-600">
                                        {formatPrecio(
                                          parseFloat(extra.precio || 0) *
                                            parseInt(extra.cantidad || 0),
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {(item.extras || []).length > 0 && (
                              <div className="text-right mt-2">
                                <span className="text-sm text-gray-600">
                                  Total línea (con extras):{" "}
                                </span>
                                <span className="font-semibold">
                                  {formatPrecio(
                                    parseFloat(item.precio_unitario || 0) *
                                      parseInt(item.cantidad || 0) +
                                      calcularSubtotalExtras(item),
                                  )}
                                </span>
                              </div>
                            )}
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

                {diferencia < -0.01 && (
                  <p className="text-sm text-red-600 mb-4">
                    {`Faltan ${formatPrecio(Math.abs(diferencia))} para completar el total a pagar.`}
                  </p>
                )}

                {diferencia > 0.01 && (
                  <p
                    className={`text-sm mb-4 ${
                      clienteId ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {clienteId
                      ? `Se acreditarán ${formatPrecio(diferencia)} como saldo a favor del cliente.`
                      : `Sobran ${formatPrecio(diferencia)} respecto al total a pagar.`}
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
