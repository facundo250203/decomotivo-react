// src/components/ProductImageCarousel.jsx
import { useState, useEffect } from 'react';

const ProductImageCarousel = ({ imagenes = [], titulo, className = "h-72" }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  
  // Cerrar lightbox con Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxOpen) return;
      
      if (e.key === 'Escape') {
        setLightboxOpen(false);
      } else if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    // Bloquear scroll cuando el lightbox está abierto
    if (lightboxOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [lightboxOpen, currentImageIndex]);

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

  // Funciones de navegación
  const goToPrevious = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentImageIndex((prev) => 
      prev === 0 ? imagenes.length - 1 : prev - 1
    );
  };

  const goToNext = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentImageIndex((prev) => 
      prev === imagenes.length - 1 ? 0 : prev + 1
    );
  };

  const goToImage = (index, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentImageIndex(index);
  };

  const openLightbox = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setLightboxOpen(true);
  };

  const closeLightbox = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setLightboxOpen(false);
  };

  // Si solo hay 1 imagen
  if (imagenes.length === 1) {
    return (
      <>
        <div className={`${className} overflow-hidden bg-gris-claro relative group cursor-pointer`}>
          <img 
            src={imagenes[0].url}
            alt={imagenes[0].alt_text || titulo}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onClick={openLightbox}
          />
          
          {/* Botón para ampliar */}
          <button
            onClick={openLightbox}
            className="absolute bottom-3 right-3 bg-secondary/90 hover:bg-secondary text-blanco w-10 h-10 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 z-10"
            aria-label="Ver imagen en grande"
          >
            <i className="fas fa-expand"></i>
          </button>
        </div>

        {/* Lightbox */}
        {lightboxOpen && (
          <Lightbox
            imagenes={imagenes}
            currentIndex={currentImageIndex}
            titulo={titulo}
            onClose={closeLightbox}
            onPrev={goToPrevious}
            onNext={goToNext}
            onGoToImage={goToImage}
          />
        )}
      </>
    );
  }

  // Múltiples imágenes con carrusel
  return (
    <>
      <div className={`${className} overflow-hidden bg-gris-claro relative group`}>
        {/* Imagen actual - clickeable para abrir lightbox */}
        <img 
          src={imagenes[currentImageIndex].url}
          alt={imagenes[currentImageIndex].alt_text || titulo}
          className="w-full h-full object-cover transition-all duration-300 cursor-pointer group-hover:scale-105"
          onClick={openLightbox}
        />

        {/* Badge con cantidad de fotos - Superior derecho */}
        <div className="absolute top-3 right-3 bg-secondary/90 text-blanco px-3 py-1 rounded-full text-sm font-semibold shadow-lg backdrop-blur-sm flex items-center gap-1">
          <i className="fas fa-images text-xs"></i>
          <span>{imagenes.length}</span>
        </div>

        {/* Botón para ampliar - Inferior derecho */}
        <button
          onClick={openLightbox}
          className="absolute bottom-3 right-3 bg-secondary/90 hover:bg-secondary text-blanco w-10 h-10 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 z-10"
          aria-label="Ver imagen en grande"
        >
          <i className="fas fa-expand"></i>
        </button>

        {/* Flecha Izquierda */}
        <button
          onClick={goToPrevious}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-blanco/90 hover:bg-blanco text-secondary w-10 h-10 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 hover:scale-110 z-10"
          aria-label="Imagen anterior"
        >
          <i className="fas fa-chevron-left"></i>
        </button>

        {/* Flecha Derecha */}
        <button
          onClick={goToNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-blanco/90 hover:bg-blanco text-secondary w-10 h-10 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 hover:scale-110 z-10"
          aria-label="Imagen siguiente"
        >
          <i className="fas fa-chevron-right"></i>
        </button>

        {/* Indicadores (Dots) */}
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

      {/* Lightbox */}
      {lightboxOpen && (
        <Lightbox
          imagenes={imagenes}
          currentIndex={currentImageIndex}
          titulo={titulo}
          onClose={closeLightbox}
          onPrev={goToPrevious}
          onNext={goToNext}
          onGoToImage={goToImage}
        />
      )}
    </>
  );
};

// ============================================
// COMPONENTE LIGHTBOX
// ============================================
const Lightbox = ({ imagenes, currentIndex, titulo, onClose, onPrev, onNext, onGoToImage }) => {
  const currentImage = imagenes[currentIndex];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
      
      {/* Contenido del lightbox */}
      <div 
        className="relative z-10 w-full h-full flex flex-col items-center justify-center p-4 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white w-12 h-12 rounded-full transition-all duration-300 flex items-center justify-center hover:scale-110 z-20"
          aria-label="Cerrar"
        >
          <i className="fas fa-times text-xl"></i>
        </button>

        {/* Contador de imágenes */}
        <div className="absolute top-4 left-4 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
          {currentIndex + 1} / {imagenes.length}
        </div>

        {/* Título del producto */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/10 text-white px-6 py-2 rounded-full text-sm font-medium backdrop-blur-sm max-w-xs md:max-w-md truncate hidden md:block">
          {titulo}
        </div>

        {/* Contenedor de imagen */}
        <div className="relative flex-1 w-full flex items-center justify-center max-h-[70vh] md:max-h-[80vh]">
          {/* Flecha izquierda */}
          {imagenes.length > 1 && (
            <button
              onClick={onPrev}
              className="absolute left-2 md:left-8 bg-white/10 hover:bg-white/20 text-white w-12 h-12 md:w-14 md:h-14 rounded-full transition-all duration-300 flex items-center justify-center hover:scale-110 z-20"
              aria-label="Imagen anterior"
            >
              <i className="fas fa-chevron-left text-xl"></i>
            </button>
          )}

          {/* Imagen principal */}
          <img
            src={currentImage.url}
            alt={currentImage.alt_text || titulo}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            style={{ maxHeight: '70vh' }}
          />

          {/* Flecha derecha */}
          {imagenes.length > 1 && (
            <button
              onClick={onNext}
              className="absolute right-2 md:right-8 bg-white/10 hover:bg-white/20 text-white w-12 h-12 md:w-14 md:h-14 rounded-full transition-all duration-300 flex items-center justify-center hover:scale-110 z-20"
              aria-label="Imagen siguiente"
            >
              <i className="fas fa-chevron-right text-xl"></i>
            </button>
          )}
        </div>

        {/* Miniaturas */}
        {imagenes.length > 1 && (
          <div className="mt-4 flex gap-2 overflow-x-auto max-w-full pb-2 px-4">
            {imagenes.map((img, index) => (
              <button
                key={index}
                onClick={(e) => onGoToImage(index, e)}
                className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden transition-all duration-300 ${
                  index === currentIndex 
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-black/50 scale-105' 
                    : 'opacity-50 hover:opacity-100'
                }`}
              >
                <img
                  src={img.url}
                  alt={img.alt_text || `Imagen ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Instrucciones */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs hidden md:block">
          Usá las flechas del teclado para navegar • ESC para cerrar
        </div>
      </div>
    </div>
  );
};

export default ProductImageCarousel;