import ProductCategory from '../components/ProductCategory';
import { productosData } from '../data/productos';

const Combos = () => {
  return (
    <ProductCategory 
      title={productosData.combos.title}
      description={productosData.combos.description}
      backgroundImage={productosData.combos.backgroundImage}
      products={productosData.combos.products}
    />
  );
};

export default Combos;