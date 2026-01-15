import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { productsAPI } from "../services/api";
import ProductImageCarousel from "../components/ProductImageCarousel";

const Inicio = () => {
  const [productosDestacados, setProductosDestacados] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Intersection Observer para animaciones
    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const animatedElements = document.querySelectorAll(".fade-in");
    animatedElements.forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchProductosDestacados = async () => {
      try {
        setLoading(true);
        const response = await productsAPI.getFeatured(3);
        if (response.success) {
          setProductosDestacados(response.data || []);
        }
      } catch (error) {
        console.error("Error cargando productos destacados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductosDestacados();
  }, []);

  return (
    <>
      <Helmet>
        <title>
          DecoMotivo - Productos Decorativos Personalizados | Tucumán, Argentina
        </title>
        <meta
          name="description"
          content="Bienvenidos a DecoMotivo. Creamos productos decorativos personalizados con dedicación y amor. Mates, tablas, MDF y más para transformar tus espacios en Tucumán."
        />
        <meta
          name="keywords"
          content="DecoMotivo, productos decorativos, personalización, mates algarrobo, tablas madera, decoración hogar, Tucumán, artesanías argentinas"
        />
        <link rel="canonical" href="https://www.decomotivo.com.ar/" />

        {/* Open Graph */}
        <meta
          property="og:title"
          content="DecoMotivo - Productos Decorativos Personalizados | Tucumán"
        />
        <meta
          property="og:description"
          content="Bienvenidos a DecoMotivo. Creamos productos decorativos personalizados con dedicación y amor para transformar tus espacios."
        />
        <meta
          property="og:image"
          content="https://www.decomotivo.com.ar/images/hero-bg.jpg"
        />
        <meta property="og:url" content="https://www.decomotivo.com.ar/" />
        <meta property="og:type" content="website" />

        {/* Schema.org para página de inicio */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "DecoMotivo - Inicio",
            description:
              "Bienvenidos a DecoMotivo. Creamos productos decorativos personalizados con dedicación y amor para transformar tus espacios.",
            url: "https://www.decomotivo.com.ar/",
            mainEntity: {
              "@type": "Organization",
              name: "DecoMotivo",
              foundingDate: "2022",
              description:
                "En DecoMotivo nos dedicamos a crear productos decorativos con un toque único y personalizados.",
            },
          })}
        </script>
      </Helmet>

      {/* Hero */}
      <section
        className="relative bg-cover bg-center text-blanco text-center py-32 lg:py-40"
        style={{ backgroundImage: "url('https://res.cloudinary.com/dkjqmhwtj/image/upload/v1766727625/hero-bg_xaistt.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-secondary/90"></div>

        <div className="container relative z-10">
          <h1 className="text-4xl lg:text-6xl font-bold mb-6 text-shadow-lg">
            Bienvenidos a DecoMotivo
          </h1>
          <p className="text-xl lg:text-2xl mb-10 max-w-3xl mx-auto text-shadow-sm">
            Creamos productos decorativos personalizados con dedicación y amor.
            Transformá tus espacios con diseños únicos.
          </p>
          <Link to="/productos" className="btn text-lg px-8 py-4">
            Ver Productos
          </Link>
        </div>
      </section>

      {/* Quienes Somos */}
      <section className="py-20 bg-fondo">
        <div className="container">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12 text-secondary">
            ¿Quiénes Somos?
          </h2>
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="flex-1 space-y-6 text-lg text-texto">
              <p>
                En DecoMotivo nos dedicamos a crear productos decorativos con un
                toque único y personalizados, diseñados especialmente para vos.
                Cada pieza es elaborada con dedicación y amor para transformar
                tus espacios.
              </p>
              <p>
                Fundada en 2022, nuestra misión es ofrecer productos de calidad
                estética y funcionalidad, para que puedas crear ambientes
                armoniosos y acogedores en tu hogar u oficina.
              </p>
              <p>
                Nuestro equipo está formado por apasionados del diseño y la
                decoración, comprometidos con la excelencia y la satisfacción de
                nuestros clientes.
              </p>
            </div>
            <div className="flex-1">
              <div className="rounded-xl overflow-hidden shadow-custom">
                <img
                  src="https://res.cloudinary.com/dkjqmhwtj/image/upload/v1766727478/about-us_nwcscu.jpg"
                  alt="Equipo DecoMotivo trabajando en productos artesanales personalizados"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Destacados */}
      <section className="bg-blanco py-20">
        <div className="container">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-10 text-secondary">
            Nuestros Trabajos Destacados
          </h2>

          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-lg text-texto">
                Cargando productos destacados...
              </p>
            </div>
          ) : productosDestacados.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-texto">
                Estamos trabajando en productos increíbles. Volvé pronto para
                verlos.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {productosDestacados.map((producto, index) => (
                <article
                  key={producto.id}
                  className="fade-in bg-fondo rounded-xl overflow-hidden shadow-custom transition-all duration-300 hover:-translate-y-2 hover:shadow-custom-lg"
                >
                  {/* Imagen del producto con carrusel */}
                  <ProductImageCarousel
                    imagenes={producto.imagenes}
                    titulo={producto.titulo}
                    className="h-64"
                  />

                  {/* Info del producto */}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2 text-secondary">
                      {producto.titulo}
                    </h3>
                    <p className="text-texto">
                      {producto.descripcion ||
                        "Producto artesanal personalizado de alta calidad."}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default Inicio;
