// src/pages/Combos.jsx
// Página de combos: NO es una categoría real (no existe fila en
// `categorias`), es un filtro sobre productos.precio_tipo = 'combo' (ver
// migración 021). Mismo patrón que Ofertas.jsx.
import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import { productsAPI } from "../services/api";
import CategoryNav from "../components/CategoryNav";
import ProductGrid from "../components/ProductGrid";

const Combos = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCombos = async () => {
      try {
        setLoading(true);
        const response = await productsAPI.getAll({
          combo: true,
          limit: 200,
        });
        if (response.success) {
          setProductos(response.data || []);
        }
      } catch (error) {
        console.error("Error cargando combos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCombos();
  }, []);

  return (
    <>
      <Helmet>
        <title>Combos en Tucumán | DecoMotivo</title>
        <meta
          name="description"
          content="Combos de DecoMotivo en Tucumán: productos combinados a precio de promo. Mates con bombilla, sets de tablas y más."
        />
        <link rel="canonical" href="https://www.decomotivo.com.ar/combos" />
      </Helmet>

      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-fondo">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-lg text-texto">Cargando combos...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Hero */}
          <section className="relative bg-cover bg-center text-blanco text-center py-16 bg-gradient-to-r from-secondary to-primary">
            <div className="container relative z-10">
              <h1 className="text-4xl lg:text-5xl font-bold mb-5">Combos</h1>
              <p className="text-lg lg:text-xl max-w-4xl mx-auto">
                Productos combinados a precio de promo.
              </p>
            </div>
          </section>

          {/* Productos */}
          <section className="py-16 bg-fondo">
            <div className="container lg:flex lg:gap-8 lg:items-start">
              <CategoryNav activeSlug="combos" />

              <div className="flex-1 min-w-0">
                <ProductGrid
                  products={productos}
                  emptyMessage="Por ahora no hay combos armados"
                />
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
};

export default Combos;
