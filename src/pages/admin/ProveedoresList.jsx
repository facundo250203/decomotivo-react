// src/pages/admin/ProveedoresList.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import { proveedoresAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getErrorInfo } from "../../utils/errorHandler";

const ProveedoresList = () => {
  const { token } = useAuth();
  const toast = useToast();
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProveedores();
  }, []);

  const fetchProveedores = async () => {
    try {
      setLoading(true);
      const response = await proveedoresAPI.getAll(token);
      if (response.success) {
        setProveedores(response.data || []);
      }
    } catch (error) {
      const { title, message, detail } = getErrorInfo(error);
      toast.error(title, message, detail);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar el proveedor "${nombre}"?`)) return;
    try {
      await proveedoresAPI.delete(id, token);
      toast.success("Proveedor eliminado", `${nombre} fue eliminado.`);
      fetchProveedores();
    } catch (error) {
      const { title, message, detail } = getErrorInfo(error);
      toast.error(title, message, detail);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-secondary">Proveedores</h2>
            <p className="text-gris-medio">
              Administra los proveedores de tu negocio
            </p>
          </div>
          <Link
            to="/admin/proveedores/nuevo"
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-accent transition-colors flex items-center gap-2"
          >
            <i className="fas fa-plus"></i>
            Nuevo Proveedor
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gris-medio">Cargando proveedores...</p>
          </div>
        </div>
      ) : proveedores.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow-md text-center">
          <i className="fas fa-truck text-6xl text-gray-300 mb-4"></i>
          <p className="text-xl text-gray-600">No hay proveedores registrados</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Redes
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {proveedores.map((proveedor) => (
                  <tr key={proveedor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {proveedor.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {proveedor.telefono || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {proveedor.email || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex flex-col gap-1">
                        {proveedor.instagram && (
                          <span className="flex items-center gap-1">
                            <i className="fab fa-instagram text-pink-600"></i>
                            {proveedor.instagram}
                          </span>
                        )}
                        {proveedor.facebook && (
                          <span className="flex items-center gap-1">
                            <i className="fab fa-facebook text-blue-700"></i>
                            {proveedor.facebook}
                          </span>
                        )}
                        {!proveedor.instagram && !proveedor.facebook && "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          to={`/admin/proveedores/editar/${proveedor.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar"
                        >
                          <i className="fas fa-edit"></i>
                        </Link>
                        <button
                          onClick={() =>
                            handleDelete(proveedor.id, proveedor.nombre)
                          }
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
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

export default ProveedoresList;
