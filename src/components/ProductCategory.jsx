import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

const ProductCategory = ({ 
  title, 
  description, 
  backgroundImage, 
  products,
  seoTitle,
  seoDescription,
  seoKeywords,
  canonicalUrl
}) => {
  useEffect(() => {
    // Animación de productos
    const productos = document.querySelectorAll('.producto-card');
    productos.forEach((producto, index) => {
      producto.style.opacity = '0';
      producto.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        producto.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        producto.style.opacity = '1';
        producto.style.transform = 'translateY(0)';
      }, index * 100);
    });
  }, []);

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="keywords" content={seoKeywords} />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph */}
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:image" content={`https://www.decomotivo.com.ar${backgroundImage}`} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* Banner de categoría */}
      <section 
        className="relative bg-cover bg-center text-blanco text-center py-16"
        style={{ backgroundImage: `url('${backgroundImage}')` }}
      >
        {/* Overlay gradiente */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/85 to-secondary/90"></div>
        
        {/* Contenido */}
        <div className="container relative z-10">
          <h1 className="text-4xl lg:text-5xl font-bold mb-5">{title}</h1>
          <p className="text-lg lg:text-xl max-w-4xl mx-auto">
            {description}
          </p>
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((producto, index) => (
              <div 
                key={index}
                className="producto-card bg-blanco rounded-xl overflow-hidden shadow-custom transition-all duration-300 hover:shadow-custom-lg"
              >
                {/* Imagen del producto */}
                <div className="h-72 overflow-hidden">
                  <img 
                    src={producto.imagen}
                    alt={producto.titulo}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info del producto */}
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-3 text-secondary">
                    {producto.titulo}
                  </h3>
                  <p className="text-texto mb-4">
                    {producto.descripcion}
                  </p>

                  {/* Detalles del producto */}
                  <div className="bg-gris-claro p-4 rounded-lg mb-4 space-y-2">
                    {producto.material && (
                      <p className="text-sm">
                        <strong className="text-secondary">Material:</strong> {producto.material}
                      </p>
                    )}
                    {producto.medidas && (
                      <p className="text-sm">
                        <strong className="text-secondary">Medidas:</strong> {producto.medidas}
                      </p>
                    )}
                    {producto.personalizable && (
                      <p className="text-sm">
                        <strong className="text-secondary">Personalizable:</strong> {producto.personalizable}
                      </p>
                    )}
                    {producto.incluye && (
                      <p className="text-sm">
                        <strong className="text-secondary">Incluye:</strong> {producto.incluye}
                      </p>
                    )}
                    {producto.capacidad && (
                      <p className="text-sm">
                        <strong className="text-secondary">Capacidad:</strong> {producto.capacidad}
                      </p>
                    )}
                    {producto.colores && (
                      <p className="text-sm">
                        <strong className="text-secondary">Colores disponibles:</strong> {producto.colores}
                      </p>
                    )}
                    {producto.otrosTamaños && (
                      <p className="text-sm">
                        <strong className="text-secondary">Otros tamaños:</strong> {producto.otrosTamaños}
                      </p>
                    )}
                  </div>

                  {/* Botón de WhatsApp */}
                  <a
                    href={producto.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-3 bg-primary text-blanco px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:bg-accent hover:-translate-y-1"
                  >
                    <i className="fab fa-whatsapp text-xl"></i>
                    Consultar por WhatsApp
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default ProductCategory;