// src/components/ProductImageCarousel.jsx
import { useState } from 'react';

const ProductImageCarousel = ({ imagenes = [], titulo, className = "h-72" }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Si no hay imágenes, mostrar placeholder
  if (!imagenes || imagenes.length === 0) {
    return (
      <div className={`${className} overflow-hidden bg-gris-claro flex items-center justify-center`}>
        <div className="text-center text-gris-medio">
          <i className="fas fa-image text-6xl"></i>
        </div>
      </div>
    );
  }

  // Si solo hay 1 imagen, mostrar sin controles
  if (imagenes.length === 1) {
    return (
      <div className={`${className} overflow-hidden bg-gris-claro relative`}>
        <img 
          src={imagenes[0].url}
          alt={imagenes[0].alt_text || titulo}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Funciones de navegación
  const goToPrevious = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === 0 ? imagenes.length - 1 : prev - 1
    );
  };

  const goToNext = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === imagenes.length - 1 ? 0 : prev + 1
    );
  };

  const goToImage = (index, e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(index);
  };

  return (
    <div className={`${className} overflow-hidden bg-gris-claro relative group`}>
      {/* Imagen actual */}
      <img 
        src={imagenes[currentImageIndex].url}
        alt={imagenes[currentImageIndex].alt_text || titulo}
        className="w-full h-full object-cover transition-opacity duration-300"
      />

      {/* Badge con cantidad de fotos - Superior derecho */}
      <div className="absolute top-3 right-3 bg-secondary/90 text-blanco px-3 py-1 rounded-full text-sm font-semibold shadow-lg backdrop-blur-sm flex items-center gap-1">
        <i className="fas fa-images text-xs"></i>
        <span>{imagenes.length}</span>
      </div>

      {/* Flecha Izquierda - Visible en mobile, hover en desktop */}
      <button
        onClick={goToPrevious}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-blanco/90 hover:bg-blanco text-secondary w-10 h-10 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 hover:scale-110 z-10"
        aria-label="Imagen anterior"
      >
        <i className="fas fa-chevron-left"></i>
      </button>

      {/* Flecha Derecha - Visible en mobile, hover en desktop */}
      <button
        onClick={goToNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-blanco/90 hover:bg-blanco text-secondary w-10 h-10 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 hover:scale-110 z-10"
        aria-label="Imagen siguiente"
      >
        <i className="fas fa-chevron-right"></i>
      </button>

      {/* Indicadores (Dots) - Siempre visibles */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {imagenes.map((_, index) => (
          <button
            key={index}
            onClick={(e) => goToImage(index, e)}
            className={`transition-all duration-300 rounded-full ${
              index === currentImageIndex 
                ? 'w-8 h-2 bg-primary' 
                : 'w-2 h-2 bg-blanco/70 hover:bg-blanco'
            }`}
            aria-label={`Ver imagen ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductImageCarousel;