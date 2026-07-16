import { useEffect, useRef, useState } from "react";

const ProductSearchSelect = ({
  productos,
  value,
  onChange,
  getOptionLabel,
  placeholder = "Buscar producto por nombre...",
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selected = productos.find((p) => p.id === parseInt(value));

  const productosOrdenados = [...productos].sort((a, b) =>
    a.titulo.localeCompare(b.titulo, "es", { sensitivity: "base" }),
  );

  const filtrados = query
    ? productosOrdenados.filter((p) =>
        p.titulo.toLowerCase().includes(query.toLowerCase()),
      )
    : productosOrdenados;

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

  const handleSelect = (producto) => {
    onChange(String(producto.id));
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
            filtrados.map((prod) => (
              <li
                key={prod.id}
                onClick={() => handleSelect(prod)}
                className={`px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm ${
                  selected?.id === prod.id ? "bg-gray-50 font-medium" : ""
                }`}
              >
                {getOptionLabel(prod)}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default ProductSearchSelect;
