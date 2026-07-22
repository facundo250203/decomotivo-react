// src/pages/admin/ProveedorDetalle.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import { proveedoresAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getErrorInfo } from "../../utils/errorHandler";

const ProveedorDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const toast = useToast();
  const [proveedor, setProveedor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProveedor = async () => {
      try {
        setLoading(true);
        const response = await proveedoresAPI.getById(id, token);
        if (response.success) setProveedor(response.data);
      } catch (error) {
        const { title, message, detail } = getErrorInfo(error);
        toast.error(title, message, detail);
        navigate("/admin/proveedores");
      } finally {
        setLoading(false);
      }
    };

    fetchProveedor();
  }, [id]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gris-medio">Cargando proveedor...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!proveedor) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-xl text-gray-600">Proveedor no encontrado</p>
          <Link
            to="/admin/proveedores"
            className="text-primary hover:underline mt-4 inline-block"
          >
            Volver a la lista
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <Link
          to="/admin/proveedores"
          className="text-primary hover:underline mb-2 inline-block"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Volver a proveedores
        </Link>
        <h2 className="text-2xl font-bold text-secondary">
          {proveedor.nombre}
        </h2>
      </div>

      <div className="max-w-2xl bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Datos de contacto</h3>
        <div className="space-y-2 text-sm">
          <p>
            <span className="text-gray-500">Teléfono:</span>{" "}
            {proveedor.telefono || "-"}
          </p>
          <p>
            <span className="text-gray-500">Email:</span>{" "}
            {proveedor.email || "-"}
          </p>
          <p>
            <span className="text-gray-500">Instagram:</span>{" "}
            {proveedor.instagram || "-"}
          </p>
          <p>
            <span className="text-gray-500">Facebook:</span>{" "}
            {proveedor.facebook || "-"}
          </p>
          <p>
            <span className="text-gray-500">Sitio web:</span>{" "}
            {proveedor.sitio_web || "-"}
          </p>
          <p>
            <span className="text-gray-500">Dirección:</span>{" "}
            {proveedor.direccion || "-"}
          </p>
          {proveedor.notas && (
            <p>
              <span className="text-gray-500">Notas:</span> {proveedor.notas}
            </p>
          )}
        </div>
        <Link
          to={`/admin/proveedores/editar/${proveedor.id}`}
          className="inline-block mt-4 text-primary hover:underline text-sm"
        >
          <i className="fas fa-edit mr-1"></i>
          Editar datos
        </Link>
      </div>
    </AdminLayout>
  );
};

export default ProveedorDetalle;
