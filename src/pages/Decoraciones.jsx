import ProductCategory from '../components/ProductCategory';
import { productosData } from '../data/productos';

const Decoraciones = () => {
  return (
    <ProductCategory 
      title={productosData.decoraciones.title}
      description={productosData.decoraciones.description}
      backgroundImage={productosData.decoraciones.backgroundImage}
      products={productosData.decoraciones.products}
      seoTitle="Decoraciones en MDF y Polifan | Cuadros Personalizados | DecoMotivo"
      seoDescription="Cuadros decorativos en MDF y polifan, pesebres navideños personalizados. Decoración para hogar y oficina en Tucumán."
      seoKeywords="cuadros MDF, cuadros polifan, pesebres navideños, decoración hogar, decoración oficina, cuadros personalizados, DecoMotivo, Tucumán"
      canonicalUrl="https://www.decomotivo.com.ar/decoraciones"
    />
  );
};

export default Decoraciones;