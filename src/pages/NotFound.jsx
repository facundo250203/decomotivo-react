// src/pages/NotFound.jsx
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const NotFound = () => {
  return (
    <>
      <Helmet>
        <title>Página no encontrada | DecoMotivo</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-fondo to-blanco px-4">
        <div className="text-center max-w-2xl">
          {/* Ilustración 404 */}
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-primary mb-4">404</h1>
            <div className="text-6xl mb-4">🔍</div>
          </div>

          {/* Mensaje */}
          <h2 className="text-3xl lg:text-4xl font-bold text-secondary mb-4">
            ¡Ups! Página no encontrada
          </h2>
          <p className="text-lg text-texto mb-8">
            La página que estás buscando no existe o fue movida. 
            Pero no te preocupes, podés volver al inicio o explorar nuestros productos.
          </p>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 bg-primary text-blanco px-8 py-4 rounded-lg font-semibold transition-all duration-300 hover:bg-accent hover:-translate-y-1"
            >
              <i className="fas fa-home"></i>
              Volver al Inicio
            </Link>
            <Link
              to="/productos"
              className="inline-flex items-center justify-center gap-2 bg-secondary text-blanco px-8 py-4 rounded-lg font-semibold transition-all duration-300 hover:bg-gris-medio hover:-translate-y-1"
            >
              <i className="fas fa-box"></i>
              Ver Productos
            </Link>
          </div>

          {/* Enlaces adicionales */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gris-medio mb-4">¿Necesitás ayuda?</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/contacto" className="text-primary hover:underline">
                Contactanos
              </Link>
              <Link to="/faq" className="text-primary hover:underline">
                Preguntas Frecuentes
              </Link>
              <a 
                href="https://wa.me/5493815128279" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                <i className="fab fa-whatsapp"></i>
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;