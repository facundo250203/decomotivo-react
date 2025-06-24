import ProductCategory from '../components/ProductCategory';
import { productosData } from '../data/productos';

const Tablas = () => {
  return (
    <ProductCategory 
      title={productosData.tablas.title}
      description={productosData.tablas.description}
      backgroundImage={productosData.tablas.backgroundImage}
      products={productosData.tablas.products}
    />
  );
};

export default Tablas;