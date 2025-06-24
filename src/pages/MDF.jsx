import ProductCategory from '../components/ProductCategory';
import { productosData } from '../data/productos';

const MDF = () => {
  return (
    <ProductCategory 
      title={productosData.mdf.title}
      description={productosData.mdf.description}
      backgroundImage={productosData.mdf.backgroundImage}
      products={productosData.mdf.products}
    />
  );
};

export default MDF;