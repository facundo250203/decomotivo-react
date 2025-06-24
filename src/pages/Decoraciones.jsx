import ProductCategory from '../components/ProductCategory';
import { productosData } from '../data/productos';

const Decoraciones = () => {
  return (
    <ProductCategory 
      title={productosData.decoraciones.title}
      description={productosData.decoraciones.description}
      backgroundImage={productosData.decoraciones.backgroundImage}
      products={productosData.decoraciones.products}
    />
  );
};

export default Decoraciones;