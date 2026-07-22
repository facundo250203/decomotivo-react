// src/pages/admin/CompraForm.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import ProveedorSearchSelect from "../../components/admin/ProveedorSearchSelect";
import ProductSearchSelect from "../../components/admin/ProductSearchSelect";
import {
  comprasAPI,
  proveedoresAPI,
  adminProductsAPI,
} from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getErrorInfo } from "../../utils/errorHandler";

const CompraForm = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loadingDatos, setLoadingDatos] = useState(true);

  // 'proveedor' o 'propia'
  const [origen, setOrigen] = useState("proveedor");
  const [proveedorId, setProveedorId] = useState("");
  const [montoEfectivo, setMontoEfectivo] = useState("");
  const [montoTransferencia, setMontoTransferencia] = useState("");
  const [notas, setNotas] = useState("");

  const [items, setItems] = useState([
    { producto_id: "", producto_variante_id: "", costo_unitario: 0, cantidad: 1 },
  ]);

  useEffect(() => {
    fetchDatos();
  }, []);

  const fetchDatos = async () => {
    try {
      setLoadingDatos(true);
      const [productosRes, proveedoresRes] = await Promise.all([
        adminProductsAPI.getAll(token),
        proveedoresAPI.getAll(token),
      ]);
      if (productosRes.success) {
        setProductos((productosRes.data || []).filter((p) => p.activo));
      }
      if (proveedoresRes.success) setProveedores(proveedoresRes.data || []);
    } catch (error) {
      const { title, message, detail } = getErrorInfo(error);
      toast.error(title, message, detail);
    } finally {
      setLoadingDatos(false);
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    // Cambiar de producto invalida la medida elegida antes.
    if (field === "producto_id") {
      newItems[index].producto_variante_id = "";
    }

    setItems(newItems);
  };

  const agregarItem = () => {
    setItems([
      { producto_id: "", producto_variante_id: "", costo_unitario: 0, cantidad: 1 },
      ...items,
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
        sum + parseFloat(item.costo_unitario || 0) * parseInt(item.cantidad || 0)
      );
    }, 0);
  };

  const formatPrecio = (precio) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(precio);
  };

  const esProduccionPropia = origen === "propia";
  const montoCargado =
    (parseFloat(montoEfectivo) || 0) + (parseFloat(montoTransferencia) || 0);
  const diferencia = montoCargado - calcularSumaItems();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const itemsValidos = items.filter(
      (item) => item.producto_id && item.cantidad > 0,
    );
    if (itemsValidos.length === 0) {
      toast.warning("Sin productos", "Agregá al menos un producto a la compra.");
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
        "Falta elegir la variante",
        "Uno de los productos tiene variantes -- elegí qué variante estás reponiendo.",
      );
      return;
    }

    if (!esProduccionPropia) {
      if (!proveedorId) {
        toast.warning("Proveedor requerido", "Seleccioná un proveedor.");
        return;
      }
      if (Math.abs(diferencia) > 0.01) {
        toast.warning(
          "El monto no coincide",
          "El efectivo + transferencia debe coincidir con el total de los productos.",
        );
        return;
      }
    }

    try {
      setLoading(true);
      const compraData = {
        proveedor_id: esProduccionPropia ? null : parseInt(proveedorId),
        monto_efectivo: esProduccionPropia ? 0 : parseFloat(montoEfectivo) || 0,
        monto_transferencia: esProduccionPropia
          ? 0
          : parseFloat(montoTransferencia) || 0,
        notas: notas || undefined,
        items: itemsValidos.map((item) => ({
          producto_id: parseInt(item.producto_id),
          producto_variante_id: item.producto_variante_id
            ? parseInt(item.producto_variante_id)
            : null,
          costo_unitario: parseFloat(item.costo_unitario),
          cantidad: parseInt(item.cantidad),
        })),
      };

      const response = await comprasAPI.create(compraData, token);
      if (response.success) {
        toast.success("Compra registrada", "El stock fue actualizado.");
        navigate("/admin/compras");
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
            to="/admin/compras"
            className="text-primary hover:underline mb-2 inline-block"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Volver a compras
          </Link>
          <h2 className="text-2xl font-bold text-secondary">Nueva Compra</h2>
          <p className="text-gris-medio">
            Registrá una compra a proveedor o una entrada de producción propia
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Origen */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <i className="fas fa-truck text-primary"></i>
                  Origen de la compra
                </h3>
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="origen"
                      value="proveedor"
                      checked={origen === "proveedor"}
                      onChange={() => setOrigen("proveedor")}
                    />
                    <span>Compra a proveedor</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="origen"
                      value="propia"
                      checked={origen === "propia"}
                      onChange={() => setOrigen("propia")}
                    />
                    <span>Producción propia</span>
                  </label>
                </div>

                {esProduccionPropia ? (
                  <p className="text-sm text-gray-500">
                    No se registra ningún pago: el costo cargado por producto
                    es solo una referencia para tus márgenes.
                  </p>
                ) : (
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Proveedor *
                    </label>
                    <ProveedorSearchSelect
                      proveedores={proveedores}
                      value={proveedorId}
                      onChange={setProveedorId}
                      getOptionLabel={(prov) => prov.nombre}
                      placeholder="Buscar proveedor..."
                    />
                    {proveedores.length === 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        No hay proveedores cargados.{" "}
                        <Link
                          to="/admin/proveedores/nuevo"
                          className="text-primary hover:underline"
                        >
                          Crear uno
                        </Link>
                      </p>
                    )}
                  </div>
                )}
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

                {loadingDatos ? (
                  <p className="text-center text-gray-500">Cargando...</p>
                ) : (
                  <div className="space-y-4">
                    {items.map((item, index) => {
                      const productoSeleccionado = productos.find(
                        (p) => p.id === parseInt(item.producto_id),
                      );

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
                              onChange={(value) =>
                                handleItemChange(index, "producto_id", value)
                              }
                              getOptionLabel={(prod) =>
                                `${prod.titulo} ${
                                  prod.precio_tipo === "variantes"
                                    ? `(${prod.variantes?.length || 0} variantes)`
                                    : prod.controla_stock
                                      ? `(stock actual: ${prod.cantidad})`
                                      : "(sin stock)"
                                }`
                              }
                              placeholder="Buscar producto..."
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
                                      (stock actual: {v.cantidad})
                                    </option>
                                  ))}
                              </select>
                            </div>
                          )}

                          <div>
                            <label className="block text-sm text-gray-600 mb-1">
                              Costo unitario *{" "}
                              {esProduccionPropia && "(aproximado)"}
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.costo_unitario}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "costo_unitario",
                                  e.target.value,
                                )
                              }
                              required
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                            />
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
                                parseFloat(item.costo_unitario || 0) *
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
                <h3 className="text-lg font-semibold mb-4">Resumen</h3>

                <div className="flex justify-between text-xl font-bold text-gray-900 pb-4 border-b mb-4">
                  <span>Total costo:</span>
                  <span>{formatPrecio(calcularSumaItems())}</span>
                </div>

                {esProduccionPropia ? (
                  <p className="text-sm text-gray-500 mb-4">
                    No se carga ningún pago: es producción propia.
                  </p>
                ) : (
                  <>
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
                    </div>

                    {Math.abs(diferencia) > 0.01 && (
                      <p className="text-sm text-red-600 mb-4">
                        {diferencia > 0
                          ? `Sobran ${formatPrecio(diferencia)} respecto al total.`
                          : `Faltan ${formatPrecio(Math.abs(diferencia))} para completar el total.`}
                      </p>
                    )}
                  </>
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
                      Registrar Compra
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

export default CompraForm;
