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
          const categoriasFormateadas = categoriasResponse.data.map((cat) => ({
            id: cat.id,
            path: `/${cat.slug}`,
            imagen: cat.imagen_background || "/images/default-category.jpg",
            titulo: cat.nombre.toUpperCase(),
            descripcion: cat.descripcion || "",
            slug: cat.slug,
          }));
          setCategorias(categoriasFormateadas);
        }

        // Obtener productos destacados (3 productos)
        const productosResponse = await productsAPI.getFeatured(3);
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
          content="https://www.decomotivo.com.ar/images/productos.jpg"
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

          {/* Productos destacados */}
          {productosDestacados.length > 0 && (
            <section className="bg-blanco py-20">
              <div className="container">
                <h2 className="text-3xl lg:text-4xl font-bold text-center mb-10 text-secondary">
                  Productos Destacados
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {productosDestacados.map((producto, index) => (
                    <article
                      key={producto.id}
                      className="bg-fondo rounded-xl overflow-hidden shadow-custom transition-all duration-300 hover:-translate-y-2 hover:shadow-custom-lg"
                      itemScope
                      itemType="https://schema.org/Product"
                    >
                      {/* Imagen del producto con carrusel */}
                      <ProductImageCarousel
                        imagenes={producto.imagenes}
                        titulo={producto.titulo}
                        className="h-64"
                      />

                      {/* Info del producto */}
                      <div className="p-6">
                        <h3
                          className="text-xl font-semibold mb-2 text-secondary"
                          itemProp="name"
                        >
                          {producto.titulo}
                        </h3>
                        <p className="text-texto" itemProp="description">
                          {producto.descripcion}
                        </p>

                        {/* Metadatos estructurados ocultos */}
                        <div style={{ display: "none" }}>
                          <span
                            itemProp="brand"
                            itemScope
                            itemType="https://schema.org/Brand"
                          >
                            <span itemProp="name">DecoMotivo</span>
                          </span>
                          <div
                            itemProp="offers"
                            itemScope
                            itemType="https://schema.org/Offer"
                          >
                            <span
                              itemProp="availability"
                              content="https://schema.org/InStock"
                            >
                              En stock
                            </span>
                            <span itemProp="priceCurrency" content="ARS">
                              ARS
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
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
