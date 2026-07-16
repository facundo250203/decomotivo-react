import { useState } from "react";
import ProductGridCard from "./ProductGridCard";

const PRODUCTOS_POR_PAGINA = 12;

// Grilla de productos con búsqueda por texto, orden (A-Z, Z-A, precio),
// paginación y estado vacío -- compartida entre las páginas de categoría
// y /ofertas. Todo se resuelve del lado del cliente sobre el array que ya
// se trajo del backend (alcanza de sobra para el tamaño de este catálogo;
// si algún día crece a miles de productos, ahí sí conviene mover esto al
// backend).
const ProductGrid = ({ products, emptyMessage }) => {
  const [orden, setOrden] = useState("relevancia");
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📦</div>
        <h3 className="text-2xl font-bold text-secondary mb-2">
          {emptyMessage}
        </h3>
        <p className="text-texto mb-6">
          Estamos trabajando para traerte los mejores productos. Volvé pronto.
        </p>
        <a
          href="https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20quisiera%20consultar%20sobre%20productos"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-primary text-blanco px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:bg-accent"
        >
          <i className="fab fa-whatsapp text-xl"></i>
          Consultanos por WhatsApp
        </a>
      </div>
    );
  }

  const handleBusquedaChange = (valor) => {
    setBusqueda(valor);
    setPagina(1);
  };

  const handleOrdenChange = (valor) => {
    setOrden(valor);
    setPagina(1);
  };

  const busquedaNormalizada = busqueda.trim().toLowerCase();
  const productosFiltrados = busquedaNormalizada
    ? products.filter(
        (p) =>
          p.titulo.toLowerCase().includes(busquedaNormalizada) ||
          p.descripcion?.toLowerCase().includes(busquedaNormalizada),
      )
    : products;

  // Productos sin precio_valor (precio_tipo "consultar") siempre quedan al
  // final, sin importar la dirección del orden por precio -- no tiene
  // sentido que "salten" al principio en precio descendente por no tener
  // valor numérico.
  const productosOrdenados = [...productosFiltrados].sort((a, b) => {
    if (orden === "az") return a.titulo.localeCompare(b.titulo, "es");
    if (orden === "za") return b.titulo.localeCompare(a.titulo, "es");
    if (orden === "precio-asc" || orden === "precio-desc") {
      if (a.precio_valor == null && b.precio_valor == null) return 0;
      if (a.precio_valor == null) return 1;
      if (b.precio_valor == null) return -1;
      return orden === "precio-asc"
        ? a.precio_valor - b.precio_valor
        : b.precio_valor - a.precio_valor;
    }
    return 0;
  });

  const totalPaginas = Math.max(
    1,
    Math.ceil(productosOrdenados.length / PRODUCTOS_POR_PAGINA),
  );
  const paginaActual = Math.min(pagina, totalPaginas);
  const productosPagina = productosOrdenados.slice(
    (paginaActual - 1) * PRODUCTOS_POR_PAGINA,
    paginaActual * PRODUCTOS_POR_PAGINA,
  );

  return (
    <>
      {/* Búsqueda + Orden */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="relative flex-1 max-w-sm">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gris-medio"></i>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => handleBusquedaChange(e.target.value)}
            placeholder="Buscar por nombre..."
            className="w-full pl-9 pr-3 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-texto">
          Ordenar por
          <select
            value={orden}
            onChange={(e) => handleOrdenChange(e.target.value)}
            className="px-3 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="relevancia">Relevancia</option>
            <option value="az">Nombre: A - Z</option>
            <option value="za">Nombre: Z - A</option>
            <option value="precio-asc">Precio: menor a mayor</option>
            <option value="precio-desc">Precio: mayor a menor</option>
          </select>
        </label>
      </div>

      {productosOrdenados.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-lg text-texto">
            No encontramos productos que coincidan con &quot;{busqueda}&quot;.
          </p>
        </div>
      ) : (
        <>
          {/* PRODUCTS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {productosPagina.map((producto) => (
              <ProductGridCard key={producto.id} producto={producto} />
            ))}
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-center gap-4 mt-10">
              <button
                type="button"
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={paginaActual === 1}
                className="px-4 py-2 border border-gris-claro rounded-lg text-sm font-medium hover:bg-gris-claro transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Anterior
              </button>
              <span className="text-sm text-gris-medio">
                Página {paginaActual} de {totalPaginas}
              </span>
              <button
                type="button"
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaActual === totalPaginas}
                className="px-4 py-2 border border-gris-claro rounded-lg text-sm font-medium hover:bg-gris-claro transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Siguiente
                <i className="fas fa-arrow-right ml-2"></i>
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default ProductGrid;
