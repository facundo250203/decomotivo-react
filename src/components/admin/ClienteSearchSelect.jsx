import { useEffect, useRef, useState } from "react";

// Typeahead de clientes registrados, mismo patrón que ProductSearchSelect
// (click afuera cierra, filtra por substring case-insensitive). Se separó en
// un componente propio en vez de generalizar ProductSearchSelect in-place
// para no arriesgar el picker de productos que ya funciona -- el único
// cambio de fondo es que acá el orden sale de getOptionLabel(cliente) en vez
// de un campo hardcodeado como "titulo" (los clientes no tienen ese campo).
const ClienteSearchSelect = ({
  clientes,
  value,
  onChange,
  getOptionLabel,
  placeholder = "Buscar cliente por nombre...",
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selected = clientes.find((c) => c.id === parseInt(value));

  const clientesOrdenados = [...clientes].sort((a, b) =>
    getOptionLabel(a).localeCompare(getOptionLabel(b), "es", {
      sensitivity: "base",
    }),
  );

  const filtrados = query
    ? clientesOrdenados.filter((c) =>
        getOptionLabel(c).toLowerCase().includes(query.toLowerCase()),
      )
    : clientesOrdenados;

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

  const handleSelect = (cliente) => {
    onChange(String(cliente.id));
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
          <li
            onClick={handleClear}
            className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm text-gray-500 italic border-b"
          >
            Sin vincular / mostrador anónimo
          </li>
          {filtrados.length === 0 ? (
            <li className="px-3 py-2 text-gray-500 text-sm">
              Sin resultados
            </li>
          ) : (
            filtrados.map((cliente) => (
              <li
                key={cliente.id}
                onClick={() => handleSelect(cliente)}
                className={`px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm ${
                  selected?.id === cliente.id ? "bg-gray-50 font-medium" : ""
                }`}
              >
                {getOptionLabel(cliente)}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default ClienteSearchSelect;
