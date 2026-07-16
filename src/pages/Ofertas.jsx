// src/pages/Ofertas.jsx
// Página de ofertas: NO es una categoría real (no existe fila en
// `categorias`), es un filtro sobre el flag `en_oferta` de productos.
// Se muestra en el front como si fuera una categoría más (misma
// CategoryNav + ProductGrid), pero sin tocar el backend de categorías.
import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import { productsAPI } from "../services/api";
import CategoryNav from "../components/CategoryNav";
import ProductGrid from "../components/ProductGrid";

const Ofertas = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOfertas = async () => {
      try {
        setLoading(true);
        const response = await productsAPI.getAll({
          en_oferta: true,
          limit: 200,
        });
        if (response.success) {
          setProductos(response.data || []);
        }
      } catch (error) {
        console.error("Error cargando ofertas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOfertas();
  }, []);

  return (
    <>
      <Helmet>
        <title>Ofertas en Tucumán | DecoMotivo</title>
        <meta
          name="description"
          content="Productos en oferta de DecoMotivo en Tucumán: mates, tablas, decoraciones y más con precio rebajado por tiempo limitado."
        />
        <link rel="canonical" href="https://www.decomotivo.com.ar/ofertas" />
      </Helmet>

      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-fondo">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-lg text-texto">Cargando ofertas...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Hero */}
          <section className="relative bg-cover bg-center text-blanco text-center py-16 bg-gradient-to-r from-red-700 to-red-500">
            <div className="container relative z-10">
              <h1 className="text-4xl lg:text-5xl font-bold mb-5">Ofertas</h1>
              <p className="text-lg lg:text-xl max-w-4xl mx-auto">
                Productos con precio rebajado por tiempo limitado.
              </p>
            </div>
          </section>

          {/* Productos */}
          <section className="py-16 bg-fondo">
            <div className="container lg:flex lg:gap-8 lg:items-start">
              <CategoryNav activeSlug="ofertas" />

              <div className="flex-1 min-w-0">
                <ProductGrid
                  products={productos}
                  emptyMessage="Por ahora no hay productos en oferta"
                />
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
};

export default Ofertas;
