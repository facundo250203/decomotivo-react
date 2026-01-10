import { Helmet } from 'react-helmet-async';
import ProductCategory from '../components/ProductCategory';

const Otros = () => {
  return (
    <>
      <Helmet>
        {/* Título optimizado */}
        <title>Artesanías y Productos Decorativos en Tucumán | DecoMotivo</title>
        
        {/* Meta description */}
        <meta 
          name="description" 
          content="Productos artesanales en Tucumán: bolsos materos, percheros de algarrobo, porta gorras, yerberas, bombillas personalizadas. Artesanías únicas. ¡Consultá precios!" 
        />
        
        {/* Keywords */}
        <meta 
          name="keywords" 
          content="artesanías tucumán, productos decorativos tucumán, bolsos materos, percheros algarrobo, porta gorras tucumán, yerberas, bombillas personalizadas, DecoMotivo, San Miguel de Tucumán" 
        />
        
        <link rel="canonical" href="https://www.decomotivo.com.ar/otros" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Artesanías y Productos Decorativos en Tucumán | DecoMotivo" />
        <meta property="og:description" content="Productos artesanales únicos: bolsos materos, percheros, yerberas y más. Hecho en Tucumán." />
        <meta property="og:image" content="https://www.decomotivo.com.ar/images/otros-bg.jpg" />
        <meta property="og:url" content="https://www.decomotivo.com.ar/otros" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="es_AR" />
        <meta property="og:site_name" content="DecoMotivo" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Artesanías Tucumán | DecoMotivo" />
        <meta name="twitter:description" content="Productos artesanales únicos hechos en Tucumán." />
        <meta name="twitter:image" content="https://www.decomotivo.com.ar/images/otros-bg.jpg" />
        
        {/* Geo tags */}
        <meta name="geo.region" content="AR-T" />
        <meta name="geo.placename" content="San Miguel de Tucumán" />
        <meta name="geo.position" content="-26.8083;-65.2176" />
        <meta name="ICBM" content="-26.8083, -65.2176" />
      </Helmet>

      <ProductCategory categorySlug="otros" />
    </>
  );
};

export default Otros;