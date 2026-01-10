import { Helmet } from 'react-helmet-async';
import ProductCategory from '../components/ProductCategory';

const MatesVasos = () => {
  return (
    <>
      <Helmet>
        {/* Título optimizado para búsquedas de mates en Tucumán */}
        <title>Mates de Algarrobo Personalizados en Tucumán | DecoMotivo</title>
        
        {/* Meta description con keywords locales y llamado a la acción */}
        <meta 
          name="description" 
          content="Mates de algarrobo personalizados en Tucumán. Incluyen bombilla de aluminio. Vasos ferneteros personalizables. Grabado láser. Envíos a toda Argentina. ¡Consultá precios!" 
        />
        
        {/* Keywords específicas para mates */}
        <meta 
          name="keywords" 
          content="mates tucumán, mates personalizados tucumán, mates algarrobo, vasos ferneteros tucumán, mates con bombilla, jarras nórdicas, DecoMotivo, San Miguel de Tucumán, mates argentina" 
        />
        
        <link rel="canonical" href="https://www.decomotivo.com.ar/mates-vasos" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Mates de Algarrobo Personalizados en Tucumán | DecoMotivo" />
        <meta property="og:description" content="Mates de algarrobo y vasos ferneteros personalizados. Incluyen bombilla. Diseños únicos en Tucumán." />
        <meta property="og:image" content="https://www.decomotivo.com.ar/images/mates-bg.jpg" />
        <meta property="og:url" content="https://www.decomotivo.com.ar/mates-vasos" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="es_AR" />
        <meta property="og:site_name" content="DecoMotivo" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Mates Personalizados en Tucumán" />
        <meta name="twitter:description" content="Mates de algarrobo con bombilla incluida. Vasos ferneteros personalizables." />
        <meta name="twitter:image" content="https://www.decomotivo.com.ar/images/mates-bg.jpg" />
        
        {/* Geo tags */}
        <meta name="geo.region" content="AR-T" />
        <meta name="geo.placename" content="San Miguel de Tucumán" />
        <meta name="geo.position" content="-26.8083;-65.2176" />
        <meta name="ICBM" content="-26.8083, -65.2176" />
      </Helmet>

      <ProductCategory categorySlug="mates-vasos" />
    </>
  );
};

export default MatesVasos;