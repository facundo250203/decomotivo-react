// src/components/CategoryNav.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { categoriesAPI } from "../services/api";
import categoryPages, { defaultCategoryIcon } from "../config/categoryPages";

// Barra lateral de categorías (desktop) que se convierte en un desplegable
// en mobile. Se usa tanto en /productos (activeSlug=null, "Todos" resaltado)
// como en cada página de categoría (activeSlug=el slug actual).
const CategoryNav = ({ activeSlug = null }) => {
  const [categorias, setCategorias] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const response = await categoriesAPI.getAll();
        if (response.success) {
          setCategorias(response.data || []);
        }
      } catch (error) {
        console.error("Error cargando categorías:", error);
      }
    };
    fetchCategorias();
  }, []);

  const itemClass = (isActive) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
      isActive
        ? "bg-primary text-blanco font-semibold"
        : "text-texto hover:bg-gris-claro"
    }`;

  // "Ofertas" no es una categoría de la DB (ver src/pages/Ofertas.jsx) --
  // es un link fijo, con estilo propio para que se note que es distinto.
  const itemClassOfertas = (isActive) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
      isActive
        ? "bg-red-600 text-blanco"
        : "text-red-600 hover:bg-red-50"
    }`;

  // "Combos" tampoco es una categoría de la DB (ver src/pages/Combos.jsx) --
  // mismo criterio que Ofertas, con color propio para distinguirlo.
  const itemClassCombos = (isActive) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
      isActive
        ? "bg-secondary text-blanco"
        : "text-secondary hover:bg-gris-claro"
    }`;

  // Orden alfabético (localeCompare para que tildes/ñ ordenen bien), sin
  // depender de la columna `orden` de la DB.
  const categoriasOrdenadas = [...categorias].sort((a, b) =>
    a.nombre.localeCompare(b.nombre, "es")
  );

  const items = (
    <>
      <Link
        to="/productos"
        onClick={() => setMobileOpen(false)}
        className={itemClass(activeSlug === null)}
      >
        <i className="fas fa-th-large w-4 text-center"></i>
        Todos
      </Link>
      <Link
        to="/ofertas"
        onClick={() => setMobileOpen(false)}
        className={itemClassOfertas(activeSlug === "ofertas")}
      >
        <i className="fas fa-tag w-4 text-center"></i>
        Ofertas
      </Link>
      <Link
        to="/combos"
        onClick={() => setMobileOpen(false)}
        className={itemClassCombos(activeSlug === "combos")}
      >
        <i className="fas fa-boxes-stacked w-4 text-center"></i>
        Combos
      </Link>
      <hr className="my-2 border-gris-claro" />
      {categoriasOrdenadas.map((cat) => (
        <Link
          key={cat.id}
          to={`/${cat.slug}`}
          onClick={() => setMobileOpen(false)}
          className={itemClass(activeSlug === cat.slug)}
        >
          <i
            className={`fas ${categoryPages[cat.slug]?.icon || defaultCategoryIcon} w-4 text-center`}
          ></i>
          {cat.nombre}
        </Link>
      ))}
    </>
  );

  return (
    <>
      {/* Desktop: barra lateral siempre visible */}
      <aside className="hidden lg:flex lg:flex-col lg:gap-1 lg:w-60 lg:flex-shrink-0">
        <p className="text-xs font-semibold text-gris-medio uppercase px-4 mb-2">
          Categorías
        </p>
        {items}
      </aside>

      {/* Mobile: botón desplegable */}
      <div className="lg:hidden mb-6">
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="w-full flex items-center justify-between px-4 py-3 bg-blanco border border-gris-claro rounded-lg shadow-custom text-secondary font-semibold"
        >
          <span className="flex items-center gap-2">
            <i className="fas fa-bars"></i>
            Categorías
          </span>
          <i className={`fas fa-chevron-${mobileOpen ? "up" : "down"}`}></i>
        </button>
        {mobileOpen && (
          <div className="mt-2 flex flex-col gap-1 bg-blanco border border-gris-claro rounded-lg shadow-custom p-2">
            {items}
          </div>
        )}
      </div>
    </>
  );
};

export default CategoryNav;
