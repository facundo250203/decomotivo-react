import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { productsAPI, categoriesAPI, formatPrice } from "../services/api";
import ProductImageCarousel from "./ProductImageCarousel";

const ProductCategory = ({ categorySlug }) => {
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategoryAndProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Obtener datos de la categoría por slug
        const categoryResponse = await categoriesAPI.getBySlug(categorySlug);

        if (categoryResponse.success) {
          setCategory(categoryResponse.data);

          // 2. Obtener productos de esta categoría
          const productsResponse = await productsAPI.getByCategory(
            categoryResponse.data.id,
          );

          if (productsResponse.success) {
            setProducts(productsResponse.data || []);
          }
        }
      } catch (err) {
        console.error("Error cargando categoría:", err);
        setError(
          "No se pudieron cargar los productos. Por favor, intentá de nuevo más tarde.",
        );
      } finally {
        setLoading(false);
      }
    };

    if (categorySlug) {
      fetchCategoryAndProducts();
    }
  }, [categorySlug]);

  // Función para generar URL de WhatsApp
  const generateWhatsAppUrl = (product) => {
    const message = `Hola DecoMotivo, estoy interesado/a en ${product.titulo}. ¿Podrían darme más información?`;
    return `https://wa.me/5493815128279?text=${encodeURIComponent(message)}`;
  };

  // LOADING STATE
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fondo">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-lg text-texto">Cargando productos...</p>
        </div>
      </div>
    );
  }

  // ERROR STATE
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fondo">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-secondary mb-2">
            Error al cargar
          </h2>
          <p className="text-texto mb-6">{error}</p>
          <Link
            to="/productos"
            className="inline-flex items-center gap-2 bg-primary text-blanco px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:bg-accent"
          >
            <i className="fas fa-arrow-left"></i>
            Volver a categorías
          </Link>
        </div>
      </div>
    );
  }

  // NO CATEGORY FOUND
  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fondo">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-secondary mb-2">
            Categoría no encontrada
          </h2>
          <p className="text-texto mb-6">La categoría que buscás no existe.</p>
          <Link
            to="/productos"
            className="inline-flex items-center gap-2 bg-primary text-blanco px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:bg-accent"
          >
            <i className="fas fa-arrow-left"></i>
            Volver a categorías
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hero de la categoría */}
      <section
        className="relative bg-cover bg-center text-blanco text-center py-16"
        style={{
          backgroundImage: category.imagen_url
            ? `url('${category.imagen_url}')`
            : "linear-gradient(135deg, #8B4513 0%, #D2691E 100%)",
        }}
      >
        {/* Overlay gradiente */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/85 to-secondary/90"></div>

        {/* Contenido */}
        <div className="container relative z-10">
          <h1 className="text-4xl lg:text-5xl font-bold mb-5">
            {category.nombre}
          </h1>
          {category.descripcion && (
            <p className="text-lg lg:text-xl max-w-4xl mx-auto">
              {category.descripcion}
            </p>
          )}
        </div>
      </section>

      {/* Productos */}
      <section className="py-16 bg-fondo">
        <div className="container">
          <Link
            to="/productos"
            className="inline-flex items-center gap-2 bg-secondary text-blanco px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:bg-gris-medio hover:-translate-y-1 mb-10"
          >
            <i className="fas fa-arrow-left"></i>
            Volver a categorías
          </Link>

          {/* NO PRODUCTS MESSAGE */}
          {products.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-2xl font-bold text-secondary mb-2">
                Todavía no hay productos en esta categoría
              </h3>
              <p className="text-texto mb-6">
                Estamos trabajando para traerte los mejores productos. Volvé
                pronto.
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
          ) : (
            /* PRODUCTS GRID */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((producto) => (
                <div
                  key={producto.id}
                  className="producto-card bg-blanco rounded-xl overflow-hidden shadow-custom transition-all duration-300 hover:shadow-custom-lg"
                >
                  {/* Imagen del producto con carrusel */}
                  <ProductImageCarousel
                    imagenes={producto.imagenes}
                    titulo={producto.titulo}
                    className="h-72"
                  />

                  {/* Info del producto */}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2 text-secondary">
                      {producto.titulo}
                    </h3>

                    {/* PRECIO */}
                    {producto.precio_tipo === "fijo" &&
                    producto.precio_valor ? (
                      <p className="text-2xl font-bold text-primary mb-3">
                        {formatPrice(producto.precio_valor)}
                      </p>
                    ) : producto.precio_tipo === "desde" &&
                      producto.precio_valor ? (
                      <p className="text-2xl font-bold text-primary mb-3">
                        Desde {formatPrice(producto.precio_valor)}
                      </p>
                    ) : (
                      <p className="text-2xl font-bold text-primary mb-3">
                        Consultar
                      </p>
                    )}

                    {producto.descripcion && (
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
                          <strong className="text-secondary">
                            Personalizable:
                          </strong>{" "}
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
                          <strong className="text-secondary">
                            Colores disponibles:
                          </strong>{" "}
                          {producto.colores}
                        </p>
                      )}
                    </div>

                    {/* BOTONES CONDICIONALES */}
                    {producto.precio_tipo === "fijo" &&
                    producto.precio_valor ? (
                      // Precio fijo → "Quiero este producto"
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
                      // Precio "desde" o "consultar" → "Consultar"
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
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default ProductCategory;
