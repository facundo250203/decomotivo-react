// src/components/ProductCategory.jsx
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useState } from 'react';

const ProductCategory = ({ title, description, backgroundImage, products }) => {
  const { addToCart } = useCart();
  const [addedToCart, setAddedToCart] = useState({});

  // Función para formatear precios
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // Función para agregar al carrito con feedback visual
  const handleAddToCart = (product) => {
    addToCart(product);
    setAddedToCart({ ...addedToCart, [product.titulo]: true });
    
    // Quitar el mensaje después de 2 segundos
    setTimeout(() => {
      setAddedToCart({ ...addedToCart, [product.titulo]: false });
    }, 2000);
  };

  return (
    <>
      {/* Hero de la categoría */}
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
                  <h3 className="text-xl font-semibold mb-2 text-secondary">
                    {producto.titulo}
                  </h3>
                  
                  {/* PRECIO - Justo debajo del título */}
                  {producto.precio ? (
                    // Caso 1: Precio fijo
                    <p className="text-2xl font-bold text-primary mb-3">
                      {formatPrice(producto.precio)}
                    </p>
                  ) : producto.precioDesde ? (
                    // Caso 2: Precio "desde"
                    <p className="text-2xl font-bold text-primary mb-3">
                      Desde {formatPrice(producto.precioDesde)}
                    </p>
                  ) : producto.precioTexto && (
                    // Caso 3: "Consultar" u otro texto
                    <p className="text-2xl font-bold text-primary mb-3">
                      {producto.precioTexto}
                    </p>
                  )}
                  
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

                  {/* BOTONES CONDICIONALES - ESTA ES LA PARTE NUEVA */}
                  {producto.precio || producto.precioDesde ? (
                    // Si tiene precio, mostrar botón de AGREGAR AL CARRITO
                    <div className="relative">
                      <button
                        onClick={() => handleAddToCart(producto)}
                        className="w-full inline-flex items-center justify-center gap-3 bg-primary text-blanco px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:bg-accent hover:-translate-y-1"
                      >
                        <i className="fas fa-cart-plus text-xl"></i>
                        Agregar al Carrito
                      </button>
                      
                      {/* Mensaje de confirmación */}
                      {addedToCart[producto.titulo] && (
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full bg-green-500 text-blanco px-4 py-2 rounded-lg shadow-lg text-sm font-semibold whitespace-nowrap">
                          ✓ Agregado al carrito
                        </div>
                      )}
                    </div>
                  ) : (
                    // Si tiene precioTexto="Consultar", mostrar botón de WHATSAPP
                    <a
                      href={producto.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-3 bg-primary text-blanco px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:bg-accent hover:-translate-y-1"
                    >
                      <i className="fab fa-whatsapp text-xl"></i>
                      Consultar por WhatsApp
                    </a>
                  )}
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