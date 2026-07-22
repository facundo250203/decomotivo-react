import { useState } from "react";
import { formatPrice } from "../services/api";
import ProductImageCarousel from "./ProductImageCarousel";

const generateWhatsAppUrl = (producto, variante) => {
  const detalleMedida = variante ? ` - ${variante.nombre}` : "";
  const message = `Hola DecoMotivo, estoy interesado/a en ${producto.titulo}${detalleMedida}. ¿Podrían darme más información?`;
  return `https://wa.me/5493815128279?text=${encodeURIComponent(message)}`;
};

// Tarjeta de producto compartida entre las páginas de categoría y /ofertas
// (antes estaba duplicada en ProductCategory.jsx).
const ProductGridCard = ({ producto }) => {
  const [varianteId, setVarianteId] = useState("");

  const tieneOferta = producto.en_oferta && producto.precio_oferta;
  const esVariantes = producto.precio_tipo === "variantes";
  const varianteSeleccionada = producto.variantes?.find(
    (v) => v.id === varianteId,
  );
  // "Desde" solo tiene sentido si las variantes activas realmente varían de
  // precio -- si todas cuestan lo mismo (ej. Mapas, todos a $300), decirlo
  // implica una opción más cara que no existe.
  const hayRangoDePrecioEnVariantes =
    producto.precio_valor_max > producto.precio_valor;

  return (
    <div className="producto-card bg-blanco rounded-xl overflow-hidden shadow-custom transition-all duration-300 hover:shadow-custom-lg">
      {producto.mostrar_imagen !== false && producto.imagenes?.length > 0 && (
        <div className="relative">
          {tieneOferta && (
            <span className="absolute top-3 left-3 z-10 bg-red-600 text-white text-xs font-bold w-14 h-14 rounded-full flex items-center justify-center text-center leading-tight shadow-lg">
              Oferta
            </span>
          )}
          <ProductImageCarousel
            imagenes={producto.imagenes}
            titulo={producto.titulo}
            className="h-72"
          />
        </div>
      )}

      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2 text-secondary">
          {producto.titulo}
        </h3>

        {producto.mostrar_precio === false ? null : tieneOferta ? (
          <p className="mb-3 flex items-center gap-2 flex-wrap">
            <span className="text-lg text-gris-medio line-through">
              {formatPrice(producto.precio_valor)}
            </span>
            <span className="text-2xl font-bold text-red-600">
              {formatPrice(producto.precio_oferta)}
            </span>
          </p>
        ) : esVariantes ? (
          <p className="text-2xl font-bold text-primary mb-3">
            {varianteSeleccionada
              ? formatPrice(varianteSeleccionada.precio_valor)
              : hayRangoDePrecioEnVariantes
                ? `Desde ${formatPrice(producto.precio_valor)}`
                : formatPrice(producto.precio_valor)}
          </p>
        ) : (producto.precio_tipo === "fijo" || producto.precio_tipo === "combo") &&
          producto.precio_valor ? (
          <p className="text-2xl font-bold text-primary mb-3">
            {formatPrice(producto.precio_valor)}
          </p>
        ) : producto.precio_tipo === "desde" && producto.precio_valor ? (
          <p className="text-2xl font-bold text-primary mb-3">
            Desde {formatPrice(producto.precio_valor)}
          </p>
        ) : (
          <p className="text-2xl font-bold text-primary mb-3">Consultar</p>
        )}

        {esVariantes && (
          <div className="mb-4">
            <label className="block text-sm text-gris-medio mb-1">
              Elegí una variante:
            </label>
            <select
              value={varianteId}
              onChange={(e) =>
                setVarianteId(e.target.value ? parseInt(e.target.value) : "")
              }
              className="w-full px-3 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Seleccionar variante</option>
              {producto.variantes
                ?.filter((v) => v.activo)
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nombre}
                    {producto.mostrar_precio !== false &&
                      ` - ${formatPrice(v.precio_valor)}`}
                    {v.cantidad <= 0 ? " (Sin stock, igual podés consultar)" : ""}
                  </option>
                ))}
            </select>
          </div>
        )}

        {producto.descripcion && producto.mostrar_descripcion !== false && (
          <p className="text-texto mb-4">{producto.descripcion}</p>
        )}

        {/* Tiempo de entrega */}
        <p className="text-sm text-gris-medio mb-4 flex items-center gap-1">
          <i className="fas fa-clock text-primary"></i>
          {producto.tiempo_entrega_tipo === "inmediata"
            ? "Entrega inmediata"
            : `Preparación: ${producto.tiempo_entrega_dias} día${producto.tiempo_entrega_dias > 1 ? "s" : ""}`}
        </p>

        {/* Detalles del producto */}
        <div className="bg-gris-claro p-4 rounded-lg mb-4 space-y-2">
          {producto.material && (
            <p className="text-sm">
              <strong className="text-secondary">Material:</strong>{" "}
              {producto.material}
            </p>
          )}
          {producto.medidas && (
            <p className="text-sm">
              <strong className="text-secondary">Medidas:</strong>{" "}
              {producto.medidas}
            </p>
          )}
          {producto.personalizable && (
            <p className="text-sm">
              <strong className="text-secondary">Personalizable:</strong>{" "}
              {producto.personalizable}
            </p>
          )}
          {producto.capacidad && (
            <p className="text-sm">
              <strong className="text-secondary">Capacidad:</strong>{" "}
              {producto.capacidad}
            </p>
          )}
          {producto.colores && (
            <p className="text-sm">
              <strong className="text-secondary">Colores disponibles:</strong>{" "}
              {producto.colores}
            </p>
          )}
        </div>

        {/* BOTONES CONDICIONALES */}
        {esVariantes ? (
          varianteSeleccionada ? (
            <a
              href={generateWhatsAppUrl(producto, varianteSeleccionada)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-3 bg-primary text-blanco px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:bg-accent hover:-translate-y-1"
            >
              <i className="fab fa-whatsapp text-xl"></i>
              Quiero este producto
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="w-full inline-flex items-center justify-center gap-3 bg-gris-claro text-gris-medio px-6 py-3 rounded-lg font-semibold cursor-not-allowed"
            >
              Elegí una variante
            </button>
          )
        ) : (producto.precio_tipo === "fijo" || producto.precio_tipo === "combo") &&
          producto.precio_valor ? (
          <a
            href={generateWhatsAppUrl(producto)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-3 bg-primary text-blanco px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:bg-accent hover:-translate-y-1"
          >
            <i className="fab fa-whatsapp text-xl"></i>
            Quiero este producto
          </a>
        ) : (
          <a
            href={generateWhatsAppUrl(producto)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-3 bg-secondary text-blanco px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:bg-gris-medio hover:-translate-y-1"
          >
            <i className="fab fa-whatsapp text-xl"></i>
            Consultar
          </a>
        )}
      </div>
    </div>
  );
};

export default ProductGridCard;
