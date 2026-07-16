// src/pages/Productos.jsx
import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import { categoriesAPI, productsAPI } from "../services/api";
import CategoryNav from "../components/CategoryNav";
import ProductGridCard from "../components/ProductGridCard";
import ProductGrid from "../components/ProductGrid";

const Productos = () => {
  const [categorias, setCategorias] = useState([]);
  const [productosDestacados, setProductosDestacados] = useState([]);
  const [todosLosProductos, setTodosLosProductos] = useState([]);
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
              imagen: cat.imagen_background || "/images/logo.jpg",
              titulo: cat.nombre.toUpperCase(),
              descripcion: cat.descripcion || "",
              slug: cat.slug,
            }));
          setCategorias(categoriasFormateadas);
        }

        // Obtener productos destacados y el catálogo completo en paralelo
        const [destacadosResponse, todosResponse] = await Promise.all([
          productsAPI.getFeatured(10),
          productsAPI.getAll({ limit: 200 }),
        ]);
        if (destacadosResponse.success) {
          setProductosDestacados(destacadosResponse.data || []);
        }
        if (todosResponse.success) {
          setTodosLosProductos(todosResponse.data || []);
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
          {/* Categorías (barra lateral) + productos destacados */}
          <section className="py-20 bg-fondo">
            <div className="container lg:flex lg:gap-8 lg:items-start">
              <CategoryNav activeSlug={null} />

              <div className="flex-1 min-w-0">
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
                  <>
                    {productosDestacados.length > 0 && (
                      <>
                        <h2 className="text-3xl lg:text-4xl font-bold text-center mb-10 text-secondary">
                          Productos Destacados
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                          {productosDestacados.map((producto) => (
                            <ProductGridCard key={producto.id} producto={producto} />
                          ))}
                        </div>
                      </>
                    )}

                    <h2 className="text-3xl lg:text-4xl font-bold text-center mb-10 text-secondary">
                      Todos los Productos
                    </h2>
                    <ProductGrid
                      products={todosLosProductos}
                      emptyMessage="Elegí una categoría para ver los productos."
                    />
                  </>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
};

export default Productos;
