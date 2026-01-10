import { Helmet } from 'react-helmet-async';
import ProductCategory from '../components/ProductCategory';

const MDF = () => {
  return (
    <>
      <Helmet>
        {/* Título optimizado */}
        <title>Productos en MDF Personalizados en Tucumán | DecoMotivo</title>
        
        {/* Meta description */}
        <meta 
          name="description" 
          content="Artículos en MDF personalizados en Tucumán: porta bijouterie, porta celulares, relojes de pared, rompecabezas. Diseños únicos con grabado láser. ¡Consultá precios!" 
        />
        
        {/* Keywords */}
        <meta 
          name="keywords" 
          content="mdf tucumán, productos mdf personalizados, porta bijouterie tucumán, relojes mdf, rompecabezas personalizados, artículos mdf, DecoMotivo, San Miguel de Tucumán" 
        />
        
        <link rel="canonical" href="https://www.decomotivo.com.ar/mdf" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Productos en MDF Personalizados en Tucumán | DecoMotivo" />
        <meta property="og:description" content="Artículos en MDF personalizados: porta bijouterie, relojes, rompecabezas y más. Grabado láser en Tucumán." />
        <meta property="og:image" content="https://www.decomotivo.com.ar/images/mdf-bg.jpg" />
        <meta property="og:url" content="https://www.decomotivo.com.ar/mdf" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="es_AR" />
        <meta property="og:site_name" content="DecoMotivo" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Productos MDF Personalizados Tucumán" />
        <meta name="twitter:description" content="Artículos en MDF personalizados con grabado láser." />
        <meta name="twitter:image" content="https://www.decomotivo.com.ar/images/mdf-bg.jpg" />
        
        {/* Geo tags */}
        <meta name="geo.region" content="AR-T" />
        <meta name="geo.placename" content="San Miguel de Tucumán" />
        <meta name="geo.position" content="-26.8083;-65.2176" />
        <meta name="ICBM" content="-26.8083, -65.2176" />
      </Helmet>

      <ProductCategory categorySlug="mdf" />
    </>
  );
};

export default MDF;