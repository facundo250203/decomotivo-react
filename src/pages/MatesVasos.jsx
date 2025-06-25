import ProductCategory from '../components/ProductCategory';
import { productosData } from '../data/productos';

const MatesVasos = () => {
  return (
    <ProductCategory 
      title={productosData.matesVasos.title}
      description={productosData.matesVasos.description}
      backgroundImage={productosData.matesVasos.backgroundImage}
      products={productosData.matesVasos.products}
      seoTitle="Mates de Algarrobo y Vasos Ferneteros Personalizados | DecoMotivo"
      seoDescription="Mates de algarrobo artesanales con grabado personalizado, vasos ferneteros de aluminio y jarras nórdicas. Incluye bombilla. Envíos en Tucumán."
      seoKeywords="mates algarrobo, mates personalizados, vasos ferneteros, bombillas aluminio, jarras nórdicas, grabado láser, DecoMotivo, Tucumán"
      canonicalUrl="https://www.decomotivo.com.ar/mates-vasos"
    />
  );
};

export default MatesVasos;