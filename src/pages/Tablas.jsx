import ProductCategory from '../components/ProductCategory';
import { productosData } from '../data/productos';

const Tablas = () => {
  return (
    <ProductCategory 
      title={productosData.tablas.title}
      description={productosData.tablas.description}
      backgroundImage={productosData.tablas.backgroundImage}
      products={productosData.tablas.products}
      seoTitle="Tablas de Algarrobo Personalizadas | DecoMotivo Tucumán"
      seoDescription="Descubre nuestras tablas de algarrobo personalizadas: pizzeras, tablas para asado, uso diario y más. Todas personalizables con grabado láser en Tucumán."
      seoKeywords="tablas algarrobo, tablas personalizadas, pizzeras, tablas asado, tablas madera, grabado láser, DecoMotivo, Tucumán"
      canonicalUrl="https://www.decomotivo.com.ar/tablas"
    />
  );
};

export default Tablas;