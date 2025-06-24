import ProductCategory from '../components/ProductCategory';
import { productosData } from '../data/productos';

const MatesVasos = () => {
  return (
    <ProductCategory 
      title={productosData.matesVasos.title}
      description={productosData.matesVasos.description}
      backgroundImage={productosData.matesVasos.backgroundImage}
      products={productosData.matesVasos.products}
    />
  );
};

export default MatesVasos;