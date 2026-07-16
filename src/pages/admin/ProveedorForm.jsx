// src/pages/admin/ProveedorForm.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import { proveedoresAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getErrorInfo } from "../../utils/errorHandler";

const ProveedorForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const toast = useToast();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    email: "",
    instagram: "",
    facebook: "",
    direccion: "",
    notas: "",
  });
  const [loading, setLoading] = useState(false);
  const [loadingProveedor, setLoadingProveedor] = useState(false);

  useEffect(() => {
    if (isEditMode) fetchProveedor();
  }, [id]);

  const fetchProveedor = async () => {
    try {
      setLoadingProveedor(true);
      const response = await proveedoresAPI.getById(id, token);
      if (response.success) {
        const p = response.data;
        setFormData({
          nombre: p.nombre || "",
          telefono: p.telefono || "",
          email: p.email || "",
          instagram: p.instagram || "",
          facebook: p.facebook || "",
          direccion: p.direccion || "",
          notas: p.notas || "",
        });
      }
    } catch (error) {
      const { title, message, detail } = getErrorInfo(error);
      toast.error(title, message, detail);
      navigate("/admin/proveedores");
    } finally {
      setLoadingProveedor(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      toast.warning("Campo requerido", "El nombre del proveedor es obligatorio.");
      return;
    }
    try {
      setLoading(true);
      if (isEditMode) {
        await proveedoresAPI.update(id, formData, token);
        toast.success("Proveedor actualizado", "Los cambios se guardaron.");
      } else {
        await proveedoresAPI.create(formData, token);
        toast.success("Proveedor creado", "El proveedor fue registrado.");
      }
      navigate("/admin/proveedores");
    } catch (error) {
      const { title, message, detail } = getErrorInfo(error);
      toast.error(title, message, detail);
    } finally {
      setLoading(false);
    }
  };

  if (loadingProveedor) {
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

  return (
    <AdminLayout>
      <div className="max-w-2xl">
        <div className="mb-6">
          <Link
            to="/admin/proveedores"
            className="text-primary hover:underline mb-2 inline-block"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Volver a proveedores
          </Link>
          <h2 className="text-2xl font-bold text-secondary">
            {isEditMode ? "Editar Proveedor" : "Nuevo Proveedor"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-texto mb-2">
              Nombre *
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Ej: Maderera del Norte"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-texto mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-texto mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-texto mb-2">
                Instagram
              </label>
              <input
                type="text"
                name="instagram"
                value={formData.instagram}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="@usuario"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-texto mb-2">
                Facebook
              </label>
              <input
                type="text"
                name="facebook"
                value={formData.facebook}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Nombre de la página o perfil"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-texto mb-2">
              Dirección
            </label>
            <input
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-texto mb-2">
              Notas
            </label>
            <textarea
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="flex gap-4 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-white py-3 px-6 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Guardando..."
                : isEditMode
                  ? "Actualizar Proveedor"
                  : "Crear Proveedor"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/proveedores")}
              className="px-6 py-3 border border-gris-claro text-texto rounded-lg hover:bg-gris-claro transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default ProveedorForm;
