// src/pages/admin/SalidaForm.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import { gastosAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getErrorInfo } from "../../utils/errorHandler";

const SalidaForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const toast = useToast();
  const isEditMode = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [loadingGasto, setLoadingGasto] = useState(false);

  const [formData, setFormData] = useState({
    concepto: "",
    monto_efectivo: "",
    monto_transferencia: "",
    notas: "",
  });

  useEffect(() => {
    if (isEditMode) fetchGasto();
  }, [id]);

  const fetchGasto = async () => {
    try {
      setLoadingGasto(true);
      const response = await gastosAPI.getById(id, token);
      if (response.success) {
        const g = response.data;
        setFormData({
          concepto: g.concepto || "",
          monto_efectivo: g.monto_efectivo || "",
          monto_transferencia: g.monto_transferencia || "",
          notas: g.notas || "",
        });
      }
    } catch (error) {
      const { title, message, detail } = getErrorInfo(error);
      toast.error(title, message, detail);
      navigate("/admin/salidas");
    } finally {
      setLoadingGasto(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.concepto.trim()) {
      toast.warning("Campo requerido", "El concepto es obligatorio.");
      return;
    }

    const efectivo = parseFloat(formData.monto_efectivo || 0);
    const transferencia = parseFloat(formData.monto_transferencia || 0);

    if (efectivo <= 0 && transferencia <= 0) {
      toast.warning(
        "Monto requerido",
        "Indicá un monto en efectivo y/o transferencia.",
      );
      return;
    }

    const gastoData = {
      concepto: formData.concepto,
      monto_efectivo: efectivo,
      monto_transferencia: transferencia,
      notas: formData.notas,
    };

    try {
      setLoading(true);
      if (isEditMode) {
        await gastosAPI.update(id, gastoData, token);
        toast.success("Salida actualizada", "Los cambios se guardaron.");
      } else {
        await gastosAPI.create(gastoData, token);
        toast.success("Salida registrada", "El gasto fue registrado.");
      }
      navigate("/admin/salidas");
    } catch (error) {
      const { title, message, detail } = getErrorInfo(error);
      toast.error(title, message, detail);
    } finally {
      setLoading(false);
    }
  };

  if (loadingGasto) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gris-medio">Cargando salida...</p>
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
            to="/admin/salidas"
            className="text-primary hover:underline mb-2 inline-block"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Volver a salidas
          </Link>
          <h2 className="text-2xl font-bold text-secondary">
            {isEditMode ? "Editar Salida" : "Nueva Salida"}
          </h2>
          <p className="text-gris-medio">
            Registrá un gasto o retiro de dinero de la caja (no afecta stock)
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-md p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-texto mb-2">
              Concepto *
            </label>
            <input
              type="text"
              name="concepto"
              value={formData.concepto}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Ej: Pago de luz, retiro personal, sueldo..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-texto mb-2">
                Efectivo
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="monto_efectivo"
                value={formData.monto_efectivo}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-texto mb-2">
                Transferencia
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="monto_transferencia"
                value={formData.monto_transferencia}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="0.00"
              />
            </div>
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
              placeholder="Detalles adicionales (opcional)"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Guardando...
              </>
            ) : isEditMode ? (
              "Guardar Cambios"
            ) : (
              "Registrar Salida"
            )}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
};

export default SalidaForm;
