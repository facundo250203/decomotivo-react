// src/pages/CategoryPage.jsx
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import ProductCategory from "../components/ProductCategory";
import { getCategorySeo } from "../config/categoryPages";

// Página única para cualquier categoría (reemplaza un archivo por
// categoría). El SEO sale de categoryPages.js; si la categoría no tiene una
// entrada ahí (paso manual que se puede olvidar al crearla), getCategorySeo
// arma un SEO genérico en vez de dejar la página sin título ni meta tags. El
// contenido lo resuelve ProductCategory buscando el slug contra la API
// (incluye su propio estado de "categoría no encontrada" si el slug no existe).
const CategoryPage = () => {
  const { categorySlug } = useParams();
  const seo = getCategorySeo(categorySlug);

  return (
    <>
      {seo && (
        <Helmet>
          <title>{seo.title}</title>
          <meta name="description" content={seo.description} />
          <meta name="keywords" content={seo.keywords} />
          <link
            rel="canonical"
            href={`https://www.decomotivo.com.ar/${categorySlug}`}
          />

          <meta property="og:title" content={seo.title} />
          <meta property="og:description" content={seo.description} />
          <meta property="og:image" content={seo.ogImage} />
          <meta
            property="og:url"
            content={`https://www.decomotivo.com.ar/${categorySlug}`}
          />
          <meta property="og:type" content="website" />
          <meta property="og:locale" content="es_AR" />
          <meta property="og:site_name" content="DecoMotivo" />

          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={seo.title} />
          <meta name="twitter:description" content={seo.description} />
          <meta name="twitter:image" content={seo.ogImage} />

          <meta name="geo.region" content="AR-T" />
          <meta name="geo.placename" content="San Miguel de Tucumán" />
          <meta name="geo.position" content="-26.8083;-65.2176" />
          <meta name="ICBM" content="-26.8083, -65.2176" />
        </Helmet>
      )}

      <ProductCategory categorySlug={categorySlug} />
    </>
  );
};

export default CategoryPage;
