import { Helmet } from 'react-helmet-async';
import ProductCategory from '../components/ProductCategory';
import { productosData } from '../data/productos';

const Tablas = () => {
  return (
    <>
      <Helmet>
        {/* Título optimizado para Google - Incluye keyword + ubicación */}
        <title>Tablas de Algarrobo Personalizadas en Tucumán | DecoMotivo</title>
        
        {/* Meta description atractiva y con keywords locales */}
        <meta 
          name="description" 
          content="Tablas de algarrobo personalizadas en Tucumán. Pizzeras, tablas para asado, picadas y desayuno. Calidad premium, grabado láser. Envíos a todo Tucumán. ¡Consultá precios!" 
        />
        
        {/* Keywords locales importantes */}
        <meta 
          name="keywords" 
          content="tablas algarrobo tucumán, tablas personalizadas tucumán, pizzeras tucumán, tablas asado tucumán, tablas picada, DecoMotivo, San Miguel de Tucumán, tablas madera argentina" 
        />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://www.decomotivo.com.ar/tablas" />
        
        {/* Open Graph para Facebook/WhatsApp */}
        <meta property="og:title" content="Tablas de Algarrobo Personalizadas en Tucumán | DecoMotivo" />
        <meta property="og:description" content="Tablas de algarrobo personalizadas: pizzeras, tablas para asado y picadas. Calidad premium en Tucumán." />
        <meta property="og:image" content="https://www.decomotivo.com.ar/images/tablas-bg.jpg" />
        <meta property="og:url" content="https://www.decomotivo.com.ar/tablas" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="es_AR" />
        <meta property="og:site_name" content="DecoMotivo" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Tablas de Algarrobo Personalizadas en Tucumán" />
        <meta name="twitter:description" content="Tablas personalizadas de algarrobo. Calidad premium en Tucumán." />
        <meta name="twitter:image" content="https://www.decomotivo.com.ar/images/tablas-bg.jpg" />
        
        {/* Geo tags para SEO local */}
        <meta name="geo.region" content="AR-T" />
        <meta name="geo.placename" content="San Miguel de Tucumán" />
        <meta name="geo.position" content="-26.8083;-65.2176" />
        <meta name="ICBM" content="-26.8083, -65.2176" />
      </Helmet>

      <ProductCategory 
        title={productosData.tablas.title}
        description={productosData.tablas.description}
        backgroundImage={productosData.tablas.backgroundImage}
        products={productosData.tablas.products}
      />
    </>
  );
};

export default Tablas;