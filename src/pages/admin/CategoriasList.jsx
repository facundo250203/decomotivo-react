// src/pages/admin/CategoriasList.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import { adminCategoriasAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getErrorInfo } from "../../utils/errorHandler";

const CategoriasList = () => {
  const { token } = useAuth();
  const toast = useToast();
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  // Evita doble click en las flechas de reordenar mientras el par de
  // updates todavía está en vuelo -- swap ya se hace con dos PUT
  // secuenciales, un segundo click a mitad de camino dejaría el orden
  // inconsistente.
  const [reordenando, setReordenando] = useState(false);

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    try {
      setLoading(true);
      const response = await adminCategoriasAPI.getAll(token);
      if (response.success) {
        setCategorias(response.data || []);
      }
    } catch (error) {
      const { title, message, detail } = getErrorInfo(error);
      toast.error(title, message, detail);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActiva = async (categoria) => {
    try {
      await adminCategoriasAPI.update(
        categoria.id,
        { activa: !categoria.activa },
        token,
      );
      toast.success(
        categoria.activa ? "Categoría desactivada" : "Categoría activada",
        `"${categoria.nombre}" ${categoria.activa ? "ya no aparece" : "ahora aparece"} en la tienda pública.`,
      );
      fetchCategorias();
    } catch (error) {
      const { title, message, detail } = getErrorInfo(error);
      toast.error(title, message, detail);
    }
  };

  // Intercambia el `orden` de esta categoría con la vecina (arriba o abajo
  // en la lista, ya ordenada por `orden`) -- dos PUT al mismo endpoint que
  // ya usa el formulario, sin necesidad de un endpoint de reorder aparte.
  const moverCategoria = async (index, direccion) => {
    const vecinoIndex = direccion === "arriba" ? index - 1 : index + 1;
    if (vecinoIndex < 0 || vecinoIndex >= categorias.length) return;

    const actual = categorias[index];
    const vecino = categorias[vecinoIndex];

    try {
      setReordenando(true);
      await adminCategoriasAPI.update(actual.id, { orden: vecino.orden }, token);
      await adminCategoriasAPI.update(vecino.id, { orden: actual.orden }, token);
      await fetchCategorias();
    } catch (error) {
      const { title, message, detail } = getErrorInfo(error);
      toast.error(title, message, detail);
    } finally {
      setReordenando(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-secondary">Categorías</h2>
            <p className="text-gris-medio">
              Categorías del catálogo público -- crear, editar, reordenar y
              activar/desactivar
            </p>
          </div>
          <Link
            to="/admin/categorias/nueva"
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-accent transition-colors flex items-center gap-2"
          >
            <i className="fas fa-plus"></i>
            Nueva Categoría
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gris-medio">Cargando categorías...</p>
          </div>
        </div>
      ) : categorias.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow-md text-center">
          <i className="fas fa-th-large text-6xl text-gray-300 mb-4"></i>
          <p className="text-xl text-gray-600">No hay categorías cargadas</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orden
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categorias.map((categoria, index) => (
                  <tr
                    key={categoria.id}
                    className={`hover:bg-gray-50 ${categoria.activa ? "" : "opacity-60"}`}
                  >
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={index === 0 || reordenando}
                          onClick={() => moverCategoria(index, "arriba")}
                          className="text-gray-400 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Mover arriba"
                        >
                          <i className="fas fa-chevron-up"></i>
                        </button>
                        <button
                          type="button"
                          disabled={index === categorias.length - 1 || reordenando}
                          onClick={() => moverCategoria(index, "abajo")}
                          className="text-gray-400 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Mover abajo"
                        >
                          <i className="fas fa-chevron-down"></i>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {categoria.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      /{categoria.slug}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        type="button"
                        onClick={() => handleToggleActiva(categoria)}
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          categoria.activa
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                        }`}
                        title={
                          categoria.activa
                            ? "Click para desactivar"
                            : "Click para activar"
                        }
                      >
                        {categoria.activa ? "Activa" : "Inactiva"}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/admin/categorias/editar/${categoria.id}`}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar"
                      >
                        <i className="fas fa-edit"></i>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default CategoriasList;
