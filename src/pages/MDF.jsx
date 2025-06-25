import ProductCategory from '../components/ProductCategory';
import { productosData } from '../data/productos';

const MDF = () => {
  return (
    <ProductCategory 
      title={productosData.mdf.title}
      description={productosData.mdf.description}
      backgroundImage={productosData.mdf.backgroundImage}
      products={productosData.mdf.products}
      seoTitle="Productos en MDF Personalizados | Porta Objetos y Decoración | DecoMotivo"
      seoDescription="Portabijouterie, porta collares, porta celulares, rompecabezas, relojes y trofeos en MDF. Productos decorativos personalizados en Tucumán."
      seoKeywords="productos MDF, portabijouterie, porta celulares, rompecabezas, relojes pared, trofeos personalizados, DecoMotivo, Tucumán"
      canonicalUrl="https://www.decomotivo.com.ar/mdf"
    />
  );
};

export default MDF;