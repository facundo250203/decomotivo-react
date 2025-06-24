import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Contacto = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    tipo: '',
    mensaje: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Enviar datos al PHP usando FormData
      const formDataToSend = new FormData();
      formDataToSend.append('nombre', formData.nombre);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('telefono', formData.telefono);
      formDataToSend.append('tipo', formData.tipo);
      formDataToSend.append('mensaje', formData.mensaje);

      const response = await fetch('/procesar-contacto.php', {
        method: 'POST',
        body: formDataToSend
      });

      if (response.ok) {
        // Si el envío fue exitoso, redirigir a la página de gracias
        navigate('/gracias');
      } else {
        // Si hay error, mostrar mensaje
        alert('Hubo un error al enviar el mensaje. Por favor, inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Hubo un error al enviar el mensaje. Por favor, inténtalo de nuevo.');
    }

    setIsLoading(false);
  };

  return (
    <>
      {/* Hero de contacto */}
      <section className="bg-gradient-to-r from-primary/85 to-secondary/90 text-blanco text-center py-20">
        <div className="container">
          <h2 className="text-4xl lg:text-5xl font-bold mb-5">Contáctanos</h2>
          <p className="text-xl max-w-2xl mx-auto">
            Estamos listos para transformar tu vida con diseños únicos
          </p>
        </div>
      </section>

      {/* Información de contacto y mapa */}
      <section className="py-16 bg-blanco">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Datos de contacto */}
            <div className="space-y-8">
              <h2 className="text-3xl font-bold mb-8 text-secondary">
                Información de Contacto
              </h2>
              
              {/* Dirección */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-map-marker-alt text-blanco text-xl"></i>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-secondary">Dirección</h3>
                  <p className="text-gris-medio">
                    Mendoza 2372, San Miguel de Tucumán, Tucumán, Argentina
                  </p>
                </div>
              </div>

              {/* Horarios */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-clock text-blanco text-xl"></i>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-secondary">Horario de Atención</h3>
                  <p className="text-gris-medio">Viernes: 17:00 - 21:00</p>
                  <p className="text-gris-medio">Sábados: 10:00 - 20:00</p>
                </div>
              </div>

              {/* Teléfonos */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-phone text-blanco text-xl"></i>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-secondary">Teléfonos</h3>
                  <p className="text-gris-medio">+54 9 381 512-8279</p>
                  <p className="text-gris-medio">+54 9 381 631-4426</p>
                </div>
              </div>
            </div>

            {/* Mapa */}
            <div className="h-96 rounded-xl overflow-hidden shadow-custom">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3560.445127451022!2d-65.23535672451172!3d-26.822023635267384!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94225c5ea58a33e1%3A0x702e01c01574e685!2sPci%20a%20de%20Mendoza%202372%2C%20T4000%20San%20Miguel%20de%20Tucum%C3%A1n%2C%20Tucum%C3%A1n!5e0!3m2!1ses!2sar!4v1712764839782!5m2!1ses!2sar"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación DecoMotivo"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* Formulario de contacto */}
      <section className="py-16 bg-fondo">
        <div className="container">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-10 text-secondary">
            Envíanos tu Consulta
          </h2>
          
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-blanco p-8 lg:p-12 rounded-xl shadow-custom">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nombre */}
              <div>
                <label htmlFor="nombre" className="block text-secondary font-medium mb-2">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors disabled:opacity-50"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-secondary font-medium mb-2">
                  Correo electrónico *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors disabled:opacity-50"
                />
              </div>

              {/* Teléfono */}
              <div>
                <label htmlFor="telefono" className="block text-secondary font-medium mb-2">
                  Número de teléfono
                </label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors disabled:opacity-50"
                />
              </div>

              {/* Tipo de consulta */}
              <div>
                <label htmlFor="tipo" className="block text-secondary font-medium mb-2">
                  Tipo de consulta *
                </label>
                <select
                  id="tipo"
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors disabled:opacity-50"
                >
                  <option value="" disabled>Selecciona una opción</option>
                  <option value="pedido">Pedido personalizado</option>
                  <option value="informacion">Información de productos</option>
                  <option value="presupuesto">Solicitud de presupuesto</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
            </div>

            {/* Mensaje */}
            <div className="mt-6">
              <label htmlFor="mensaje" className="block text-secondary font-medium mb-2">
                Mensaje *
              </label>
              <textarea
                id="mensaje"
                name="mensaje"
                value={formData.mensaje}
                onChange={handleChange}
                required
                rows="6"
                disabled={isLoading}
                className="w-full px-4 py-3 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-vertical disabled:opacity-50"
              ></textarea>
            </div>

            {/* Botón enviar */}
            <div className="mt-8 text-center">
              <button
                type="submit"
                disabled={isLoading}
                className="btn text-lg px-12 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Enviando...
                  </>
                ) : (
                  'Enviar mensaje'
                )}
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
};

export default Contacto;