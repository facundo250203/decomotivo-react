import ProductCategory from '../components/ProductCategory';
import { productosData } from '../data/productos';

const Combos = () => {
  return (
    <ProductCategory 
      title={productosData.combos.title}
      description={productosData.combos.description}
      backgroundImage={productosData.combos.backgroundImage}
      products={productosData.combos.products}
      seoTitle="Combos de Productos Decorativos | Sets de Tablas y Platos | DecoMotivo"
      seoDescription="Combos especiales: sets de tablas para asado, platos individuales, combos con vasos ferneteros. Ideales para regalar en Tucumán."
      seoKeywords="combos productos, sets tablas, platos individuales, combos regalos, sets decorativos, DecoMotivo, Tucumán"
      canonicalUrl="https://www.decomotivo.com.ar/combos"
    />
  );
};

export default Combos;