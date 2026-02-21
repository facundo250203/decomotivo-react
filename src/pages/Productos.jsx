// src/pages/Productos.jsx
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import { categoriesAPI, productsAPI } from "../services/api";
import ProductImageCarousel from "../components/ProductImageCarousel";

const Productos = () => {
  const [categorias, setCategorias] = useState([]);
  const [productosDestacados, setProductosDestacados] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Obtener categorías
        const categoriasResponse = await categoriesAPI.getAll();
        if (categoriasResponse.success) {
          // Mapear categorías a formato necesario para la UI
          const categoriasFormateadas = categoriasResponse.data
            .filter((cat) => cat.slug !== "libreria") // ← AGREGAR ESTO
            .map((cat) => ({
              id: cat.id,
              path: `/${cat.slug}`,
              imagen: cat.imagen_background || "/images/logo.jpg",
              titulo: cat.nombre.toUpperCase(),
              descripcion: cat.descripcion || "",
              slug: cat.slug,
            }));
          setCategorias(categoriasFormateadas);
        }

        // Obtener productos destacados
        const productosResponse = await productsAPI.getFeatured(10);
        if (productosResponse.success) {
          setProductosDestacados(productosResponse.data || []);
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Función para formatear precio
  const formatPrice = (precio) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(precio);
  };

  // Función para generar URL de WhatsApp
  const generateWhatsAppUrl = (producto) => {
    const message = `Hola DecoMotivo, estoy interesado/a en ${producto.titulo}. ¿Podrían darme más información?`;
    return `https://wa.me/5493815128279?text=${encodeURIComponent(message)}`;
  };

  // Schema.org para la página de categorías
  const generateCategoriesSchema = () => ({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Catálogo de Productos Decorativos | DecoMotivo",
    description:
      "Explora nuestra colección completa de productos decorativos personalizados: mates, tablas, decoraciones en MDF y más.",
    url: "https://www.decomotivo.com.ar/productos",
    mainEntity: {
      "@type": "ItemList",
      name: "Categorías de Productos DecoMotivo",
      numberOfItems: categorias.length,
      itemListElement: categorias.map((categoria, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "CollectionPage",
          name: categoria.titulo,
          description: categoria.descripcion,
          url: `https://www.decomotivo.com.ar${categoria.path}`,
        },
      })),
    },
  });

  return (
    <>
      <Helmet>
        <title>
          Catálogo de Productos Decorativos Personalizados | DecoMotivo
        </title>
        <meta
          name="description"
          content="Explora nuestra colección de productos decorativos personalizados: mates, tablas, decoraciones en MDF y más. Diseños únicos para cada espacio con DecoMotivo."
        />
        <meta
          name="keywords"
          content="productos decorativos, catálogo, mates personalizados, tablas personalizadas, MDF, DecoMotivo, Tucumán, artesanías"
        />
        <link rel="canonical" href="https://www.decomotivo.com.ar/productos" />

        {/* Open Graph */}
        <meta
          property="og:title"
          content="Catálogo de Productos Decorativos Personalizados | DecoMotivo"
        />
        <meta
          property="og:description"
          content="Explora nuestra colección de productos decorativos personalizados: mates, tablas, decoraciones en MDF y más."
        />
        <meta
          property="og:image"
          content="https://www.decomotivo.com.ar/images/logo.jpg"
        />
        <meta
          property="og:url"
          content="https://www.decomotivo.com.ar/productos"
        />
        <meta property="og:type" content="website" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Catálogo de Productos Decorativos | DecoMotivo"
        />
        <meta
          name="twitter:description"
          content="Explora nuestra colección de productos decorativos personalizados en Tucumán."
        />
        <meta
          name="twitter:image"
          content="https://www.decomotivo.com.ar/images/productos.jpg"
        />

        {/* Schema.org */}
        {categorias.length > 0 && (
          <script type="application/ld+json">
            {JSON.stringify(generateCategoriesSchema())}
          </script>
        )}
      </Helmet>

      {/* LOADING STATE */}
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-fondo">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-lg text-texto">Cargando productos...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Sección de categorías */}
          <section className="py-20 bg-fondo">
            <div className="container">
              <h1 className="text-4xl lg:text-5xl font-bold text-center mb-12 text-secondary">
                Nuestros Productos
              </h1>

              {categorias.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-xl text-texto">
                    No hay categorías disponibles en este momento.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                  {categorias.map((categoria, index) => (
                    <Link
                      key={categoria.id || index}
                      to={categoria.path}
                      className="relative block h-48 rounded-xl overflow-hidden shadow-custom transition-all duration-300 hover:-translate-y-1 hover:shadow-custom-xl group"
                      aria-label={`Ver productos de ${categoria.titulo}`}
                    >
                      <div
                        className="absolute inset-0 bg-cover bg-center opacity-30 transition-all duration-300 group-hover:opacity-50 group-hover:scale-105"
                        style={{
                          backgroundImage: categoria.imagen
                            ? `url(${categoria.imagen})`
                            : "linear-gradient(135deg, #8B4513 0%, #D2691E 100%)",
                        }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center px-4">
                          <h2 className="text-2xl font-bold text-primary text-shadow-lg mb-2">
                            {categoria.titulo}
                          </h2>
                          <p className="text-sm text-secondary font-medium text-shadow-sm">
                            {categoria.descripcion}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Productos destacados - ESTRUCTURA IDÉNTICA A PRODUCTCATEGORY */}
          {productosDestacados.length > 0 && (
            <section className="bg-blanco py-20">
              <div className="container">
                <h2 className="text-3xl lg:text-4xl font-bold text-center mb-10 text-secondary">
                  Productos Destacados
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {productosDestacados.map((producto) => (
                    <div
                      key={producto.id}
                      className="producto-card bg-blanco rounded-xl overflow-hidden shadow-custom transition-all duration-300 hover:shadow-custom-lg"
                    >
                      {/* Imagen del producto con carrusel */}
                      <ProductImageCarousel
                        imagenes={producto.imagenes || []}
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

                        {/* Descripción */}
                        {producto.descripcion && (
                          <p className="text-texto mb-4">
                            {producto.descripcion}
                          </p>
                        )}

                        {/* Detalles del producto */}
                        <div className="bg-gris-claro p-4 rounded-lg mb-4 space-y-2">
                          {producto.material && (
                            <p className="text-sm">
                              <strong className="text-secondary">
                                Material:
                              </strong>{" "}
                              {producto.material}
                            </p>
                          )}
                          {producto.medidas && (
                            <p className="text-sm">
                              <strong className="text-secondary">
                                Medidas:
                              </strong>{" "}
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
                              <strong className="text-secondary">
                                Capacidad:
                              </strong>{" "}
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

                        {/* BOTONES CONDICIONALES - IGUAL QUE EN PRODUCTCATEGORY */}
                        {producto.precio_tipo === "fijo" &&
                        producto.precio_valor ? (
                          <a
                            href={generateWhatsAppUrl(producto)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 bg-primary text-blanco px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:bg-accent"
                          >
                            <i className="fab fa-whatsapp text-xl"></i>
                            Quiero este producto
                          </a>
                        ) : (
                          <a
                            href={generateWhatsAppUrl(producto)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 bg-secondary text-blanco px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:bg-gris-oscuro"
                          >
                            <i className="fab fa-whatsapp text-xl"></i>
                            Consultar
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
};

export default Productos;
