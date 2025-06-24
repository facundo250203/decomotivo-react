import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const Productos = () => {
  const categorias = [
    {
      path: '/mates-vasos',
      imagen: '/images/mates-bg.jpg',
      titulo: 'MATES Y VASOS'
    },
    {
      path: '/tablas',
      imagen: '/images/tablas-bg.jpg',
      titulo: 'TABLAS'
    },
    {
      path: '/combos',
      imagen: '/images/combos-bg.jpg',
      titulo: 'COMBOS'
    },
    {
      path: '/decoraciones',
      imagen: '/images/decoraciones-bg.jpg',
      titulo: 'DECORACIONES'
    },
    {
      path: '/mdf',
      imagen: '/images/mdf-bg.jpg',
      titulo: 'MDF'
    },
    {
      path: '/otros',
      imagen: '/images/otros-bg.jpg',
      titulo: 'OTROS'
    }
  ];

  const productosDestacados = [
    {
      imagen: '/images/producto1.jpg',
      titulo: 'Mates de Algarrobo',
      descripcion: 'Mates de algarrobo con grabado personalizado y bombilla de aluminio.'
    },
    {
      imagen: '/images/producto2.jpg',
      titulo: 'Vasos Ferneteros',
      descripcion: 'Vasos ferneteros de aluminio personalizados.'
    },
    {
      imagen: '/images/producto3.jpg',
      titulo: 'Tablas de Algarrobo',
      descripcion: 'Tablas de algarrobo personalizadas y curadas.'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Catálogo de Productos Decorativos Personalizados | DecoMotivo</title>
        <meta name="description" content="Explora nuestra colección de productos decorativos personalizados: mates, tablas, decoraciones en MDF y más. Diseños únicos para cada espacio con DecoMotivo." />
        <meta name="keywords" content="productos decorativos, catálogo, mates personalizados, tablas personalizadas, MDF, DecoMotivo, Tucumán, artesanías" />
        <link rel="canonical" href="https://www.decomotivo.com.ar/productos" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Catálogo de Productos Decorativos Personalizados | DecoMotivo" />
        <meta property="og:description" content="Explora nuestra colección de productos decorativos personalizados: mates, tablas, decoraciones en MDF y más." />
        <meta property="og:image" content="https://www.decomotivo.com.ar/images/productos.jpg" />
        <meta property="og:url" content="https://www.decomotivo.com.ar/productos" />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* Sección de categorías */}
      <section className="py-20 bg-fondo">
        <div className="container">
          <h1 className="text-4xl lg:text-5xl font-bold text-center mb-12 text-secondary">
            Nuestros Productos
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {categorias.map((categoria, index) => (
              <Link
                key={index}
                to={categoria.path}
                className="relative block h-48 rounded-xl overflow-hidden shadow-custom transition-all duration-300 hover:-translate-y-1 hover:shadow-custom-xl group"
              >
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-30 transition-all duration-300 group-hover:opacity-50 group-hover:scale-105"
                  style={{ backgroundImage: `url(${categoria.imagen})` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <h3 className="text-2xl font-bold text-primary text-center px-4 text-shadow-lg">
                    {categoria.titulo}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Productos más vendidos */}
      <section className="bg-blanco py-20">
        <div className="container">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-10 text-secondary">
            Productos Más Vendidos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {productosDestacados.map((producto, index) => (
              <div 
                key={index}
                className="bg-fondo rounded-xl overflow-hidden shadow-custom transition-all duration-300 hover:-translate-y-2 hover:shadow-custom-lg"
              >
                <img 
                  src={producto.imagen}
                  alt={producto.titulo}
                  className="w-full h-64 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2 text-secondary">
                    {producto.titulo}
                  </h3>
                  <p className="text-texto">
                    {producto.descripcion}
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

export default Productos;