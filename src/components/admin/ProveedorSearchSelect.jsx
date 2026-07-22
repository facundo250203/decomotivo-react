import { useEffect, useRef, useState } from "react";

// Typeahead de proveedores, mismo patrón que ClienteSearchSelect/
// ProductSearchSelect -- se separó en un componente propio en vez de
// generalizar los otros dos para no arriesgar sus callers existentes.
const ProveedorSearchSelect = ({
  proveedores,
  value,
  onChange,
  getOptionLabel,
  placeholder = "Buscar proveedor por nombre...",
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selected = proveedores.find((p) => p.id === parseInt(value));

  const proveedoresOrdenados = [...proveedores].sort((a, b) =>
    getOptionLabel(a).localeCompare(getOptionLabel(b), "es", {
      sensitivity: "base",
    }),
  );

  const filtrados = query
    ? proveedoresOrdenados.filter((p) =>
        getOptionLabel(p).toLowerCase().includes(query.toLowerCase()),
      )
    : proveedoresOrdenados;

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

  const handleSelect = (proveedor) => {
    onChange(String(proveedor.id));
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        value={isOpen ? query : selected ? getOptionLabel(selected) : ""}
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
          {filtrados.length === 0 ? (
            <li className="px-3 py-2 text-gray-500 text-sm">
              Sin resultados
            </li>
          ) : (
            filtrados.map((proveedor) => (
              <li
                key={proveedor.id}
                onClick={() => handleSelect(proveedor)}
                className={`px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm ${
                  selected?.id === proveedor.id ? "bg-gray-50 font-medium" : ""
                }`}
              >
                {getOptionLabel(proveedor)}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default ProveedorSearchSelect;
