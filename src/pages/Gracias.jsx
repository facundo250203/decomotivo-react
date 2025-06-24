import { Link } from 'react-router-dom';

const Gracias = () => {
  return (
    <section className="py-24 bg-fondo min-h-screen flex items-center">
      <div className="container">
        <div className="max-w-2xl mx-auto bg-blanco p-12 lg:p-16 rounded-xl shadow-custom text-center">
          <div className="mb-8">
            <i className="fas fa-check-circle text-6xl text-primary mb-6"></i>
            <h2 className="text-3xl lg:text-4xl font-bold mb-6 text-secondary">
              ¡Gracias por tu mensaje!
            </h2>
            <p className="text-lg text-gris-medio mb-8">
              Hemos recibido tu consulta y nos pondremos en contacto contigo lo antes posible.
            </p>
          </div>
          
          <div className="space-y-4">
            <Link 
              to="/inicio" 
              className="btn text-lg px-8 py-4 mr-4"
            >
              Volver al inicio
            </Link>
            <Link 
              to="/productos" 
              className="inline-block bg-secondary text-blanco px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 hover:bg-gris-medio hover:-translate-y-1"
            >
              Ver productos
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Gracias;