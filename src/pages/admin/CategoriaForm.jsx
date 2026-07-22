// src/pages/admin/CategoriaForm.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import { categoriesAPI, adminCategoriasAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getErrorInfo } from "../../utils/errorHandler";

const CategoriaForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const toast = useToast();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    nombre: "",
    slug: "",
    descripcion: "",
    imagen_background: "",
    activa: true,
  });
  const [loading, setLoading] = useState(false);
  const [loadingCategoria, setLoadingCategoria] = useState(false);

  useEffect(() => {
    if (isEditMode) fetchCategoria();
  }, [id]);

  const fetchCategoria = async () => {
    try {
      setLoadingCategoria(true);
      // getById es la ruta pública (categoryController.js) pero no filtra
      // por `activa`, así que también sirve para editar una categoría
      // desactivada -- no hace falta un endpoint admin aparte solo para
      // leer una.
      const response = await categoriesAPI.getById(id);
      if (response.success) {
        const c = response.data;
        setFormData({
          nombre: c.nombre || "",
          slug: c.slug || "",
          descripcion: c.descripcion || "",
          imagen_background: c.imagen_background || "",
          activa: Boolean(c.activa),
        });
      }
    } catch (error) {
      const { title, message, detail } = getErrorInfo(error);
      toast.error(title, message, detail);
      navigate("/admin/categorias");
    } finally {
      setLoadingCategoria(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.slug.trim()) {
      toast.warning(
        "Campos requeridos",
        "El nombre y el slug de la categoría son obligatorios.",
      );
      return;
    }
    try {
      setLoading(true);
      if (isEditMode) {
        await adminCategoriasAPI.update(id, formData, token);
        toast.success("Categoría actualizada", "Los cambios se guardaron.");
      } else {
        // activa siempre nace en true al crear (no se manda) -- no tiene
        // sentido dar de alta una categoría ya desactivada, se desactiva
        // después si hace falta.
        const datosCreacion = {
          nombre: formData.nombre,
          slug: formData.slug,
          descripcion: formData.descripcion,
          imagen_background: formData.imagen_background,
        };
        await adminCategoriasAPI.create(datosCreacion, token);
        toast.success("Categoría creada", "La categoría fue registrada.");
      }
      navigate("/admin/categorias");
    } catch (error) {
      const { title, message, detail } = getErrorInfo(error);
      toast.error(title, message, detail);
    } finally {
      setLoading(false);
    }
  };

  if (loadingCategoria) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gris-medio">Cargando categoría...</p>
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
            to="/admin/categorias"
            className="text-primary hover:underline mb-2 inline-block"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Volver a categorías
          </Link>
          <h2 className="text-2xl font-bold text-secondary">
            {isEditMode ? "Editar Categoría" : "Nueva Categoría"}
          </h2>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-md p-6 space-y-4"
        >
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
              placeholder="Ej: Bienestar"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-texto mb-2">
              Slug *
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Ej: bienestar"
            />
            <p className="text-xs text-gris-medio mt-1">
              Se usa en la URL de la categoría (/{formData.slug || "slug"}).
              Sin espacios, acentos ni ñ.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-texto mb-2">
              Descripción
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Se muestra debajo del título en la página de la categoría"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-texto mb-2">
              Imagen de fondo (URL)
            </label>
            <input
              type="text"
              name="imagen_background"
              value={formData.imagen_background}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="https://..."
            />
            <p className="text-xs text-gris-medio mt-1">
              Opcional. Pegá la URL de una imagen ya subida (ej. a
              Cloudinary).
            </p>
          </div>

          {isEditMode && (
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="activa"
                checked={formData.activa}
                onChange={handleChange}
                className="w-5 h-5 text-green-500 border-gris-claro rounded focus:ring-green-500"
              />
              <div>
                <span className="font-medium text-texto">
                  Activa en la tienda pública
                </span>
                <p className="text-xs text-gris-medio">
                  Desmarcala para ocultar la categoría del catálogo sin
                  borrarla
                </p>
              </div>
            </label>
          )}

          <div className="flex gap-4 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-white py-3 px-6 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Guardando..."
                : isEditMode
                  ? "Actualizar Categoría"
                  : "Crear Categoría"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/categorias")}
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

export default CategoriaForm;
