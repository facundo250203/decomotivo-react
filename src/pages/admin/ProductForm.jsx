// src/pages/admin/ProductForm.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { categoriesAPI, adminProductsAPI } from "../../services/api";
import AdminLayout from "../../components/admin/AdminLayout";
import ProductSearchSelect from "../../components/admin/ProductSearchSelect";
import CategoriaSearchSelect from "../../components/admin/CategoriaSearchSelect";
import { useToast } from "../../context/ToastContext";
import { getErrorInfo } from "../../utils/errorHandler";

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const isEditMode = Boolean(id);

  // Estados del formulario - TODOS los campos de la DB
  const [formData, setFormData] = useState({
    titulo: "",
    slug: "",
    descripcion: "",
    categoria_id: "",
    precio_tipo: "fijo",
    precio_valor: "",
    en_oferta: false,
    precio_oferta: "",
    unidades_por_caja: "",
    precio_caja: "",
    // Campos que faltaban:
    material: "",
    medidas: "",
    capacidad: "",
    colores: "",
    cantidad: 0,
    stock_minimo: 0,
    controla_stock: true,
    tiempo_entrega_tipo: "dias",
    tiempo_entrega_dias: 3,
    // Flags
    personalizable: false,
    destacado: false,
    activo: true,
    visible_publico: true,
    mostrar_precio: true,
    mostrar_imagen: true,
    mostrar_descripcion: true,
  });

  const [categories, setCategories] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  // Variantes (medidas con precio/stock propios, ver migración 018).
  // existingVariantes: ya guardadas en la DB, edición/borrado inmediato.
  // newVariantes: cargadas en este mismo formulario, se crean recién
  // cuando se guarda el producto (igual que newImages).
  const [existingVariantes, setExistingVariantes] = useState([]);
  const [newVariantes, setNewVariantes] = useState([]);
  // Combos (receta de productos/variantes ya existentes, ver migración 021).
  // Mismo esquema existing/new que variantes: existingComboItems ya están
  // guardados en la DB (edición/borrado inmediato), newComboItems se crean
  // recién cuando se guarda el producto.
  const [existingComboItems, setExistingComboItems] = useState([]);
  const [newComboItems, setNewComboItems] = useState([]);
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCategories();
    fetchProductosDisponibles();
    if (isEditMode) {
      fetchProduct();
    }
  }, [id]);

  const toast = useToast();

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      if (response.success) {
        setCategories(response.data || []);
      }
    } catch (error) {
      console.error("Error cargando categorías:", error);
    }
  };

  // Catálogo completo para elegir componentes de un combo (excluye este
  // mismo producto en edición, para que un combo no pueda tenerse a sí
  // mismo como componente -- mismo chequeo que ya hace el backend).
  const fetchProductosDisponibles = async () => {
    try {
      const response = await adminProductsAPI.getAll(token);
      if (response.success) {
        const disponibles = (response.data || []).filter(
          (p) => p.activo && p.precio_tipo !== "combo" && String(p.id) !== String(id),
        );
        setProductosDisponibles(disponibles);
      }
    } catch (error) {
      console.error("Error cargando productos disponibles:", error);
    }
  };

  const fetchProduct = async () => {
    try {
      setLoadingProduct(true);
      const response = await adminProductsAPI.getById(id, token);
      if (response.success && response.data) {
        const product = response.data;
        setFormData({
          titulo: product.titulo || "",
          slug: product.slug || "",
          descripcion: product.descripcion || "",
          categoria_id: product.categoria_id || "",
          precio_tipo: product.precio_tipo || "fijo",
          precio_valor: product.precio_valor || "",
          en_oferta: Boolean(product.en_oferta),
          precio_oferta: product.precio_oferta || "",
          unidades_por_caja: product.unidades_por_caja || "",
          precio_caja: product.precio_caja || "",
          material: product.material || "",
          medidas: product.medidas || "",
          capacidad: product.capacidad || "",
          colores: product.colores || "",
          cantidad: product.cantidad || 0,
          stock_minimo: product.stock_minimo || 0,
          controla_stock:
            product.controla_stock !== undefined
              ? Boolean(product.controla_stock)
              : true,
          tiempo_entrega_tipo: product.tiempo_entrega_tipo || "dias",
          tiempo_entrega_dias: product.tiempo_entrega_dias || 3,
          personalizable:
            product.personalizable === true || product.personalizable === "Sí",
          destacado: Boolean(product.destacado),
          activo: product.activo !== undefined ? Boolean(product.activo) : true,
          visible_publico:
            product.visible_publico !== undefined
              ? Boolean(product.visible_publico)
              : true,
          mostrar_precio:
            product.mostrar_precio !== undefined
              ? Boolean(product.mostrar_precio)
              : true,
          mostrar_imagen:
            product.mostrar_imagen !== undefined
              ? Boolean(product.mostrar_imagen)
              : true,
          mostrar_descripcion:
            product.mostrar_descripcion !== undefined
              ? Boolean(product.mostrar_descripcion)
              : true,
        });
        setExistingImages(product.imagenes || []);
        setExistingVariantes(product.variantes || []);
        if (product.precio_tipo === "combo") {
          fetchComboItems();
        }
      } else {
        toast.error("No encontrado", "El producto no existe.");
        navigate("/admin/productos");
      }
    } catch (error) {
      const { title, message, detail } = getErrorInfo(error);
      toast.error(title, message, detail);
      if (error?.status === 401)
        setTimeout(() => navigate("/admin/login"), 2000);
      navigate("/admin/productos");
    } finally {
      setLoadingProduct(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      // Cambiar a un tipo de precio distinto de "fijo" oculta el checkbox
      // de oferta -- si no lo reseteamos acá, queda un en_oferta=true
      // "fantasma" que solo se nota al fallar la validación al guardar.
      ...(name === "precio_tipo" && value !== "fijo"
        ? { en_oferta: false, precio_oferta: "" }
        : {}),
    }));

    // Generar slug automáticamente al escribir el título (solo en creación)
    if (name === "titulo" && !isEditMode) {
      const slug = value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);

    const validImages = files.filter((file) => file.type.startsWith("image/"));

    if (validImages.length !== files.length) {
      alert("Solo se permiten archivos de imagen");
      return;
    }

    const imagePreviews = validImages.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      alt_text: "",
      es_principal: newImages.length === 0 && existingImages.length === 0,
    }));

    setNewImages((prev) => [...prev, ...imagePreviews]);
  };

  const removeNewImage = (index) => {
    setNewImages((prev) => {
      const updated = prev.filter((_, i) => i !== index);

      if (prev[index].es_principal && updated.length > 0) {
        updated[0].es_principal = true;
      }

      return updated;
    });
  };

  const deleteExistingImage = async (imageId) => {
    if (!window.confirm("¿Eliminar esta imagen del servidor?")) {
      return;
    }

    try {
      const response = await adminProductsAPI.deleteImage(id, imageId, token);

      if (response.success) {
        setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
        alert("Imagen eliminada correctamente");
      } else {
        alert("Error al eliminar la imagen: " + response.error);
      }
    } catch (error) {
      console.error("Error eliminando imagen:", error);
      alert("Error al eliminar la imagen");
    }
  };

  const setAsPrincipal = (index, isNew = true) => {
    if (isNew) {
      setNewImages((prev) =>
        prev.map((img, i) => ({
          ...img,
          es_principal: i === index,
        })),
      );
      setExistingImages((prev) =>
        prev.map((img) => ({
          ...img,
          es_principal: false,
        })),
      );
    } else {
      setExistingImages((prev) =>
        prev.map((img, i) => ({
          ...img,
          es_principal: i === index,
        })),
      );
      setNewImages((prev) =>
        prev.map((img) => ({
          ...img,
          es_principal: false,
        })),
      );
    }
  };

  // ============================================
  // VARIANTES (medidas con precio/stock propios)
  // ============================================
  const agregarNuevaVariante = () => {
    setNewVariantes((prev) => [
      ...prev,
      { nombre: "", precio_valor: "", cantidad: 0, stock_minimo: 0 },
    ]);
  };

  const handleNewVarianteChange = (index, field, value) => {
    setNewVariantes((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const quitarNuevaVariante = (index) => {
    setNewVariantes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleExistingVarianteChange = (index, field, value) => {
    setExistingVariantes((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const guardarVarianteExistente = async (index) => {
    const variante = existingVariantes[index];
    try {
      const response = await adminProductsAPI.updateVariante(
        id,
        variante.id,
        {
          nombre: variante.nombre,
          precio_valor: parseFloat(variante.precio_valor),
          cantidad: parseInt(variante.cantidad) || 0,
          stock_minimo: parseInt(variante.stock_minimo) || 0,
        },
        token,
      );
      if (response.success) {
        toast.success("Variante guardada", `"${variante.nombre}" actualizada.`);
      } else {
        toast.error("Error", response.error || "No se pudo guardar la variante.");
      }
    } catch (error) {
      const { title, message, detail } = getErrorInfo(error);
      toast.error(title, message, detail);
    }
  };

  const eliminarVarianteExistente = async (index) => {
    const variante = existingVariantes[index];
    if (!window.confirm(`¿Eliminar la variante "${variante.nombre}"?`)) return;

    try {
      const response = await adminProductsAPI.deleteVariante(
        id,
        variante.id,
        token,
      );
      if (response.success) {
        setExistingVariantes((prev) => prev.filter((_, i) => i !== index));
        toast.success("Variante eliminada", `"${variante.nombre}" fue eliminada.`);
      } else {
        toast.error("Error", response.error || "No se pudo eliminar la variante.");
      }
    } catch (error) {
      const { title, message, detail } = getErrorInfo(error);
      toast.error(title, message, detail);
    }
  };

  // ============================================
  // COMBOS (receta de productos/variantes ya existentes, ver migración 021)
  // ============================================
  const fetchComboItems = async () => {
    try {
      const response = await adminProductsAPI.getComboItems(id, token);
      if (response.success) {
        setExistingComboItems(response.data || []);
      }
    } catch (error) {
      console.error("Error cargando componentes del combo:", error);
    }
  };

  const agregarNuevoComboItem = () => {
    setNewComboItems((prev) => [
      ...prev,
      { componente_producto_id: "", componente_variante_id: "", cantidad: 1 },
    ]);
  };

  const handleNewComboItemChange = (index, field, value) => {
    setNewComboItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      // Cambiar de producto componente descarta la variante elegida antes
      // (podría no existir en el nuevo producto).
      if (field === "componente_producto_id") {
        updated[index].componente_variante_id = "";
      }
      return updated;
    });
  };

  const quitarNuevoComboItem = (index) => {
    setNewComboItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleExistingComboItemChange = (index, field, value) => {
    setExistingComboItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const guardarComboItemExistente = async (index) => {
    const item = existingComboItems[index];
    try {
      const response = await adminProductsAPI.updateComboItem(
        id,
        item.id,
        { cantidad: parseInt(item.cantidad) || 1 },
        token,
      );
      if (response.success) {
        toast.success("Componente guardado", "La cantidad fue actualizada.");
      } else {
        toast.error("Error", response.error || "No se pudo guardar el componente.");
      }
    } catch (error) {
      const { title, message, detail } = getErrorInfo(error);
      toast.error(title, message, detail);
    }
  };

  const eliminarComboItemExistente = async (index) => {
    const item = existingComboItems[index];
    if (!window.confirm("¿Quitar este componente del combo?")) return;

    try {
      const response = await adminProductsAPI.deleteComboItem(id, item.id, token);
      if (response.success) {
        setExistingComboItems((prev) => prev.filter((_, i) => i !== index));
        toast.success("Componente eliminado", "Se quitó de la receta del combo.");
      } else {
        toast.error("Error", response.error || "No se pudo quitar el componente.");
      }
    } catch (error) {
      const { title, message, detail } = getErrorInfo(error);
      toast.error(title, message, detail);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.titulo.trim()) {
      newErrors.titulo = "El título es obligatorio";
    }

    if (!formData.slug.trim()) {
      newErrors.slug = "El slug es obligatorio";
    }

    if (!formData.categoria_id) {
      newErrors.categoria_id = "Debes seleccionar una categoría";
    }

    if (formData.precio_tipo === "fijo" || formData.precio_tipo === "desde") {
      if (!formData.precio_valor || formData.precio_valor <= 0) {
        newErrors.precio_valor = "El precio debe ser mayor a 0";
      }
    }

    if (formData.en_oferta) {
      if (formData.precio_tipo !== "fijo") {
        newErrors.en_oferta =
          "Solo un producto con precio fijo puede estar en oferta";
      } else if (!formData.precio_oferta || formData.precio_oferta <= 0) {
        newErrors.precio_oferta = "Ingresá el precio de oferta";
      } else if (
        parseFloat(formData.precio_oferta) >= parseFloat(formData.precio_valor)
      ) {
        newErrors.precio_oferta =
          "El precio de oferta debe ser menor al precio normal";
      }
    }

    const tieneUnidadesPorCaja = formData.unidades_por_caja !== "";
    const tienePrecioCaja = formData.precio_caja !== "";
    if (tieneUnidadesPorCaja !== tienePrecioCaja) {
      newErrors.unidades_por_caja =
        "Para vender por caja completá tanto las unidades como el precio de la caja";
    } else if (tieneUnidadesPorCaja && Number(formData.unidades_por_caja) <= 0) {
      newErrors.unidades_por_caja = "Las unidades por caja deben ser mayor a 0";
    } else if (tienePrecioCaja && Number(formData.precio_caja) <= 0) {
      newErrors.unidades_por_caja = "El precio de la caja debe ser mayor a 0";
    }

    if (formData.precio_tipo === "variantes") {
      const variantesValidas =
        existingVariantes.filter((v) => v.activo).length +
        newVariantes.filter((v) => v.nombre.trim() && v.precio_valor > 0)
          .length;
      if (variantesValidas === 0) {
        newErrors.variantes =
          "Agregá al menos una variante con nombre y precio";
      }
    }

    if (formData.precio_tipo === "combo") {
      const comboItemsValidos =
        existingComboItems.length +
        newComboItems.filter((i) => i.componente_producto_id && i.cantidad > 0)
          .length;
      if (comboItemsValidos < 2) {
        newErrors.comboItems =
          "Un combo necesita al menos 2 componentes (ej: mate + bombilla)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.warning(
        "Formulario incompleto",
        "Por favor corregí los errores antes de continuar.",
      );
      return;
    }

    setLoading(true);

    try {
      const productData = {
        ...formData,
        precio_valor:
          formData.precio_tipo === "consultar" ||
          formData.precio_tipo === "variantes"
            ? null
            : parseFloat(formData.precio_valor),
        precio_oferta: formData.en_oferta
          ? parseFloat(formData.precio_oferta)
          : null,
        unidades_por_caja:
          formData.unidades_por_caja === ""
            ? null
            : parseInt(formData.unidades_por_caja),
        precio_caja:
          formData.precio_caja === "" ? null : parseFloat(formData.precio_caja),
        cantidad: parseInt(formData.cantidad) || 0,
        stock_minimo: parseInt(formData.stock_minimo) || 0,
        tiempo_entrega_dias: parseInt(formData.tiempo_entrega_dias) || 3,
      };

      let productId;

      if (isEditMode) {
        const response = await adminProductsAPI.update(id, productData, token);
        if (!response.success) {
          throw new Error(response.error || "Error al actualizar el producto");
        }
        productId = id;
      } else {
        const response = await adminProductsAPI.create(productData, token);
        if (!response.success || !response.data) {
          throw new Error(response.error || "Error al crear el producto");
        }
        productId = response.data.id;
      }

      // Subir nuevas imágenes
      if (newImages.length > 0) {
        for (let i = 0; i < newImages.length; i++) {
          const imageData = newImages[i];
          const formDataImg = new FormData();
          formDataImg.append("imagen", imageData.file);
          formDataImg.append("alt_text", imageData.alt_text || "");
          formDataImg.append(
            "es_principal",
            imageData.es_principal ? "true" : "false",
          );
          await adminProductsAPI.uploadImage(productId, formDataImg, token);
        }
      }

      // Crear las medidas cargadas en este formulario (las que ya existían
      // se editan/borran al instante desde sus propios botones, no acá).
      // Si el producto ya no es de tipo "variantes" (se cambió antes de
      // guardar), no tiene sentido crear medidas huérfanas.
      const variantesValidas =
        productData.precio_tipo === "variantes"
          ? newVariantes.filter((v) => v.nombre.trim() && v.precio_valor > 0)
          : [];
      for (const variante of variantesValidas) {
        await adminProductsAPI.createVariante(
          productId,
          {
            nombre: variante.nombre.trim(),
            precio_valor: parseFloat(variante.precio_valor),
            cantidad: parseInt(variante.cantidad) || 0,
            stock_minimo: parseInt(variante.stock_minimo) || 0,
          },
          token,
        );
      }

      // Crear los componentes de combo cargados en este formulario (los que
      // ya existían se editan/borran al instante desde sus propios botones,
      // igual que las variantes existentes).
      const comboItemsValidos =
        productData.precio_tipo === "combo"
          ? newComboItems.filter((i) => i.componente_producto_id && i.cantidad > 0)
          : [];
      for (const item of comboItemsValidos) {
        await adminProductsAPI.createComboItem(
          productId,
          {
            componente_producto_id: parseInt(item.componente_producto_id),
            componente_variante_id: item.componente_variante_id
              ? parseInt(item.componente_variante_id)
              : null,
            cantidad: parseInt(item.cantidad) || 1,
          },
          token,
        );
      }

      toast.success(
        isEditMode ? "Producto actualizado" : "Producto creado",
        isEditMode
          ? "Los cambios fueron guardados correctamente."
          : "El producto fue creado correctamente.",
      );
      navigate("/admin/productos");
    } catch (error) {
      const { title, message, detail } = getErrorInfo(error);
      toast.error(title, message, detail);
      if (error?.status === 401) {
        setTimeout(() => navigate("/admin/login"), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingProduct) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gris-medio">Cargando producto...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-secondary">
            {isEditMode ? "Editar Producto" : "Nuevo Producto"}
          </h2>
          <p className="text-gris-medio">
            {isEditMode
              ? "Modifica los datos del producto"
              : "Completa los datos para crear un nuevo producto"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ============================================ */}
          {/* SECCIÓN 1: Información Básica */}
          {/* ============================================ */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 text-secondary flex items-center gap-2">
              <i className="fas fa-info-circle text-primary"></i>
              Información Básica
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Título */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-texto mb-2">
                  Título del Producto *
                </label>
                <input
                  type="text"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.titulo ? "border-red-500" : "border-gris-claro"
                  }`}
                  placeholder="Ej: Mate de Algarrobo Personalizado"
                />
                {errors.titulo && (
                  <p className="text-red-500 text-sm mt-1">{errors.titulo}</p>
                )}
              </div>

              {/* Slug */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-texto mb-2">
                  Slug (URL) *
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.slug ? "border-red-500" : "border-gris-claro"
                  }`}
                  placeholder="mate-algarrobo-personalizado"
                />
                {errors.slug && (
                  <p className="text-red-500 text-sm mt-1">{errors.slug}</p>
                )}
                <p className="text-xs text-gris-medio mt-1">
                  Se genera automáticamente desde el título
                </p>
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-texto mb-2">
                  Categoría *
                </label>
                <CategoriaSearchSelect
                  categorias={categories}
                  value={formData.categoria_id}
                  onChange={(value) =>
                    handleInputChange({
                      target: { name: "categoria_id", value },
                    })
                  }
                  getOptionLabel={(cat) => cat.nombre}
                  placeholder="Buscar categoría..."
                />
                {errors.categoria_id && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.categoria_id}
                  </p>
                )}
              </div>

              {/* Descripción */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-texto mb-2">
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Describe el producto..."
                />
              </div>
            </div>
          </div>

          {/* ============================================ */}
          {/* SECCIÓN 2: Detalles del Producto */}
          {/* ============================================ */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 text-secondary flex items-center gap-2">
              <i className="fas fa-list-alt text-primary"></i>
              Detalles del Producto
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Material */}
              <div>
                <label className="block text-sm font-medium text-texto mb-2">
                  Material
                </label>
                <input
                  type="text"
                  name="material"
                  value={formData.material}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Ej: Algarrobo, MDF, Pino"
                />
              </div>

              {/* Medidas */}
              <div>
                <label className="block text-sm font-medium text-texto mb-2">
                  Medidas
                </label>
                <input
                  type="text"
                  name="medidas"
                  value={formData.medidas}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Ej: 20x15x8 cm"
                />
              </div>

              {/* Capacidad */}
              <div>
                <label className="block text-sm font-medium text-texto mb-2">
                  Capacidad
                </label>
                <input
                  type="text"
                  name="capacidad"
                  value={formData.capacidad}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Ej: 250ml"
                />
              </div>

              {/* Colores */}
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-texto mb-2">
                  Colores disponibles
                </label>
                <input
                  type="text"
                  name="colores"
                  value={formData.colores}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Ej: Natural, Negro, Blanco, Roble"
                />
                <p className="text-xs text-gris-medio mt-1">
                  Separa los colores con comas
                </p>
              </div>

              {/* Controla stock -- no aplica a productos con variantes: el
                  stock ahí se maneja por variante, más abajo. Tampoco aplica
                  a combos: no tienen stock propio, se calcula solo a partir
                  del stock de sus componentes (ver migración 021). */}
              {formData.precio_tipo === "variantes" ? (
                <div className="md:col-span-2 lg:col-span-3">
                  <p className="text-sm text-gris-medio bg-gris-claro rounded-lg p-3">
                    Este producto tiene variantes: el stock se carga por
                    variante en la sección &quot;Variantes&quot;, más abajo.
                  </p>
                </div>
              ) : formData.precio_tipo === "combo" ? (
                <div className="md:col-span-2 lg:col-span-3">
                  <p className="text-sm text-gris-medio bg-gris-claro rounded-lg p-3">
                    Este producto es un combo: su stock se calcula solo en
                    base al stock de sus componentes, en la sección
                    &quot;Componentes del Combo&quot;, más abajo.
                  </p>
                </div>
              ) : (
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="controla_stock"
                      checked={formData.controla_stock}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-primary border-gris-claro rounded focus:ring-primary"
                    />
                    <div>
                      <span className="font-medium text-texto">
                        Controla stock
                      </span>
                      <p className="text-xs text-gris-medio">
                        Desactivalo para servicios sin inventario (ej. copias
                        e impresiones) — no se le exige ni descuenta cantidad
                        al venderlo
                      </p>
                    </div>
                  </label>
                </div>
              )}

              {formData.controla_stock &&
                formData.precio_tipo !== "variantes" &&
                formData.precio_tipo !== "combo" && (
                <>
                  {/* Stock/Cantidad */}
                  <div>
                    <label className="block text-sm font-medium text-texto mb-2">
                      Stock disponible
                    </label>
                    <input
                      type="number"
                      name="cantidad"
                      value={formData.cantidad}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-4 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="0"
                    />
                  </div>

                  {/* Stock mínimo (alerta) */}
                  <div>
                    <label className="block text-sm font-medium text-texto mb-2">
                      Stock mínimo (alerta)
                    </label>
                    <input
                      type="number"
                      name="stock_minimo"
                      value={formData.stock_minimo}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-4 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="0"
                    />
                    <p className="text-xs text-gris-medio mt-1">
                      Se te avisa cuando el stock caiga a este nivel o menos
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ============================================ */}
          {/* SECCIÓN 3: Precio */}
          {/* ============================================ */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 text-secondary flex items-center gap-2">
              <i className="fas fa-dollar-sign text-primary"></i>
              Precio
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tipo de precio */}
              <div>
                <label className="block text-sm font-medium text-texto mb-2">
                  Tipo de Precio *
                </label>
                <select
                  name="precio_tipo"
                  value={formData.precio_tipo}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="fijo">Precio Fijo</option>
                  <option value="desde">Desde (precio mínimo)</option>
                  <option value="consultar">Consultar precio</option>
                  <option value="variantes">
                    Variantes (cada una con su propio precio)
                  </option>
                  <option value="combo">
                    Combo (productos existentes a precio de promo)
                  </option>
                </select>
              </div>

              {/* Aviso: cambiar de "variantes" a otro tipo no borra las
                  variantes ya guardadas, solo deja de mostrarlas. */}
              {formData.precio_tipo !== "variantes" &&
                existingVariantes.length > 0 && (
                  <div className="md:col-span-2 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-lg p-3">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    Tenés {existingVariantes.length}{" "}
                    {existingVariantes.length === 1 ? "variante" : "variantes"}{" "}
                    guardada{existingVariantes.length === 1 ? "" : "s"} que
                    van a quedar ocultas (no se borran) mientras el tipo de
                    precio no sea &quot;Variantes&quot;.
                  </div>
                )}

              {/* Valor del precio */}
              {formData.precio_tipo !== "consultar" &&
                formData.precio_tipo !== "variantes" && (
                <div>
                  <label className="block text-sm font-medium text-texto mb-2">
                    {formData.precio_tipo === "desde"
                      ? "Precio Desde *"
                      : "Precio *"}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gris-medio">
                      $
                    </span>
                    <input
                      type="number"
                      name="precio_valor"
                      value={formData.precio_valor}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                        errors.precio_valor
                          ? "border-red-500"
                          : "border-gris-claro"
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.precio_valor && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.precio_valor}
                    </p>
                  )}
                </div>
              )}

              {/* En oferta -- solo tiene sentido con precio fijo */}
              {formData.precio_tipo === "fijo" && (
                <div className="md:col-span-2 border-t pt-4">
                  <label className="flex items-center gap-3 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      name="en_oferta"
                      checked={formData.en_oferta}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-red-500 border-gris-claro rounded focus:ring-red-500"
                    />
                    <div>
                      <span className="font-medium text-texto">
                        Producto en oferta
                      </span>
                      <p className="text-xs text-gris-medio">
                        Muestra el precio normal tachado y el de oferta al
                        lado, con una etiqueta sobre la imagen. Se agrupa en
                        /ofertas junto a los demás productos en oferta.
                      </p>
                    </div>
                  </label>
                  {errors.en_oferta && (
                    <p className="text-red-500 text-sm mb-2">
                      {errors.en_oferta}
                    </p>
                  )}

                  {formData.en_oferta && (
                    <div className="max-w-xs">
                      <label className="block text-sm font-medium text-texto mb-2">
                        Precio de Oferta *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gris-medio">
                          $
                        </span>
                        <input
                          type="number"
                          name="precio_oferta"
                          value={formData.precio_oferta}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                            errors.precio_oferta
                              ? "border-red-500"
                              : "border-gris-claro"
                          }`}
                          placeholder="0.00"
                        />
                      </div>
                      {errors.precio_oferta && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.precio_oferta}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Venta por caja -- puramente para la carga de ventas/
                  pedidos (ver migración 027), nunca se muestra en el
                  catálogo público. Ambos campos son opcionales y van de a
                  par: sin los dos, el producto se vende solo por unidad. */}
              {formData.precio_tipo === "fijo" && (
                <div className="md:col-span-2 border-t pt-4">
                  <p className="text-sm font-medium text-texto mb-1">
                    Venta por caja (opcional)
                  </p>
                  <p className="text-xs text-gris-medio mb-3">
                    Para productos que también se venden en caja cerrada,
                    compartiendo el mismo stock que la unidad suelta. No
                    aparece en la tienda pública, solo se usa al cargar una
                    venta o un pedido.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Unidades por caja
                      </label>
                      <input
                        type="number"
                        name="unidades_por_caja"
                        value={formData.unidades_por_caja}
                        onChange={handleInputChange}
                        min="1"
                        step="1"
                        className="w-full px-3 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary"
                        placeholder="Ej: 10"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Precio de la caja
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gris-medio">
                          $
                        </span>
                        <input
                          type="number"
                          name="precio_caja"
                          value={formData.precio_caja}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          className="w-full pl-8 pr-4 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                  {errors.unidades_por_caja && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.unidades_por_caja}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ============================================ */}
          {/* SECCIÓN 3.5: Variantes */}
          {/* ============================================ */}
          {formData.precio_tipo === "variantes" && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-1 text-secondary flex items-center gap-2">
                <i className="fas fa-ruler-combined text-primary"></i>
                Variantes
              </h3>
              <p className="text-xs text-gris-medio mb-4">
                Cada variante tiene su propio precio y su propio stock. El
                precio &quot;desde&quot; que se muestra en la tienda se calcula solo,
                a partir de la variante más barata activa.
              </p>
              {errors.variantes && (
                <p className="text-red-500 text-sm mb-3">{errors.variantes}</p>
              )}

              {/* Encabezado de columnas -- sin esto, un input de stock
                  nuevo en 0 muestra "0" en vez del placeholder ("Stock"),
                  así que no hay forma de distinguir a simple vista qué
                  campo es cuál. */}
              {(existingVariantes.length > 0 || newVariantes.length > 0) && (
                <div className="hidden md:grid md:grid-cols-6 gap-2 px-3 mb-1 text-xs font-medium text-gris-medio">
                  <span className="md:col-span-2">Nombre</span>
                  <span>Precio</span>
                  <span>Stock</span>
                  <span>Stock Mínimo</span>
                  <span></span>
                </div>
              )}

              {/* Variantes ya guardadas: edición y borrado inmediatos */}
              {existingVariantes.length > 0 && (
                <div className="space-y-3 mb-4">
                  {existingVariantes.map((variante, index) => (
                    <div
                      key={variante.id}
                      className={`grid grid-cols-1 md:grid-cols-6 gap-2 items-start border rounded-lg p-3 ${
                        variante.activo ? "" : "opacity-50"
                      }`}
                    >
                      <input
                        type="text"
                        value={variante.nombre}
                        onChange={(e) =>
                          handleExistingVarianteChange(
                            index,
                            "nombre",
                            e.target.value,
                          )
                        }
                        placeholder="Nombre (ej: Grande 35x25cm)"
                        className="md:col-span-2 px-3 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      <input
                        type="number"
                        value={variante.precio_valor}
                        onChange={(e) =>
                          handleExistingVarianteChange(
                            index,
                            "precio_valor",
                            e.target.value,
                          )
                        }
                        min="0"
                        step="0.01"
                        placeholder="Precio"
                        className="px-3 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      <input
                        type="number"
                        value={variante.cantidad}
                        onChange={(e) =>
                          handleExistingVarianteChange(
                            index,
                            "cantidad",
                            e.target.value,
                          )
                        }
                        min="0"
                        placeholder="Stock"
                        className="px-3 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      <input
                        type="number"
                        value={variante.stock_minimo}
                        onChange={(e) =>
                          handleExistingVarianteChange(
                            index,
                            "stock_minimo",
                            e.target.value,
                          )
                        }
                        min="0"
                        placeholder="Stock mínimo"
                        title="Stock mínimo: alerta cuando el stock caiga a este nivel o menos"
                        className="px-3 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => guardarVarianteExistente(index)}
                          className="flex-1 bg-primary text-white px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors"
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          onClick={() => eliminarVarianteExistente(index)}
                          className="bg-red-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-600 transition-colors"
                          title="Eliminar"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Variantes nuevas: se crean recién al guardar el producto */}
              {newVariantes.length > 0 && (
                <div className="space-y-3 mb-4">
                  {newVariantes.map((variante, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 md:grid-cols-6 gap-2 items-start border border-dashed rounded-lg p-3"
                    >
                      <input
                        type="text"
                        value={variante.nombre}
                        onChange={(e) =>
                          handleNewVarianteChange(
                            index,
                            "nombre",
                            e.target.value,
                          )
                        }
                        placeholder="Nombre (ej: Chica 20x15cm)"
                        className="md:col-span-2 px-3 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      <input
                        type="number"
                        value={variante.precio_valor}
                        onChange={(e) =>
                          handleNewVarianteChange(
                            index,
                            "precio_valor",
                            e.target.value,
                          )
                        }
                        min="0"
                        step="0.01"
                        placeholder="Precio"
                        className="px-3 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      <input
                        type="number"
                        value={variante.cantidad}
                        onChange={(e) =>
                          handleNewVarianteChange(
                            index,
                            "cantidad",
                            e.target.value,
                          )
                        }
                        min="0"
                        placeholder="Stock"
                        className="px-3 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      <input
                        type="number"
                        value={variante.stock_minimo}
                        onChange={(e) =>
                          handleNewVarianteChange(
                            index,
                            "stock_minimo",
                            e.target.value,
                          )
                        }
                        min="0"
                        placeholder="Stock mínimo"
                        title="Stock mínimo: alerta cuando el stock caiga a este nivel o menos"
                        className="px-3 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => quitarNuevaVariante(index)}
                        className="bg-gris-claro text-texto px-3 py-2 rounded-lg text-sm hover:bg-red-100 hover:text-red-600 transition-colors"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                  <p className="text-xs text-gris-medio">
                    Estas variantes se crean cuando guardes el producto.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={agregarNuevaVariante}
                className="text-sm bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <i className="fas fa-plus mr-1"></i>
                Agregar Variante
              </button>
            </div>
          )}

          {/* ============================================ */}
          {/* SECCIÓN 3.6: Componentes del Combo */}
          {/* ============================================ */}
          {formData.precio_tipo === "combo" && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-1 text-secondary flex items-center gap-2">
                <i className="fas fa-boxes-stacked text-primary"></i>
                Componentes del Combo
              </h3>
              <p className="text-xs text-gris-medio mb-4">
                Elegí los productos reales que forman el combo (ej: mate +
                bombilla) y cuántas unidades de cada uno lleva. El stock del
                combo se calcula solo, en base al stock de estos componentes
                -- no tiene stock propio.
              </p>
              {errors.comboItems && (
                <p className="text-red-500 text-sm mb-3">{errors.comboItems}</p>
              )}

              {/* Componentes ya guardados: edición (solo cantidad) y borrado
                  inmediatos, igual que las variantes existentes. */}
              {existingComboItems.length > 0 && (
                <div className="space-y-3 mb-4">
                  {existingComboItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-1 md:grid-cols-5 gap-2 items-start border rounded-lg p-3"
                    >
                      <div className="md:col-span-3 px-3 py-2 text-sm text-texto bg-gris-claro rounded-lg">
                        {item.componente_titulo}
                        {item.componente_variante_nombre
                          ? ` — ${item.componente_variante_nombre}`
                          : ""}
                      </div>
                      <input
                        type="number"
                        value={item.cantidad}
                        onChange={(e) =>
                          handleExistingComboItemChange(
                            index,
                            "cantidad",
                            e.target.value,
                          )
                        }
                        min="1"
                        placeholder="Cantidad"
                        className="px-3 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => guardarComboItemExistente(index)}
                          className="flex-1 bg-primary text-white px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors"
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          onClick={() => eliminarComboItemExistente(index)}
                          className="bg-red-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-600 transition-colors"
                          title="Quitar"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Componentes nuevos: se crean recién al guardar el producto */}
              {newComboItems.length > 0 && (
                <div className="space-y-3 mb-4">
                  {newComboItems.map((item, index) => {
                    const productoElegido = productosDisponibles.find(
                      (p) => p.id === parseInt(item.componente_producto_id),
                    );
                    const tieneVariantes =
                      productoElegido?.precio_tipo === "variantes" &&
                      productoElegido.variantes?.length > 0;

                    return (
                      <div
                        key={index}
                        className="grid grid-cols-1 md:grid-cols-5 gap-2 items-start border border-dashed rounded-lg p-3"
                      >
                        <div className="md:col-span-2">
                          <ProductSearchSelect
                            productos={productosDisponibles}
                            value={item.componente_producto_id}
                            onChange={(value) =>
                              handleNewComboItemChange(
                                index,
                                "componente_producto_id",
                                value,
                              )
                            }
                            getOptionLabel={(p) => p.titulo}
                            placeholder="Buscar producto componente..."
                          />
                        </div>
                        {tieneVariantes ? (
                          <select
                            value={item.componente_variante_id}
                            onChange={(e) =>
                              handleNewComboItemChange(
                                index,
                                "componente_variante_id",
                                e.target.value,
                              )
                            }
                            className="px-3 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          >
                            <option value="">Elegir variante</option>
                            {productoElegido.variantes.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.nombre}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="px-3 py-2 text-xs text-gris-medio flex items-center">
                            {productoElegido ? "Sin variantes" : ""}
                          </div>
                        )}
                        <input
                          type="number"
                          value={item.cantidad}
                          onChange={(e) =>
                            handleNewComboItemChange(
                              index,
                              "cantidad",
                              e.target.value,
                            )
                          }
                          min="1"
                          placeholder="Cantidad"
                          className="px-3 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => quitarNuevoComboItem(index)}
                          className="bg-gris-claro text-texto px-3 py-2 rounded-lg text-sm hover:bg-red-100 hover:text-red-600 transition-colors"
                        >
                          Quitar
                        </button>
                      </div>
                    );
                  })}
                  <p className="text-xs text-gris-medio">
                    Estos componentes se agregan cuando guardes el producto.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={agregarNuevoComboItem}
                className="text-sm bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <i className="fas fa-plus mr-1"></i>
                Agregar Componente
              </button>
            </div>
          )}

          {/* ============================================ */}
          {/* SECCIÓN 4: Tiempo de Entrega */}
          {/* ============================================ */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 text-secondary flex items-center gap-2">
              <i className="fas fa-truck text-primary"></i>
              Tiempo de Entrega
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tipo de tiempo */}
              <div>
                <label className="block text-sm font-medium text-texto mb-2">
                  Unidad de tiempo
                </label>
                <select
                  name="tiempo_entrega_tipo"
                  value={formData.tiempo_entrega_tipo}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="inmediata">Entrega Inmediata</option>
                  <option value="dias">Días</option>
                </select>
              </div>

              {/* Cantidad de tiempo */}
              {formData.tiempo_entrega_tipo === "dias" && (
                <div>
                  <label className="block text-sm font-medium text-texto mb-2">
                    Cantidad de días
                  </label>
                  <input
                    type="number"
                    name="tiempo_entrega_dias"
                    value={formData.tiempo_entrega_dias}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-4 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="3"
                  />
                  <p className="text-xs text-gris-medio mt-1">
                    Se mostrará como: {formData.tiempo_entrega_dias} día
                    {formData.tiempo_entrega_dias > 1 ? "s" : ""}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ============================================ */}
          {/* SECCIÓN 5: Opciones */}
          {/* ============================================ */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 text-secondary flex items-center gap-2">
              <i className="fas fa-cog text-primary"></i>
              Opciones
            </h3>

            <div className="flex flex-wrap gap-6">
              {/* Personalizable */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="personalizable"
                  checked={formData.personalizable}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-primary border-gris-claro rounded focus:ring-primary"
                />
                <div>
                  <span className="font-medium text-texto">Personalizable</span>
                  <p className="text-xs text-gris-medio">
                    El cliente puede personalizar este producto
                  </p>
                </div>
              </label>

              {/* Destacado */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="destacado"
                  checked={formData.destacado}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-yellow-500 border-gris-claro rounded focus:ring-yellow-500"
                />
                <div>
                  <span className="font-medium text-texto">Destacado</span>
                  <p className="text-xs text-gris-medio">
                    Aparecerá en la sección de destacados
                  </p>
                </div>
              </label>

              {/* Activo */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="activo"
                  checked={formData.activo}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-green-500 border-gris-claro rounded focus:ring-green-500"
                />
                <div>
                  <span className="font-medium text-texto">Activo</span>
                  <p className="text-xs text-gris-medio">
                    Existe y se puede vender (desmarcalo para &quot;borrarlo&quot;)
                  </p>
                </div>
              </label>

              {/* Visible en la tienda pública -- gate maestro: si se
                  desmarca, el producto entero desaparece del catálogo
                  (nombre incluido), no solo campos puntuales. */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="visible_publico"
                  checked={formData.visible_publico}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-green-500 border-gris-claro rounded focus:ring-green-500"
                />
                <div>
                  <span className="font-medium text-texto">
                    Visible en la tienda pública (nombre y todo lo demás)
                  </span>
                  <p className="text-xs text-gris-medio">
                    Desmarcalo para venderlo solo por pedido/venta directa,
                    sin que aparezca en la página
                  </p>
                </div>
              </label>
            </div>

            {/* Qué campos mostrar del producto -- solo aplica si el
                producto ya es visible (checkbox de arriba). El nombre
                nunca se oculta acá: para ocultar el producto entero se usa
                "Visible en la tienda pública". */}
            <div className="mt-4 pt-4 border-t border-gris-claro">
              <p className="text-sm font-medium text-texto mb-3">
                Qué mostrar de este producto en la tienda
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="mostrar_precio"
                    checked={formData.mostrar_precio}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-green-500 border-gris-claro rounded focus:ring-green-500"
                  />
                  <span className="font-medium text-texto">Precio</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="mostrar_imagen"
                    checked={formData.mostrar_imagen}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-green-500 border-gris-claro rounded focus:ring-green-500"
                  />
                  <span className="font-medium text-texto">Imagen</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="mostrar_descripcion"
                    checked={formData.mostrar_descripcion}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-green-500 border-gris-claro rounded focus:ring-green-500"
                  />
                  <span className="font-medium text-texto">Descripción</span>
                </label>
              </div>
            </div>
          </div>

          {/* ============================================ */}
          {/* SECCIÓN 6: Imágenes */}
          {/* ============================================ */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 text-secondary flex items-center gap-2">
              <i className="fas fa-images text-primary"></i>
              Imágenes
            </h3>

            {/* Input para subir */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-texto mb-2">
                Agregar imágenes
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="w-full px-4 py-2 border border-gris-claro rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-xs text-gris-medio mt-1">
                Opcional. Sin imagen, la tienda muestra el logo de DecoMotivo
                como placeholder.
              </p>
            </div>

            {/* Imágenes existentes */}
            {existingImages.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-texto mb-2">
                  Imágenes guardadas:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {existingImages.map((img, index) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.url}
                        alt={img.alt_text || "Imagen del producto"}
                        className={`w-full h-32 object-cover rounded-lg border-2 ${
                          img.es_principal
                            ? "border-primary"
                            : "border-gris-claro"
                        }`}
                      />
                      {img.es_principal && (
                        <span className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded">
                          Principal
                        </span>
                      )}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!img.es_principal && (
                          <button
                            type="button"
                            onClick={() => setAsPrincipal(index, false)}
                            className="bg-blue-500 text-white p-1 rounded text-xs"
                            title="Hacer principal"
                          >
                            <i className="fas fa-star"></i>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteExistingImage(img.id)}
                          className="bg-red-500 text-white p-1 rounded text-xs"
                          title="Eliminar"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nuevas imágenes */}
            {newImages.length > 0 && (
              <div>
                <p className="text-sm font-medium text-texto mb-2">
                  Nuevas imágenes:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {newImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img.preview}
                        alt="Preview"
                        className={`w-full h-32 object-cover rounded-lg border-2 ${
                          img.es_principal
                            ? "border-primary"
                            : "border-gris-claro"
                        }`}
                      />
                      {img.es_principal && (
                        <span className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded">
                          Principal
                        </span>
                      )}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!img.es_principal && (
                          <button
                            type="button"
                            onClick={() => setAsPrincipal(index, true)}
                            className="bg-blue-500 text-white p-1 rounded text-xs"
                            title="Hacer principal"
                          >
                            <i className="fas fa-star"></i>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="bg-red-500 text-white p-1 rounded text-xs"
                          title="Quitar"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ============================================ */}
          {/* Botones de acción */}
          {/* ============================================ */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-white py-3 px-6 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  {isEditMode ? "Actualizando..." : "Creando..."}
                </>
              ) : (
                <>
                  <i
                    className={`fas ${isEditMode ? "fa-save" : "fa-plus"} mr-2`}
                  ></i>
                  {isEditMode ? "Actualizar Producto" : "Crear Producto"}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate("/admin/productos")}
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

export default ProductForm;
