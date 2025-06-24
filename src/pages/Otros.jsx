import ProductCategory from '../components/ProductCategory';
import { productosData } from '../data/productos';

const Otros = () => {
  return (
    <ProductCategory 
      title={productosData.otros.title}
      description={productosData.otros.description}
      backgroundImage={productosData.otros.backgroundImage}
      products={productosData.otros.products}
    />
  );
};

export default Otros;