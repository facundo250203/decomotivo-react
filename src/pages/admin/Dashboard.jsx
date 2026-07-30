// src/pages/admin/Dashboard.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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

// No usar toISOString() acá -- siempre da la fecha en UTC, y a partir de las
// 21:00 hora Argentina (UTC-3) ya cruzó la medianoche UTC y devuelve "mañana".
// Se arma la fecha desde los componentes LOCALES en cambio.
const formatFechaLocalISO = (d) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const hoyISO = () => formatFechaLocalISO(new Date());

// Arranque por defecto del dashboard: el 20/07/2026 fue el primer cierre de
// caja OFICIAL (ver CajaDashboard) -- todo lo cargado antes de esa fecha son
// entradas de arrastre (deudas y pedidos viejos puestos al día en el
// sistema), no actividad real del período que se está siguiendo. Fija en
// vez de "últimos 30 días" para no mezclar ambas cosas en top
// productos/clientes/facturación por defecto -- el campo "Desde" sigue
// siendo editable si alguna vez hace falta ver todo el histórico.
const INICIO_CONTROL_VENTAS = "2026-07-20";

const formatPrecio = (valor) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(
    valor || 0,
  );

// No usar new Date(fecha).toLocaleDateString() -- si "fecha" llega sin hora
// (ej. "2026-07-21", como manda facturacion_serie desde su CTE recursivo,
// donde MySQL no tipa la columna como DATE real), JS la interpreta como
// medianoche UTC y el navegador la corre un día para atrás al mostrarla en
// -03:00. Parsear los componentes directo del string evita depender de la
// hora y de la zona horaria del que mire el dashboard.
const formatFechaCorta = (fecha) => {
  const [, mes, dia] = fecha.slice(0, 10).split("-");
  return `${dia}/${mes}`;
};

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
  const [desde, setDesde] = useState(INICIO_CONTROL_VENTAS);
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
          {/* Ingresos por día: barras apiladas (efectivo + transferencia),
              con un renglón en 0 para cada día sin venta (ver
              getFacturacionSerie) -- una línea conectando solo los días con
              datos reales sugiere una tendencia continua que no existe en un
              negocio con ventas salteadas, no diarias. */}
          <Panel titulo="Ingresos por Día">
            {datos.facturacion_serie.length === 0 ? (
              <SinDatos />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={datos.facturacion_serie} margin={{ top: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" tickFormatter={formatFechaCorta} />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(fecha, payload) =>
                      `${formatFechaCorta(fecha)} - ${formatPrecio(payload?.[0]?.payload?.total)}`
                    }
                    formatter={(valor) => formatPrecio(valor)}
                  />
                  <Legend />
                  <Bar
                    dataKey="efectivo"
                    name="Efectivo"
                    stackId="ingresos"
                    fill={COLORES[3]}
                  />
                  <Bar
                    dataKey="transferencia"
                    name="Transferencia"
                    stackId="ingresos"
                    fill={COLORES[2]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Panel>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pedidos con pago pendiente: señados cuyo total todavía no
                está cubierto por lo cobrado. Mismo dato que ya usa el
                polling de N8N (ver reportesController.getPedidosPagoPendiente),
                acá recién se muestra también en el panel admin. Lista, no
                gráfico -- son ítems puntuales para seguir, no una métrica
                agregada. */}
            <Panel titulo="Pedidos con Pago Pendiente">
              {datos.pedidos_pago_pendiente.length === 0 ? (
                <p className="text-sm text-gris-medio py-4 text-center">
                  No hay pedidos señados con saldo pendiente.
                </p>
              ) : (
                <div className="space-y-2">
                  {datos.pedidos_pago_pendiente.map((p) => (
                    <Link
                      key={p.id}
                      to={`/admin/pedidos/${p.id}`}
                      className="flex justify-between items-center border rounded-lg p-3 text-sm hover:bg-gray-50"
                    >
                      <div>
                        <p className="font-medium">
                          Pedido #{p.id} — {p.cliente_nombre || "Sin nombre"}
                        </p>
                        <p className="text-gray-500">
                          Señado el {formatFechaCorta(p.fecha_senado)}
                        </p>
                      </div>
                      <span className="font-semibold text-red-600">
                        {formatPrecio(p.saldo_pendiente)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </Panel>

            {/* Pedidos estancados: "solicitado" hace más de 3 días sin pasar
                a señado -- mismo umbral que usa N8N por defecto. */}
            <Panel titulo="Pedidos Estancados">
              {datos.pedidos_estancados.length === 0 ? (
                <p className="text-sm text-gris-medio py-4 text-center">
                  No hay pedidos solicitados esperando hace más de 3 días.
                </p>
              ) : (
                <div className="space-y-2">
                  {datos.pedidos_estancados.map((p) => (
                    <Link
                      key={p.id}
                      to={`/admin/pedidos/${p.id}`}
                      className="flex justify-between items-center border rounded-lg p-3 text-sm hover:bg-gray-50"
                    >
                      <div>
                        <p className="font-medium">
                          Pedido #{p.id} — {p.cliente_nombre || "Sin nombre"}
                        </p>
                        <p className="text-gray-500">
                          Pedido el {formatFechaCorta(p.fecha_pedido)}
                        </p>
                      </div>
                      <span className="font-semibold text-amber-600">
                        {p.dias_esperando} día{p.dias_esperando === 1 ? "" : "s"}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          {/* Clientes con deuda pendiente: cuenta corriente > 0, venga de un
              pedido señado o de una venta directa fiada (mostrador, sin
              pedido detrás) -- este segundo caso no aparece en "Pedidos con
              Pago Pendiente" de arriba porque esa vista solo mira pedidos.
              Mismo dato que consume el polling de N8N. */}
          <Panel titulo="Clientes con Deuda Pendiente">
            {datos.clientes_con_deuda.length === 0 ? (
              <p className="text-sm text-gris-medio py-4 text-center">
                Ningún cliente tiene saldo pendiente en cuenta corriente.
              </p>
            ) : (
              <div className="space-y-2">
                {datos.clientes_con_deuda.map((c) => (
                  <Link
                    key={c.id}
                    to={`/admin/clientes/${c.id}`}
                    className="flex justify-between items-center border rounded-lg p-3 text-sm hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium">{c.nombre}</p>
                      <p className="text-gray-500">{c.telefono || "Sin teléfono"}</p>
                    </div>
                    <span className="font-semibold text-red-600">
                      {formatPrecio(c.saldo)}
                    </span>
                  </Link>
                ))}
              </div>
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
                        Variante
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
