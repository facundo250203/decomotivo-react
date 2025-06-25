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

  // Generar Schema.org para productos
  const generateProductsSchema = () => {
    const productsSchema = products.map(product => ({
      "@type": "Product",
      "name": product.titulo,
      "description": product.descripcion,
      "image": `https://www.decomotivo.com.ar${product.imagen}`,
      "brand": {
        "@type": "Brand",
        "name": "DecoMotivo"
      },
      "manufacturer": {
        "@type": "Organization",
        "name": "DecoMotivo"
      },
      "material": product.material || undefined,
      "offers": {
        "@type": "Offer",
        "availability": "https://schema.org/InStock",
        "priceCurrency": "ARS",
        "seller": {
          "@type": "Organization",
          "name": "DecoMotivo"
        }
      }
    }));

    return {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": title,
      "description": description,
      "url": canonicalUrl,
      "mainEntity": {
        "@type": "ItemList",
        "numberOfItems": products.length,
        "itemListElement": productsSchema.map((product, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": product
        }))
      }
    };
  };

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
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={`https://www.decomotivo.com.ar${backgroundImage}`} />
        
        {/* Schema.org */}
        <script type="application/ld+json">
          {JSON.stringify(generateProductsSchema())}
        </script>
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
              <article 
                key={index}
                className="producto-card bg-blanco rounded-xl overflow-hidden shadow-custom transition-all duration-300 hover:shadow-custom-lg"
                itemScope
                itemType="https://schema.org/Product"
              >
                {/* Imagen del producto */}
                <div className="h-72 overflow-hidden">
                  <img 
                    src={producto.imagen}
                    alt={`${producto.titulo} - ${producto.descripcion}`}
                    className="w-full h-full object-cover"
                    itemProp="image"
                    loading={index < 3 ? "eager" : "lazy"}
                  />
                </div>

                {/* Info del producto */}
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-3 text-secondary" itemProp="name">
                    {producto.titulo}
                  </h3>
                  <p className="text-texto mb-4" itemProp="description">
                    {producto.descripcion}
                  </p>

                  {/* Metadatos estructurados ocultos */}
                  <div style={{display: 'none'}}>
                    <span itemProp="brand" itemScope itemType="https://schema.org/Brand">
                      <span itemProp="name">DecoMotivo</span>
                    </span>
                    {producto.material && (
                      <span itemProp="material">{producto.material}</span>
                    )}
                    <div itemProp="offers" itemScope itemType="https://schema.org/Offer">
                      <span itemProp="availability" content="https://schema.org/InStock">En stock</span>
                      <span itemProp="priceCurrency" content="ARS">ARS</span>
                    </div>
                  </div>

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
                    aria-label={`Consultar sobre ${producto.titulo} por WhatsApp`}
                  >
                    <i className="fab fa-whatsapp text-xl"></i>
                    Consultar por WhatsApp
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default ProductCategory;