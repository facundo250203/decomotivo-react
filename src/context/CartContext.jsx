import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe usarse dentro de CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  // Cargar carrito del localStorage al iniciar
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem('decoMotivo_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });

  // Guardar en localStorage cada vez que cambie el carrito
  useEffect(() => {
    localStorage.setItem('decoMotivo_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Agregar producto al carrito
  const addToCart = (product) => {
    setCartItems((prevItems) => {
      // Verificar si el producto ya existe en el carrito
      const existingItem = prevItems.find(item => item.titulo === product.titulo);
      
      if (existingItem) {
        // Si existe, incrementar cantidad
        return prevItems.map(item =>
          item.titulo === product.titulo
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Si no existe, agregarlo con cantidad 1
        return [...prevItems, { ...product, quantity: 1 }];
      }
    });
  };

  // Eliminar producto del carrito
  const removeFromCart = (productTitle) => {
    setCartItems((prevItems) => 
      prevItems.filter(item => item.titulo !== productTitle)
    );
  };

  // Actualizar cantidad de un producto
  const updateQuantity = (productTitle, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productTitle);
      return;
    }
    
    setCartItems((prevItems) =>
      prevItems.map(item =>
        item.titulo === productTitle
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  // Vaciar todo el carrito
  const clearCart = () => {
    setCartItems([]);
  };

  // Obtener cantidad total de productos
  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  // Generar mensaje de WhatsApp
  const generateWhatsAppMessage = () => {
    if (cartItems.length === 0) return '';

    let message = 'Hola DecoMotivo, estoy interesado/a en los siguientes productos:\n\n';
    
    cartItems.forEach((item) => {
      let priceText = '';
      if (item.precio) {
        priceText = ` - $${item.precio.toLocaleString('es-AR')}`;
      } else if (item.precioDesde) {
        priceText = ` - Desde $${item.precioDesde.toLocaleString('es-AR')}`;
      }
      
      const quantityText = item.quantity > 1 ? ` (x${item.quantity})` : '';
      message += `• ${item.titulo}${priceText}${quantityText}\n`;
    });
    
    message += '\n¿Podrían darme más información?';
    
    return encodeURIComponent(message);
  };

  // Obtener URL de WhatsApp con el mensaje
  const getWhatsAppUrl = () => {
    const phoneNumber = '5493815128279'; // Tu número de WhatsApp
    const message = generateWhatsAppMessage();
    return `https://wa.me/${phoneNumber}?text=${message}`;
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getWhatsAppUrl,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};