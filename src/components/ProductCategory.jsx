import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { productsAPI, categoriesAPI } from "../services/api";
import CategoryNav from "./CategoryNav";
import ProductGrid from "./ProductGrid";

const ProductCategory = ({ categorySlug }) => {
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategoryAndProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Obtener datos de la categoría por slug
        const categoryResponse = await categoriesAPI.getBySlug(categorySlug);

        if (categoryResponse.success) {
          setCategory(categoryResponse.data);

          // 2. Obtener productos de esta categoría
          const productsResponse = await productsAPI.getByCategory(
            categoryResponse.data.id,
          );

          if (productsResponse.success) {
            setProducts(productsResponse.data || []);
          }
        }
      } catch (err) {
        console.error("Error cargando categoría:", err);
        setError(
          "No se pudieron cargar los productos. Por favor, intentá de nuevo más tarde.",
        );
      } finally {
        setLoading(false);
      }
    };

    if (categorySlug) {
      fetchCategoryAndProducts();
    }
  }, [categorySlug]);

  // LOADING STATE
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fondo">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-lg text-texto">Cargando productos...</p>
        </div>
      </div>
    );
  }

  // ERROR STATE
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fondo">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-secondary mb-2">
            Error al cargar
          </h2>
          <p className="text-texto mb-6">{error}</p>
          <Link
            to="/productos"
            className="inline-flex items-center gap-2 bg-primary text-blanco px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:bg-accent"
          >
            <i className="fas fa-arrow-left"></i>
            Volver a categorías
          </Link>
        </div>
      </div>
    );
  }

  // NO CATEGORY FOUND
  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fondo">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-secondary mb-2">
            Categoría no encontrada
          </h2>
          <p className="text-texto mb-6">La categoría que buscás no existe.</p>
          <Link
            to="/productos"
            className="inline-flex items-center gap-2 bg-primary text-blanco px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:bg-accent"
          >
            <i className="fas fa-arrow-left"></i>
            Volver a categorías
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hero de la categoría */}
      <section
        className="relative bg-cover bg-center text-blanco text-center py-16"
        style={{
          backgroundImage: category.imagen_background
            ? `url('${category.imagen_background}')`
            : "linear-gradient(135deg, #8B4513 0%, #D2691E 100%)",
        }}
      >
        {/* Overlay gradiente */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/85 to-secondary/90"></div>

        {/* Contenido */}
        <div className="container relative z-10">
          <h1 className="text-4xl lg:text-5xl font-bold mb-5">
            {category.nombre}
          </h1>
          {category.descripcion && (
            <p className="text-lg lg:text-xl max-w-4xl mx-auto">
              {category.descripcion}
            </p>
          )}
        </div>
      </section>

      {/* Productos */}
      <section className="py-16 bg-fondo">
        <div className="container lg:flex lg:gap-8 lg:items-start">
          <CategoryNav activeSlug={categorySlug} />

          <div className="flex-1 min-w-0">
            <ProductGrid
              products={products}
              emptyMessage="Todavía no hay productos en esta categoría"
            />
          </div>
        </div>
      </section>
    </>
  );
};

export default ProductCategory;
