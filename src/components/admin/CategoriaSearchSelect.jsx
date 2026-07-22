import { useEffect, useRef, useState } from "react";

// Typeahead de categorías, mismo patrón que ClienteSearchSelect/
// ProveedorSearchSelect/ProductSearchSelect. `clearLabel` es opcional --
// cuando se pasa, aparece como primera fila para volver a "sin categoría/
// todas" (ClientesSearchSelect usa el mismo truco para "sin vincular").
const CategoriaSearchSelect = ({
  categorias,
  value,
  onChange,
  getOptionLabel,
  placeholder = "Buscar categoría...",
  clearLabel,
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selected = categorias.find((c) => String(c.id) === String(value));

  const categoriasOrdenadas = [...categorias].sort((a, b) =>
    getOptionLabel(a).localeCompare(getOptionLabel(b), "es", {
      sensitivity: "base",
    }),
  );

  const filtradas = query
    ? categoriasOrdenadas.filter((c) =>
        getOptionLabel(c).toLowerCase().includes(query.toLowerCase()),
      )
    : categoriasOrdenadas;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (categoria) => {
    onChange(String(categoria.id));
    setQuery("");
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        value={
          isOpen
            ? query
            : selected
              ? getOptionLabel(selected)
              : clearLabel || ""
        }
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          setIsOpen(true);
          setQuery("");
        }}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
      />
      {isOpen && (
        <ul className="absolute z-10 w-full mt-1 max-h-56 overflow-y-auto bg-white border rounded-lg shadow-lg">
          {clearLabel && (
            <li
              onClick={handleClear}
              className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm text-gray-500 italic border-b"
            >
              {clearLabel}
            </li>
          )}
          {filtradas.length === 0 ? (
            <li className="px-3 py-2 text-gray-500 text-sm">
              Sin resultados
            </li>
          ) : (
            filtradas.map((categoria) => (
              <li
                key={categoria.id}
                onClick={() => handleSelect(categoria)}
                className={`px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm ${
                  selected?.id === categoria.id ? "bg-gray-50 font-medium" : ""
                }`}
              >
                {getOptionLabel(categoria)}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default CategoriaSearchSelect;
