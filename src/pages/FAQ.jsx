import { useState } from 'react';
import { Helmet } from 'react-helmet-async';

const FAQ = () => {
  const [activeItems, setActiveItems] = useState([]);

  const toggleItem = (index) => {
    if (activeItems.includes(index)) {
      setActiveItems(activeItems.filter(item => item !== index));
    } else {
      setActiveItems([...activeItems, index]);
    }
  };

  const faqData = [
    {
      category: "Productos y Personalización",
      questions: [
        {
          question: "¿Todos los productos se pueden personalizar?",
          answer: "La mayoría de nuestros productos son personalizables. Ofrecemos grabado láser, y personalización con distintos colores y diseños según el material y tipo de producto."
        },
        {
          question: "¿Qué tipo de personalización puedo agregar a los mates?",
          answer: "En los mates puedes agregar nombres, frases, logos, dibujos personalizados, rostros, fechas especiales y más. Utilizamos técnicas de grabado láser para asegurar un acabado duradero y de alta calidad."
        },
        {
          question: "¿Qué tipos de madera utilizan para sus productos?",
          answer: "Utilizamos principalmente algarrobo, quebracho, pino, quebracho colorado, guayacán y MDF. El algarrobo y quebracho son ideales para mates y accesorios que requieren durabilidad. El pino es perfecto para decoraciones y muebles ligeros. El MDF lo utilizamos para productos donde se requiere precisión en el corte."
        }
      ]
    },
    {
      category: "Pedidos y Entregas",
      questions: [
        {
          question: "¿Cuánto tiempo demora la elaboración de un producto personalizado?",
          answer: "El tiempo de elaboración varía según el producto y el tipo de personalización. Generalmente, los productos personalizados demoran entre 2 a 5 días hábiles. Para pedidos más urgentes, consulta disponibilidad."
        },
        {
          question: "¿Realizan envíos?",
          answer: "Sí, para pedidos locales en San Miguel de Tucumán, ofrecemos envío, a cargo de nosotros o Uber, o retiro en nuestro local. Para aquellos pedidos fuera de la capital, consultar para coordinar."
        },
        {
          question: "¿Cómo puedo hacer un pedido para un evento o empresa?",
          answer: "Para pedidos corporativos o para eventos, recomendamos contactarnos directamente por WhatsApp o por correo o visitarnos en nuestro local. Ofrecemos precios especiales para pedidos al por mayor y podemos trabajar en diseños específicos para tu empresa o evento."
        }
      ]
    },
    {
      category: "Pagos y Garantía",
      questions: [
        {
          question: "¿Por qué solicitan una seña para confirmar el pedido?",
          answer: "Todos los productos que serán personalizados, requieren de una seña del 50% del valor del producto para comenzar con su personalización, caso contrario no se grabará nada."
        },
        {
          question: "¿Qué métodos de pago aceptan?",
          answer: "Aceptamos efectivo y transferencia bancaria."
        },
        {
          question: "¿Todos los productos tienen garantía?",
          answer: "Todos nuestros productos tienen garantía contra defectos de fabricación por 14 días desde la fecha de compra. La garantía no cubre daños por mal uso o desgaste normal del producto."
        }
      ]
    }
  ];

  let questionIndex = 0;

  return (
    <>
      <Helmet>
        <title>Preguntas Frecuentes | DecoMotivo</title>
        <meta name="description" content="Resolvemos tus dudas sobre productos personalizados, envíos, personalizaciones, materiales y más. Todo lo que necesitas saber antes de comprar en DecoMotivo." />
        <meta name="keywords" content="preguntas frecuentes, FAQ, personalización, envíos, garantía, métodos de pago, DecoMotivo, Tucumán" />
        <link rel="canonical" href="https://www.decomotivo.com.ar/faq" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Preguntas Frecuentes | DecoMotivo" />
        <meta property="og:description" content="Resolvemos tus dudas sobre productos personalizados, envíos, personalizaciones, materiales y más." />
        <meta property="og:image" content="https://www.decomotivo.com.ar/images/logo.png" />
        <meta property="og:url" content="https://www.decomotivo.com.ar/faq" />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* Hero de FAQ */}
      <section className="bg-gradient-to-r from-primary/85 to-secondary/90 text-blanco text-center py-20">
        <div className="container">
          <h1 className="text-4xl lg:text-5xl font-bold mb-5">Preguntas Frecuentes</h1>
          <p className="text-xl max-w-2xl mx-auto">
            Encuentra respuestas a las preguntas más comunes sobre nuestros productos y servicios
          </p>
        </div>
      </section>

      {/* Contenido FAQ */}
      <section className="py-16 bg-fondo">
        <div className="container max-w-4xl">
          {faqData.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-12">
              <h2 className="text-2xl lg:text-3xl font-bold text-primary mb-6 pb-3 border-b-2 border-primary">
                {category.category}
              </h2>
              
              <div className="space-y-4">
                {category.questions.map((item, itemIndex) => {
                  const currentIndex = questionIndex++;
                  const isActive = activeItems.includes(currentIndex);
                  
                  return (
                    <div
                      key={itemIndex}
                      className="bg-blanco rounded-xl shadow-custom overflow-hidden"
                    >
                      <button
                        onClick={() => toggleItem(currentIndex)}
                        className="w-full px-6 py-5 text-left bg-fondo hover:bg-gris-claro transition-colors duration-300 flex justify-between items-center"
                      >
                        <h3 className="text-lg font-semibold text-secondary pr-4">
                          {item.question}
                        </h3>
                        <i className={`fas fa-chevron-down text-primary text-xl transition-transform duration-300 ${isActive ? 'rotate-180' : ''}`}></i>
                      </button>
                      
                      <div className={`overflow-hidden transition-all duration-300 ${isActive ? 'max-h-96' : 'max-h-0'}`}>
                        <div className="px-6 py-5 bg-blanco">
                          <p className="text-texto leading-relaxed">
                            {item.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* CTA de contacto */}
          <div className="bg-primary text-blanco p-8 lg:p-12 rounded-xl text-center mt-16">
            <h2 className="text-2xl lg:text-3xl font-bold mb-4">
              ¿No encontraste lo que buscabas?
            </h2>
            <p className="text-lg mb-6 opacity-90">
              Estamos aquí para ayudarte. Contáctanos directamente y resolveremos todas tus dudas.
            </p>
            <a
              href="https://wa.me/5493815128279?text=Hola%20DecoMotivo,%20tengo%20una%20consulta"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-blanco text-primary px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 hover:bg-fondo hover:-translate-y-1"
            >
              <i className="fab fa-whatsapp text-xl"></i>
              Contactar por WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export default FAQ;