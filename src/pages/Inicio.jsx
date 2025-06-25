import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

const Inicio = () => {
  useEffect(() => {
    // Intersection Observer para animaciones
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.fade-in');
    animatedElements.forEach(element => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Helmet>
        <title>DecoMotivo - Productos Decorativos Personalizados | Tucumán, Argentina</title>
        <meta name="description" content="Bienvenidos a DecoMotivo. Creamos productos decorativos personalizados con dedicación y amor. Mates, tablas, MDF y más para transformar tus espacios en Tucumán." />
        <meta name="keywords" content="DecoMotivo, productos decorativos, personalización, mates algarrobo, tablas madera, decoración hogar, Tucumán, artesanías argentinas" />
        <link rel="canonical" href="https://www.decomotivo.com.ar/" />
        
        {/* Open Graph */}
        <meta property="og:title" content="DecoMotivo - Productos Decorativos Personalizados | Tucumán" />
        <meta property="og:description" content="Bienvenidos a DecoMotivo. Creamos productos decorativos personalizados con dedicación y amor para transformar tus espacios." />
        <meta property="og:image" content="https://www.decomotivo.com.ar/images/hero-bg.jpg" />
        <meta property="og:url" content="https://www.decomotivo.com.ar/" />
        <meta property="og:type" content="website" />
        
        {/* Schema.org para página de inicio */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "DecoMotivo - Inicio",
            "description": "Bienvenidos a DecoMotivo. Creamos productos decorativos personalizados con dedicación y amor para transformar tus espacios.",
            "url": "https://www.decomotivo.com.ar/",
            "mainEntity": {
              "@type": "Organization",
              "name": "DecoMotivo",
              "foundingDate": "2022",
              "description": "En DecoMotivo nos dedicamos a crear productos decorativos con un toque único y personalizados.",
              "specialty": ["Mates personalizados", "Tablas de madera", "Productos en MDF", "Decoraciones"]
            }
          })}
        </script>
      </Helmet>

      {/* Hero Section */}
      <section 
        className="bg-gradient-to-r from-primary/85 to-secondary/90 bg-cover bg-center text-blanco text-center py-24"
        style={{ backgroundImage: "url('/images/hero-bg.jpg')" }}
      >
        <div className="container">
          <h1 className="text-4xl lg:text-5xl font-bold mb-5">
            Bienvenidos a DecoMotivo
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Decorando Tu Vida...
          </p>
          <Link to="/productos" className="btn text-lg">
            Ver Productos
          </Link>
        </div>
      </section>

      {/* Quienes Somos */}
      <section className="py-20">
        <div className="container">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-10 text-secondary">
            Quienes Somos
          </h2>
          <div className="fade-in flex flex-col lg:flex-row items-center gap-10">
            <div className="flex-1 space-y-4 text-lg">
              <p>
                En DecoMotivo nos dedicamos a crear productos decorativos con un
                toque único y personalizados. Cada pieza es elaborada con
                dedicación y amor para transformar tus espacios.
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
                  src="/images/about-us.jpg" 
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                img: '/images/destacado1.jpg',
                title: 'Tablas de madera',
                description: 'Tablas personalizadas, para uso personal, regalo empresarial, para locales gastronómicos, etc.',
                alt: 'Tablas de algarrobo personalizadas con grabado láser para uso gastronómico'
              },
              {
                img: '/images/destacado2.jpg',
                title: 'Cartelería en polifan',
                description: 'Cartelería, cuadros y decoraciones en general, todo en polifan.',
                alt: 'Cartelería decorativa y cuadros personalizados en polifan para negocios'
              },
              {
                img: '/images/destacado3.jpg',
                title: 'Mates de Algarrobo',
                description: 'Mates de algarrobo con grabados personalizados, regalos empresariales, mates personales, etc.',
                alt: 'Mates de algarrobo artesanales con grabado personalizado y bombilla incluida'
              }
            ].map((item, index) => (
              <article 
                key={index}
                className="fade-in bg-fondo rounded-xl overflow-hidden shadow-custom transition-all duration-300 hover:-translate-y-2 hover:shadow-custom-lg"
              >
                <img 
                  src={item.img}
                  alt={item.alt}
                  className="w-full h-64 object-cover"
                  loading={index === 0 ? "eager" : "lazy"}
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2 text-secondary">
                    {item.title}
                  </h3>
                  <p className="text-texto">
                    {item.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Inicio;