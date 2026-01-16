// src/components/layout/Footer.jsx
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-secondary text-blanco py-12">
      <div className="container">
        <div className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-6 lg:gap-4">
          {/* Logo - Ahora es un Link al inicio */}
          <div className="flex items-center lg:justify-start">
            <Link to="/" className="transition-transform duration-300 hover:scale-105">
              <img 
                src="/images/logo.png" 
                alt="DecoMotivo Design" 
                className="h-14 w-14 filter brightness-0 invert object-contain"
              />
            </Link>
          </div>

          {/* Slogan - Sin puntos suspensivos */}
          <div className="text-center lg:flex-1">
            <p className="text-lg">Decorando Tu Vida</p>
          </div>

          {/* Redes sociales */}
          <div className="text-center lg:text-right">
            <h4 className="text-lg font-semibold mb-3">Seguinos</h4>
            <div className="flex gap-4 justify-center lg:justify-end">
              <a 
                href="#" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-2xl transition-all duration-300 hover:text-primary hover:scale-110"
                aria-label="Facebook"
              >
                <i className="fab fa-facebook"></i>
              </a>
              <a 
                href="https://www.instagram.com/deco_motivo" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-2xl transition-all duration-300 hover:text-primary hover:scale-110"
                aria-label="Instagram"
              >
                <i className="fab fa-instagram"></i>
              </a>
            </div>
          </div>
        </div>

        {/* Copyright - Centrado */}
        <div className="text-center border-t border-white/10 pt-6 text-sm space-y-1">
          <p>&copy; 2025 DecoMotivo. Todos los derechos reservados.</p>
          <p>Diseñado por DecoMotivo</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;