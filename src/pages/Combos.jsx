import { Helmet } from 'react-helmet-async';
import ProductCategory from '../components/ProductCategory';
import { productosData } from '../data/productos';

const Combos = () => {
  return (
    <>
      <Helmet>
        {/* Título optimizado */}
        <title>Combos y Sets Personalizados en Tucumán | DecoMotivo</title>
        
        {/* Meta description */}
        <meta 
          name="description" 
          content="Combos personalizados en Tucumán: sets de tablas, platos de algarrobo, combos para regalo. Armá tu propio combo. Ideal para regalar. ¡Consultá precios!" 
        />
        
        {/* Keywords */}
        <meta 
          name="keywords" 
          content="combos personalizados tucumán, sets regalo tucumán, combos tablas asado, platos algarrobo, regalos personalizados tucumán, sets picada, DecoMotivo, San Miguel de Tucumán" 
        />
        
        <link rel="canonical" href="https://www.decomotivo.com.ar/combos" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Combos y Sets Personalizados en Tucumán | DecoMotivo" />
        <meta property="og:description" content="Combos personalizados: sets de tablas, platos de algarrobo. Armá tu propio combo. Ideal para regalar." />
        <meta property="og:image" content="https://www.decomotivo.com.ar/images/combos-bg.jpg" />
        <meta property="og:url" content="https://www.decomotivo.com.ar/combos" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="es_AR" />
        <meta property="og:site_name" content="DecoMotivo" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Combos Personalizados Tucumán" />
        <meta name="twitter:description" content="Sets y combos personalizados. Armá tu propio combo." />
        <meta name="twitter:image" content="https://www.decomotivo.com.ar/images/combos-bg.jpg" />
        
        {/* Geo tags */}
        <meta name="geo.region" content="AR-T" />
        <meta name="geo.placename" content="San Miguel de Tucumán" />
        <meta name="geo.position" content="-26.8083;-65.2176" />
        <meta name="ICBM" content="-26.8083, -65.2176" />
      </Helmet>

      <ProductCategory 
        title={productosData.combos.title}
        description={productosData.combos.description}
        backgroundImage={productosData.combos.backgroundImage}
        products={productosData.combos.products}
      />
    </>
  );
};

export default Combos;