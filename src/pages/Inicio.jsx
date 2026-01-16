// src/pages/Inicio.jsx
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";

const Inicio = () => {

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

  // Pasos del proceso
  const pasos = [
    {
      numero: "1",
      icono: "fa-search",
      titulo: "Elegí tu Producto",
      descripcion: "Explorá nuestro catálogo de mates, tablas, decoraciones y más. Encontrá el diseño perfecto para vos."
    },
    {
      numero: "2",
      icono: "fa-palette",
      titulo: "Personalizalo",
      descripcion: "Agregá nombres, fechas, frases o diseños especiales. Hacemos cada pieza única para vos."
    },
    {
      numero: "3",
      icono: "fa-comments",
      titulo: "Contactanos",
      descripcion: "Escribinos por WhatsApp para confirmar detalles, precio final y forma de pago."
    },
    {
      numero: "4",
      icono: "fa-gift",
      titulo: "Recibilo",
      descripcion: "Retiralo en nuestro local o coordinamos el envío. ¡Tu producto personalizado listo!"
    }
  ];

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

      {/* ¿Quiénes Somos? */}
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

      {/* Cómo Trabajamos - NUEVA SECCIÓN */}
      <section className="bg-blanco py-20">
        <div className="container">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-4 text-secondary">
            ¿Cómo Trabajamos?
          </h2>
          <p className="text-center text-gris-medio mb-12 max-w-2xl mx-auto">
            En 4 simples pasos podés tener tu producto personalizado
          </p>

          {/* Pasos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {pasos.map((paso, index) => (
              <div 
                key={index}
                className="fade-in relative bg-fondo rounded-xl p-6 text-center shadow-custom hover:shadow-custom-lg transition-all duration-300 hover:-translate-y-2"
              >
                {/* Número */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 bg-primary text-blanco rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                  {paso.numero}
                </div>
                
                {/* Icono */}
                <div className="w-16 h-16 mx-auto mt-4 mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <i className={`fas ${paso.icono} text-2xl text-primary`}></i>
                </div>
                
                {/* Contenido */}
                <h3 className="text-xl font-semibold mb-3 text-secondary">
                  {paso.titulo}
                </h3>
                <p className="text-texto text-sm">
                  {paso.descripcion}
                </p>

                {/* Flecha conectora (excepto en el último) */}
                {index < pasos.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-primary/30 text-2xl">
                    <i className="fas fa-chevron-right"></i>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <Link 
              to="/productos" 
              className="inline-flex items-center gap-2 bg-primary text-blanco px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 hover:bg-accent hover:scale-105 shadow-lg"
            >
              <i className="fas fa-shopping-bag"></i>
              Explorar Productos
            </Link>
          </div>
        </div>
      </section>

      {/* CTA WhatsApp */}
      <section className="bg-gradient-to-r from-green-600 to-green-500 py-16">
        <div className="container text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-blanco mb-4">
            ¿Tenés alguna idea en mente?
          </h2>
          <p className="text-blanco/90 text-lg mb-8 max-w-2xl mx-auto">
            Contanos qué querés crear y te ayudamos a hacerlo realidad. 
            Personalizamos cualquier diseño para vos.
          </p>
          <a
            href="https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20tengo%20una%20idea%20para%20un%20producto%20personalizado"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-blanco text-green-600 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 hover:bg-gray-100 hover:scale-105 shadow-lg"
          >
            <i className="fab fa-whatsapp text-2xl"></i>
            Escribinos por WhatsApp
          </a>
        </div>
      </section>
    </>
  );
};

export default Inicio;