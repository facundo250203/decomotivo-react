import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/' || path === '/inicio') {
      return location.pathname === '/' || location.pathname === '/inicio';
    }
    return location.pathname === path;
  };

  const menuItems = [
    { path: '/inicio', label: 'Quienes Somos' },
    { path: '/productos', label: 'Productos' },
    { path: '/contacto', label: 'Contacto' }
  ];

  return (
    <header className="bg-blanco shadow-custom py-4 sticky top-0 z-50">
      <div className="container">
        <div className="flex justify-between items-center lg:grid lg:grid-cols-3 lg:items-center">
          {/* Logo */}
          <div className="flex items-center lg:justify-start">
            <Link to="/">
              <img 
                src="/images/logo.png" 
                alt="DecoMotivo Design" 
                className="h-12 lg:h-14 w-12 lg:w-14 object-contain"
                />
            </Link>
          </div>

          {/* Menú de navegación - Desktop */}
          <nav className="hidden lg:flex justify-center">
            <ul className="flex gap-8">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`font-medium py-2 relative transition-all duration-300 ${
                      isActive(item.path)
                        ? 'text-primary after:w-full'
                        : 'text-texto hover:text-primary after:w-0 hover:after:w-full'
                    } after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:bg-primary after:transition-all after:duration-300`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* FAQ Button y Menu Toggle */}
          <div className="flex items-center gap-4 lg:justify-end">
            {/* FAQ Button */}
            <Link
              to="/faq"
              className={`w-10 h-10 rounded-full flex items-center justify-center text-blanco text-xl transition-all duration-300 border-2 border-blanco shadow-md ${
                isActive('/faq')
                  ? 'bg-accent'
                  : 'bg-primary hover:bg-accent hover:scale-110'
              }`}
              title="Preguntas Frecuentes"
            >
              <i className="fas fa-question"></i>
            </Link>

            {/* Mobile menu button */}
            <button
              className="lg:hidden flex flex-col justify-center items-center w-8 h-8 space-y-1"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <span className={`block w-6 h-0.5 bg-texto transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
              <span className={`block w-6 h-0.5 bg-texto transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`block w-6 h-0.5 bg-texto transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
            </button>
          </div>
        </div>

        {/* Menú móvil */}
        <nav className={`lg:hidden transition-all duration-300 overflow-hidden ${isMenuOpen ? 'max-h-48 mt-4' : 'max-h-0'}`}>
          <ul className="flex flex-col gap-4 py-4">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`block font-medium py-2 px-4 rounded transition-all duration-300 ${
                    isActive(item.path)
                      ? 'text-primary bg-gris-claro'
                      : 'text-texto hover:text-primary hover:bg-gris-claro'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;