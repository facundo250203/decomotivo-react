import { Helmet } from 'react-helmet-async';
import ProductCategory from '../components/ProductCategory';
import { productosData } from '../data/productos';

const Decoraciones = () => {
  return (
    <>
      <Helmet>
        {/* Título optimizado */}
        <title>Decoración para el Hogar en Tucumán | Cuadros y Adornos | DecoMotivo</title>
        
        {/* Meta description */}
        <meta 
          name="description" 
          content="Decoración para el hogar en Tucumán: cuadros en MDF y polifan personalizados, pesebres, adornos pintados a mano. Diseños únicos para tu espacio. ¡Consultá precios!" 
        />
        
        {/* Keywords */}
        <meta 
          name="keywords" 
          content="decoración hogar tucumán, cuadros personalizados tucumán, cuadros mdf, cuadros polifan, pesebres tucumán, adornos decorativos, decoración tucumán, DecoMotivo, San Miguel de Tucumán" 
        />
        
        <link rel="canonical" href="https://www.decomotivo.com.ar/decoraciones" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Decoración para el Hogar en Tucumán | DecoMotivo" />
        <meta property="og:description" content="Cuadros personalizados en MDF y polifan, pesebres y adornos decorativos. Diseños únicos para tu hogar." />
        <meta property="og:image" content="https://www.decomotivo.com.ar/images/decoraciones-bg.jpg" />
        <meta property="og:url" content="https://www.decomotivo.com.ar/decoraciones" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="es_AR" />
        <meta property="og:site_name" content="DecoMotivo" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Decoración Hogar Tucumán" />
        <meta name="twitter:description" content="Cuadros y adornos personalizados para tu hogar." />
        <meta name="twitter:image" content="https://www.decomotivo.com.ar/images/decoraciones-bg.jpg" />
        
        {/* Geo tags */}
        <meta name="geo.region" content="AR-T" />
        <meta name="geo.placename" content="San Miguel de Tucumán" />
        <meta name="geo.position" content="-26.8083;-65.2176" />
        <meta name="ICBM" content="-26.8083, -65.2176" />
      </Helmet>

      <ProductCategory 
        title={productosData.decoraciones.title}
        description={productosData.decoraciones.description}
        backgroundImage={productosData.decoraciones.backgroundImage}
        products={productosData.decoraciones.products}
      />
    </>
  );
};

export default Decoraciones;