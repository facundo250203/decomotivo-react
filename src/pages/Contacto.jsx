// src/pages/Contacto.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

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
        navigate('/gracias');
      } else {
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
      <Helmet>
        <title>Contacto | DecoMotivo - Productos Decorativos Personalizados</title>
        <meta 
          name="description" 
          content="Contacta con DecoMotivo para consultas sobre productos decorativos personalizados. Estamos en Tucumán, Argentina. Respondemos rápidamente por WhatsApp." 
        />
        <meta name="keywords" content="contacto DecoMotivo, consultas, presupuesto, Tucumán, WhatsApp" />
        <link rel="canonical" href="https://www.decomotivo.com.ar/contacto" />
      </Helmet>

      {/* Hero de contacto */}
      <section className="bg-gradient-to-r from-primary/85 to-secondary/90 text-blanco text-center py-20">
        <div className="container">
          <h1 className="text-4xl lg:text-5xl font-bold mb-5">Contactanos</h1>
          <p className="text-xl max-w-2xl mx-auto">
            Estamos listos para transformar tus espacios con diseños únicos
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

              {/* WhatsApp */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="fab fa-whatsapp text-blanco text-xl"></i>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-secondary">WhatsApp</h3>
                  <a 
                    href="https://wa.me/5493815128279" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:text-accent transition-colors font-medium"
                  >
                    +54 9 381 512-8279
                  </a>
                  <p className="text-gris-medio text-sm mt-1">
                    Respondemos lo antes posible
                  </p>
                </div>
              </div>

              {/* Instagram */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="fab fa-instagram text-blanco text-xl"></i>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-secondary">Instagram</h3>
                  <a 
                    href="https://www.instagram.com/deco_motivo" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:text-accent transition-colors font-medium"
                  >
                    @deco_motivo
                  </a>
                  <p className="text-gris-medio text-sm mt-1">
                    Mirá nuestros últimos trabajos
                  </p>
                </div>
              </div>
            </div>

            {/* Mapa */}
            <div className="h-96 lg:h-auto rounded-xl overflow-hidden shadow-custom">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3560.1234567890123!2d-65.2176!3d-26.8367!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjbCsDUwJzEyLjEiUyA2NcKwMTMnMDMuNCJX!5e0!3m2!1ses!2sar!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: '400px' }}
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
        <div className="container max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-8 text-secondary">
            Envianos un Mensaje
          </h2>
          <p className="text-center text-gris-medio mb-10">
            Completá el formulario y te responderemos a la brevedad
          </p>

          <form onSubmit={handleSubmit} className="bg-blanco rounded-xl shadow-custom p-8">
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
                  placeholder="Ej: Juan Pérez"
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
                  placeholder="Ej: juan@email.com"
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
                  placeholder="Ej: 381 123-4567"
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
                  <option value="">Seleccioná una opción</option>
                  <option value="pedido">Pedido personalizado</option>
                  <option value="informacion">Información de productos</option>
                  <option value="presupuesto">Solicitud de presupuesto</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              {/* Mensaje */}
              <div className="md:col-span-2">
                <label htmlFor="mensaje" className="block text-secondary font-medium mb-2">
                  Tu mensaje *
                </label>
                <textarea
                  id="mensaje"
                  name="mensaje"
                  value={formData.mensaje}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  rows="5"
                  placeholder="Contanos qué producto te interesa, si querés personalizarlo, cantidad, etc."
                  className="w-full px-4 py-3 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-none disabled:opacity-50"
                ></textarea>
              </div>
            </div>

            {/* Botón enviar */}
            <div className="mt-8 text-center">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-primary text-blanco px-10 py-4 rounded-lg font-semibold text-lg transition-all duration-300 hover:bg-accent hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Enviando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane mr-2"></i>
                    Enviar Mensaje
                  </>
                )}
              </button>
            </div>
          </form>

          {/* CTA WhatsApp */}
          <div className="mt-10 text-center">
            <p className="text-gris-medio mb-4">¿Preferís una respuesta más rápida?</p>
            <a
              href="https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20quisiera%20hacer%20una%20consulta"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 text-blanco px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:bg-green-600 hover:scale-105"
            >
              <i className="fab fa-whatsapp text-xl"></i>
              Escribinos por WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export default Contacto;