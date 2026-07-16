// src/pages/admin/Dashboard.jsx
import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
} from "recharts";
import AdminLayout from "../../components/admin/AdminLayout";
import { reportesAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getErrorInfo } from "../../utils/errorHandler";

const COLORES = ["#c70000", "#333333", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6"];

const hace30Dias = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
};
const hoyISO = () => new Date().toISOString().slice(0, 10);

const formatPrecio = (valor) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(
    valor || 0,
  );

const formatFechaCorta = (fecha) =>
  new Date(fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });

// Tarjeta contenedora, compartida por todas las secciones del dashboard.
const Panel = ({ titulo, children }) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <h3 className="text-lg font-semibold text-secondary mb-4">{titulo}</h3>
    {children}
  </div>
);

const SinDatos = () => (
  <p className="text-sm text-gris-medio py-8 text-center">
    No hay datos para el período elegido.
  </p>
);

const Dashboard = () => {
  const { token } = useAuth();
  const toast = useToast();
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [desde, setDesde] = useState(hace30Dias());
  const [hasta, setHasta] = useState(hoyISO());

  useEffect(() => {
    fetchResumen();
  }, [desde, hasta]);

  const fetchResumen = async () => {
    try {
      setLoading(true);
      const response = await reportesAPI.getResumen({ desde, hasta }, token);
      if (response.success) {
        setDatos(response.data);
      }
    } catch (error) {
      const { title, message, detail } = getErrorInfo(error);
      toast.error(title, message, detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-secondary">Dashboard</h2>
        <p className="text-gris-medio">
          KPIs del negocio para el período elegido
        </p>
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

      {loading || !datos ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gris-medio">Calculando reportes...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Facturación en el tiempo */}
          <Panel titulo="Facturación en el tiempo">
            {datos.facturacion_serie.length === 0 ? (
              <SinDatos />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={datos.facturacion_serie}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" tickFormatter={formatFechaCorta} />
                  <YAxis />
                  <Tooltip
                    labelFormatter={formatFechaCorta}
                    formatter={(valor) => formatPrecio(valor)}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="Total"
                    stroke={COLORES[0]}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="efectivo"
                    name="Efectivo"
                    stroke={COLORES[3]}
                  />
                  <Line
                    type="monotone"
                    dataKey="transferencia"
                    name="Transferencia"
                    stroke={COLORES[2]}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Panel>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ventas por categoría */}
            <Panel titulo="Ventas por Categoría">
              {datos.ventas_por_categoria.length === 0 ? (
                <SinDatos />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={datos.ventas_por_categoria}
                      dataKey="total_facturado"
                      nameKey="categoria"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ categoria }) => categoria}
                    >
                      {datos.ventas_por_categoria.map((_, i) => (
                        <Cell key={i} fill={COLORES[i % COLORES.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(valor) => formatPrecio(valor)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Panel>

            {/* Top productos: el largo de la barra es la cantidad vendida,
                el monto facturado aparece como etiqueta al final de cada
                barra y también en el tooltip -- así se ven los dos datos
                sin convertir esto en una tabla más. */}
            <Panel titulo="Top Productos Más Vendidos">
              {datos.top_productos.length === 0 ? (
                <SinDatos />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={datos.top_productos}
                    layout="vertical"
                    margin={{ right: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="titulo"
                      width={140}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(valor, _nombre, entry) => [
                        `${valor} unidades (${formatPrecio(entry.payload.total_facturado)})`,
                        "Vendido",
                      ]}
                    />
                    <Bar
                      dataKey="cantidad_vendida"
                      name="Vendido"
                      fill={COLORES[0]}
                    >
                      <LabelList
                        dataKey="total_facturado"
                        position="right"
                        formatter={formatPrecio}
                        style={{ fontSize: 11, fill: "#333333" }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Panel>

            {/* Top clientes: mismo criterio -- cantidad de compras como
                largo de barra, monto gastado como etiqueta/tooltip. */}
            <Panel titulo="Top Clientes">
              {datos.top_clientes.length === 0 ? (
                <SinDatos />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={datos.top_clientes}
                    layout="vertical"
                    margin={{ right: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="nombre"
                      width={120}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(valor, _nombre, entry) => [
                        `${valor} compra${valor === 1 ? "" : "s"} (${formatPrecio(entry.payload.total_gastado)})`,
                        "Compras",
                      ]}
                    />
                    <Bar
                      dataKey="cantidad_compras"
                      name="Compras"
                      fill={COLORES[3]}
                    >
                      <LabelList
                        dataKey="total_gastado"
                        position="right"
                        formatter={formatPrecio}
                        style={{ fontSize: 11, fill: "#333333" }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Panel>

            {/* Gasto por proveedor: mismo criterio. */}
            <Panel titulo="Gasto por Proveedor">
              {datos.gasto_por_proveedor.length === 0 ? (
                <SinDatos />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={datos.gasto_por_proveedor}
                    layout="vertical"
                    margin={{ right: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="nombre"
                      width={120}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(valor, _nombre, entry) => [
                        `${valor} compra${valor === 1 ? "" : "s"} (${formatPrecio(entry.payload.total_gastado)})`,
                        "Compras",
                      ]}
                    />
                    <Bar
                      dataKey="cantidad_compras"
                      name="Compras"
                      fill={COLORES[1]}
                    >
                      <LabelList
                        dataKey="total_gastado"
                        position="right"
                        formatter={formatPrecio}
                        style={{ fontSize: 11, fill: "#333333" }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Panel>

            {/* Clientes nuevos vs recurrentes */}
            <Panel titulo="Clientes Nuevos vs. Recurrentes">
              {datos.clientes_nuevos_vs_recurrentes.length === 0 ? (
                <SinDatos />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={datos.clientes_nuevos_vs_recurrentes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="nuevos" name="Nuevos" fill={COLORES[3]} />
                    <Bar
                      dataKey="recurrentes"
                      name="Recurrentes"
                      fill={COLORES[2]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Panel>

            {/* Saldo de caja en el tiempo */}
            <Panel titulo="Saldo de Caja Acumulado">
              {datos.saldo_caja_serie.length === 0 ? (
                <p className="text-sm text-gris-medio py-8 text-center">
                  Todavía no hay cierres de caja en este período.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={datos.saldo_caja_serie}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fecha" tickFormatter={formatFechaCorta} />
                    <YAxis />
                    <Tooltip
                      labelFormatter={formatFechaCorta}
                      formatter={(valor) => formatPrecio(valor)}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="acumulado_total"
                      name="Acumulado total"
                      stroke={COLORES[0]}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Panel>
          </div>

          {/* Margen de ganancia: solo incluye productos con al menos una
              compra registrada -- sin costo cargado no hay margen posible
              de calcular. */}
          <Panel titulo="Margen de Ganancia">
            {datos.margen_ganancia.productos.length === 0 ? (
              <p className="text-sm text-gris-medio py-8 text-center">
                Ningún producto vendido en este período tiene un costo de
                compra registrado todavía.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gris-medio">Facturado</p>
                    <p className="text-xl font-bold text-secondary">
                      {formatPrecio(datos.margen_ganancia.resumen.total_facturado)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gris-medio">Costo</p>
                    <p className="text-xl font-bold text-red-600">
                      {formatPrecio(datos.margen_ganancia.resumen.total_costo)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gris-medio">Ganancia</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatPrecio(datos.margen_ganancia.resumen.total_ganancia)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gris-medio">Margen</p>
                    <p className="text-xl font-bold text-primary">
                      {datos.margen_ganancia.resumen.margen_porcentaje.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={datos.margen_ganancia.productos}
                    layout="vertical"
                    margin={{ right: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis
                      type="category"
                      dataKey="titulo"
                      width={140}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(valor, _nombre, entry) => [
                        `${formatPrecio(valor)} (margen ${entry.payload.margen_porcentaje.toFixed(1)}%)`,
                        "Ganancia",
                      ]}
                    />
                    <Bar dataKey="ganancia" name="Ganancia" fill={COLORES[3]}>
                      <LabelList
                        dataKey="margen_porcentaje"
                        position="right"
                        formatter={(v) => `${v.toFixed(0)}%`}
                        style={{ fontSize: 11, fill: "#333333" }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </>
            )}
          </Panel>

          {/* Efectividad de ofertas */}
          <Panel titulo="Efectividad de Ofertas">
            {datos.efectividad_ofertas.length === 0 ? (
              <SinDatos />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Producto
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Precio normal
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Precio oferta
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Unidades vendidas
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {datos.efectividad_ofertas.map((o) => (
                      <tr key={o.titulo}>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {o.titulo}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500 line-through">
                          {formatPrecio(o.precio_valor)}
                        </td>
                        <td className="px-4 py-2 text-sm text-primary font-semibold">
                          {formatPrecio(o.precio_oferta)}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {o.cantidad_vendida}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          {/* Stock bajo */}
          <Panel titulo="Stock Bajo / Agotado">
            {datos.stock_bajo.length === 0 ? (
              <p className="text-sm text-green-600 py-4 text-center">
                <i className="fas fa-check-circle mr-2"></i>
                Todo el catálogo tiene stock por encima del mínimo.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Producto
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Medida
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Stock actual
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Mínimo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {datos.stock_bajo.map((s, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {s.producto}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {s.variante || "-"}
                        </td>
                        <td
                          className={`px-4 py-2 text-sm font-semibold ${
                            s.cantidad === 0 ? "text-red-600" : "text-yellow-600"
                          }`}
                        >
                          {s.cantidad}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {s.stock_minimo}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      )}
    </AdminLayout>
  );
};

export default Dashboard;
