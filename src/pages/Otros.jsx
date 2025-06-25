import ProductCategory from '../components/ProductCategory';
import { productosData } from '../data/productos';

const Otros = () => {
  return (
    <ProductCategory 
      title={productosData.otros.title}
      description={productosData.otros.description}
      backgroundImage={productosData.otros.backgroundImage}
      products={productosData.otros.products}
      seoTitle="Otros Productos Decorativos | Bolsos Materos, Percheros, Yerberas | DecoMotivo"
      seoDescription="Bolsos materos, percheros de algarrobo, porta gorras, yerberas, bombillas, cartelería en polifan y más productos únicos en Tucumán."
      seoKeywords="bolsos materos, percheros algarrobo, porta gorras, yerberas, bombillas aluminio, cartelería polifan, DecoMotivo, Tucumán"
      canonicalUrl="https://www.decomotivo.com.ar/otros"
    />
  );
};

export default Otros;