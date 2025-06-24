import { Link } from 'react-router-dom';
import { useEffect } from 'react';

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
      {/* Hero Section */}
      <section 
        className="bg-gradient-to-r from-primary/85 to-secondary/90 bg-cover bg-center text-blanco text-center py-24"
        style={{ backgroundImage: "url('/images/hero-bg.jpg')" }}
      >
        <div className="container">
          <h2 className="text-4xl lg:text-5xl font-bold mb-5">
            Bienvenidos a DecoMotivo
          </h2>
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
                  alt="Quienes Somos"
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
                description: 'Tablas personalizadas, para uso personal, regalo empresarial, para locales gastronómicos, etc.'
              },
              {
                img: '/images/destacado2.jpg',
                title: 'Cartelería en polifan',
                description: 'Cartelería, cuadros y decoraciones en general, todo en polifan.'
              },
              {
                img: '/images/destacado3.jpg',
                title: 'Mates de Algarrobo',
                description: 'Mates de algarrobo con grabados personalizados, regalos empresariales, mates personales, etc.'
              }
            ].map((item, index) => (
              <div 
                key={index}
                className="fade-in bg-fondo rounded-xl overflow-hidden shadow-custom transition-all duration-300 hover:-translate-y-2 hover:shadow-custom-lg"
              >
                <img 
                  src={item.img}
                  alt={item.title}
                  className="w-full h-64 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2 text-secondary">
                    {item.title}
                  </h3>
                  <p className="text-texto">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Inicio;