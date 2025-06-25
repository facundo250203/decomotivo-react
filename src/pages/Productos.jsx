import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const Productos = () => {
  const categorias = [
    {
      path: '/mates-vasos',
      imagen: '/images/mates-bg.jpg',
      titulo: 'MATES Y VASOS',
      descripcion: 'Mates de algarrobo personalizados y vasos ferneteros'
    },
    {
      path: '/tablas',
      imagen: '/images/tablas-bg.jpg',
      titulo: 'TABLAS',
      descripcion: 'Tablas de algarrobo para asado, pizzas y uso diario'
    },
    {
      path: '/combos',
      imagen: '/images/combos-bg.jpg',
      titulo: 'COMBOS',
      descripcion: 'Sets especiales y combos para regalar'
    },
    {
      path: '/decoraciones',
      imagen: '/images/decoraciones-bg.jpg',
      titulo: 'DECORACIONES',
      descripcion: 'Cuadros en MDF y polifan para decorar'
    },
    {
      path: '/mdf',
      imagen: '/images/mdf-bg.jpg',
      titulo: 'MDF',
      descripcion: 'Portaobjetos y artículos decorativos en MDF'
    },
    {
      path: '/otros',
      imagen: '/images/otros-bg.jpg',
      titulo: 'OTROS',
      descripcion: 'Bolsos materos, percheros y productos únicos'
    }
  ];

  const productosDestacados = [
    {
      imagen: '/images/producto1.jpg',
      titulo: 'Mates de Algarrobo',
      descripcion: 'Mates de algarrobo con grabado personalizado y bombilla de aluminio.',
      alt: 'Mate de algarrobo artesanal con grabado personalizado y bombilla incluida'
    },
    {
      imagen: '/images/producto2.jpg',
      titulo: 'Vasos Ferneteros',
      descripcion: 'Vasos ferneteros de aluminio personalizados.',
      alt: 'Vaso fernetero de aluminio personalizado de 1 litro'
    },
    {
      imagen: '/images/producto3.jpg',
      titulo: 'Tablas de Algarrobo',
      descripcion: 'Tablas de algarrobo personalizadas y curadas.',
      alt: 'Tabla de algarrobo para asado con grabado personalizado'
    }
  ];

  // Schema.org para la página de categorías
  const generateCategoriesSchema = () => ({
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Catálogo de Productos Decorativos | DecoMotivo",
    "description": "Explora nuestra colección completa de productos decorativos personalizados: mates, tablas, decoraciones en MDF y más.",
    "url": "https://www.decomotivo.com.ar/productos",
    "mainEntity": {
      "@type": "ItemList",
      "name": "Categorías de Productos DecoMotivo",
      "numberOfItems": categorias.length,
      "itemListElement": categorias.map((categoria, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "CollectionPage",
          "name": categoria.titulo,
          "description": categoria.descripcion,
          "url": `https://www.decomotivo.com.ar${categoria.path}`
        }
      }))
    }
  });

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
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Catálogo de Productos Decorativos | DecoMotivo" />
        <meta name="twitter:description" content="Explora nuestra colección de productos decorativos personalizados en Tucumán." />
        <meta name="twitter:image" content="https://www.decomotivo.com.ar/images/productos.jpg" />
        
        {/* Schema.org */}
        <script type="application/ld+json">
          {JSON.stringify(generateCategoriesSchema())}
        </script>
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
                aria-label={`Ver productos de ${categoria.titulo}`}
              >
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-30 transition-all duration-300 group-hover:opacity-50 group-hover:scale-105"
                  style={{ backgroundImage: `url(${categoria.imagen})` }}
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
              <article 
                key={index}
                className="bg-fondo rounded-xl overflow-hidden shadow-custom transition-all duration-300 hover:-translate-y-2 hover:shadow-custom-lg"
                itemScope
                itemType="https://schema.org/Product"
              >
                <img 
                  src={producto.imagen}
                  alt={producto.alt}
                  className="w-full h-64 object-cover"
                  itemProp="image"
                  loading={index === 0 ? "eager" : "lazy"}
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2 text-secondary" itemProp="name">
                    {producto.titulo}
                  </h3>
                  <p className="text-texto" itemProp="description">
                    {producto.descripcion}
                  </p>
                  
                  {/* Metadatos estructurados ocultos */}
                  <div style={{display: 'none'}}>
                    <span itemProp="brand" itemScope itemType="https://schema.org/Brand">
                      <span itemProp="name">DecoMotivo</span>
                    </span>
                    <div itemProp="offers" itemScope itemType="https://schema.org/Offer">
                      <span itemProp="availability" content="https://schema.org/InStock">En stock</span>
                      <span itemProp="priceCurrency" content="ARS">ARS</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Productos;