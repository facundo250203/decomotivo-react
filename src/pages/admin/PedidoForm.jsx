// src/pages/admin/PedidoForm.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import { adminOrdersAPI, productsAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getErrorInfo } from "../../utils/errorHandler";

const PedidoForm = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [productos, setProductos] = useState([]);
  const [loadingProductos, setLoadingProductos] = useState(true);
  const toast = useToast();

  const [formData, setFormData] = useState({
    cliente_nombre: "",
    cliente_telefono: "",
    cliente_email: "",
    descuento: 0,
    monto_sena: 0,
    notas: "",
  });

  const [items, setItems] = useState([
    {
      producto_id: "",
      descripcion: "",
      precio_unitario: 0,
      cantidad: 1,
    },
  ]);

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    try {
      setLoadingProductos(true);
      const response = await productsAPI.getAll();
      if (response.success) {
        setProductos(response.data || []);
      }
    } catch (error) {
      const { title, message, detail } = getErrorInfo(error);
      toast.error(title, message, detail);
    } finally {
      setLoadingProductos(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    // Si cambió el producto, actualizar el precio
    if (field === "producto_id") {
      const producto = productos.find((p) => p.id === parseInt(value));
      if (producto && producto.precio_valor) {
        newItems[index].precio_unitario = producto.precio_valor;
      }
    }

    setItems(newItems);
  };

  const agregarItem = () => {
    setItems([
      ...items,
      {
        producto_id: "",
        descripcion: "",
        precio_unitario: 0,
        cantidad: 1,
      },
    ]);
  };

  const eliminarItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calcularSubtotal = () => {
    return items.reduce((sum, item) => {
      const subtotalItem =
        parseFloat(item.precio_unitario || 0) * parseInt(item.cantidad || 0);
      return sum + subtotalItem;
    }, 0);
  };

  const calcularTotal = () => {
    const subtotal = calcularSubtotal();
    const descuento = parseFloat(formData.descuento || 0);
    return subtotal - descuento;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.cliente_nombre.trim()) {
      toast.warning("Campo requerido", "El nombre del cliente es obligatorio.");
      return;
    }
    const itemsValidos = items.filter(
      (item) => item.producto_id && item.cantidad > 0,
    );
    if (itemsValidos.length === 0) {
      toast.warning("Sin productos", "Agregá al menos un producto al pedido.");
      return;
    }
    try {
      setLoading(true);
      const orderData = { ...formData, items: itemsValidos };
      const response = await adminOrdersAPI.create(orderData, token);
      if (response.success) {
        toast.success(
          "Pedido creado",
          "El pedido fue registrado correctamente.",
        );
        navigate(`/admin/pedidos/${response.data.id}`);
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

  const formatPrecio = (precio) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(precio);
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/admin/pedidos"
            className="text-primary hover:underline mb-2 inline-block"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Volver a pedidos
          </Link>
          <h2 className="text-2xl font-bold text-secondary">Nuevo Pedido</h2>
          <p className="text-gris-medio">Registra un nuevo pedido de cliente</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Formulario principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Datos del cliente */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <i className="fas fa-user text-primary"></i>
                  Información del Cliente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Cliente *
                    </label>
                    <input
                      type="text"
                      name="cliente_nombre"
                      value={formData.cliente_nombre}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Juan Pérez"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      name="cliente_telefono"
                      value={formData.cliente_telefono}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="381-1234567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="cliente_email"
                      value={formData.cliente_email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="cliente@email.com"
                    />
                  </div>
                </div>
              </div>

              {/* Items del pedido */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <i className="fas fa-box text-primary"></i>
                    Productos del Pedido
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
                    {items.map((item, index) => (
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
                            <select
                              value={item.producto_id}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "producto_id",
                                  e.target.value,
                                )
                              }
                              required
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                            >
                              <option value="">Seleccionar producto</option>
                              {productos.map((prod) => (
                                <option key={prod.id} value={prod.id}>
                                  {prod.titulo} -{" "}
                                  {prod.precio_tipo === "fijo" &&
                                  prod.precio_valor
                                    ? formatPrecio(prod.precio_valor)
                                    : prod.precio_tipo === "desde"
                                      ? `Desde ${formatPrecio(prod.precio_valor)}`
                                      : "Consultar"}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm text-gray-600 mb-1">
                              Personalización / Detalles
                            </label>
                            <textarea
                              value={item.descripcion}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "descripcion",
                                  e.target.value,
                                )
                              }
                              rows="2"
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                              placeholder="Grabado, colores, medidas especiales..."
                            />
                          </div>

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
                                handleItemChange(
                                  index,
                                  "cantidad",
                                  e.target.value,
                                )
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
                    ))}
                  </div>
                )}
              </div>

              {/* Notas adicionales */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <i className="fas fa-sticky-note text-primary"></i>
                  Notas Adicionales
                </h3>
                <textarea
                  name="notas"
                  value={formData.notas}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Observaciones, fecha de entrega, acuerdos especiales..."
                />
              </div>
            </div>

            {/* Resumen del pedido */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
                <h3 className="text-lg font-semibold mb-4">
                  Resumen del Pedido
                </h3>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span className="font-medium">
                      {formatPrecio(calcularSubtotal())}
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
                      name="descuento"
                      value={formData.descuento}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {formData.descuento > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Descuento:</span>
                      <span>- {formatPrecio(formData.descuento)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t">
                    <span>Total:</span>
                    <span>{formatPrecio(calcularTotal())}</span>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Seña Recibida (ARS)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={calcularTotal()}
                      name="monto_sena"
                      value={formData.monto_sena}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {formData.monto_sena > 0 && (
                    <div className="flex justify-between text-orange-600 font-semibold">
                      <span>Saldo Pendiente:</span>
                      <span>
                        {formatPrecio(
                          calcularTotal() - parseFloat(formData.monto_sena),
                        )}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Creando pedido...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check mr-2"></i>
                      Crear Pedido
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

export default PedidoForm;
