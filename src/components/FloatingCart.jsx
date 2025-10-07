import { useState } from 'react';
import { useCart } from '../context/CartContext';

const FloatingCart = () => {
  const { cartItems, getTotalItems, removeFromCart, updateQuantity, clearCart, getWhatsAppUrl } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const totalItems = getTotalItems();

  // No mostrar el botón si no hay productos
  if (totalItems === 0) return null;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleSendWhatsApp = () => {
    window.open(getWhatsAppUrl(), '_blank');
    setIsOpen(false);
    clearCart();
  };

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-primary text-blanco w-16 h-16 rounded-full shadow-custom-lg flex items-center justify-center transition-all duration-300 hover:bg-accent hover:scale-110 z-40"
        aria-label="Ver carrito"
      >
        <i className="fas fa-shopping-cart text-2xl"></i>
        {totalItems > 0 && (
          <span className="absolute -top-2 -right-2 bg-accent text-blanco w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold border-2 border-blanco">
            {totalItems}
          </span>
        )}
      </button>

      {/* Modal del carrito */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-negro/50 z-40"
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Modal */}
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-blanco shadow-custom-xl z-50 flex flex-col">
            {/* Header */}
            <div className="bg-primary text-blanco p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <i className="fas fa-shopping-cart"></i>
                Carrito de Consultas
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-blanco hover:text-gris-claro transition-colors"
                aria-label="Cerrar"
              >
                <i className="fas fa-times text-2xl"></i>
              </button>
            </div>

            {/* Contenido del carrito */}
            <div className="flex-1 overflow-y-auto p-6">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <i className="fas fa-shopping-cart text-6xl text-gris-claro mb-4"></i>
                  <p className="text-gris-medio text-lg">
                    Tu carrito está vacío
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item, index) => (
                    <div 
                      key={index}
                      className="bg-fondo p-4 rounded-lg border-l-4 border-primary"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-secondary flex-1">
                          {item.titulo}
                        </h3>
                        <button
                          onClick={() => removeFromCart(item.titulo)}
                          className="text-primary hover:text-accent transition-colors ml-2"
                          aria-label="Eliminar"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-primary font-bold">
                          {item.precio && formatPrice(item.precio)}
                          {item.precioDesde && `Desde ${formatPrice(item.precioDesde)}`}
                        </div>

                        {/* Controles de cantidad */}
                        <div className="flex items-center gap-3 bg-blanco rounded-lg px-3 py-1">
                          <button
                            onClick={() => updateQuantity(item.titulo, item.quantity - 1)}
                            className="text-primary hover:text-accent font-bold text-lg"
                            aria-label="Disminuir cantidad"
                          >
                            <i className="fas fa-minus"></i>
                          </button>
                          <span className="font-semibold min-w-[20px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.titulo, item.quantity + 1)}
                            className="text-primary hover:text-accent font-bold text-lg"
                            aria-label="Aumentar cantidad"
                          >
                            <i className="fas fa-plus"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer con acciones */}
            {cartItems.length > 0 && (
              <div className="border-t border-gris-claro p-6 space-y-3">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold text-secondary">
                    Total de productos:
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {totalItems}
                  </span>
                </div>

                {/* Botón de WhatsApp */}
                <button
                  onClick={handleSendWhatsApp}
                  className="w-full bg-primary text-blanco px-6 py-4 rounded-lg font-semibold text-lg flex items-center justify-center gap-3 transition-all duration-300 hover:bg-accent hover:-translate-y-1"
                >
                  <i className="fab fa-whatsapp text-2xl"></i>
                  Enviar Consulta por WhatsApp
                </button>

                {/* Botón vaciar carrito */}
                <button
                  onClick={() => {
                    if (window.confirm('¿Estás seguro de vaciar el carrito?')) {
                      clearCart();
                    }
                  }}
                  className="w-full bg-gris-claro text-texto px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:bg-gris-medio"
                >
                  <i className="fas fa-trash mr-2"></i>
                  Vaciar Carrito
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default FloatingCart;