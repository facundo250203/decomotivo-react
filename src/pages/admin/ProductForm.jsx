// src/pages/admin/ProductForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { categoriesAPI, productsAPI, adminProductsAPI } from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';

const ProductForm = () => {
  const { id } = useParams(); // Si viene id, es edición
  const navigate = useNavigate();
  const { token } = useAuth();
  const isEditMode = Boolean(id);

  // Estados del formulario
  const [formData, setFormData] = useState({
    titulo: '',
    slug: '',
    descripcion: '',
    categoria_id: '',
    precio_tipo: 'fijo', // 'fijo', 'desde', 'consultar'
    precio_valor: '',
    personalizable: false,
    destacado: false,
    activo: true,
  });

  const [categories, setCategories] = useState([]);
  const [existingImages, setExistingImages] = useState([]); // Imágenes ya guardadas
  const [newImages, setNewImages] = useState([]); // Nuevas imágenes a subir
  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [errors, setErrors] = useState({});

  // Cargar categorías al montar
  useEffect(() => {
    fetchCategories();
    if (isEditMode) {
      fetchProduct();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      if (response.success) {
        setCategories(response.data || []);
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      setLoadingProduct(true);
      const response = await productsAPI.getById(id);
      
      if (response.success && response.data) {
        const product = response.data;
        
        setFormData({
          titulo: product.titulo || '',
          slug: product.slug || '',
          descripcion: product.descripcion || '',
          categoria_id: product.categoria_id || '',
          precio_tipo: product.precio_tipo || 'fijo',
          precio_valor: product.precio_valor || '',
          personalizable: product.personalizable || false,
          destacado: product.destacado || false,
          activo: product.activo !== undefined ? product.activo : true,
        });

        setExistingImages(product.imagenes || []);
      }
    } catch (error) {
      console.error('Error cargando producto:', error);
      alert('Error al cargar el producto');
    } finally {
      setLoadingProduct(false);
    }
  };

  // Manejar cambios en inputs
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Generar slug automáticamente al escribir el título
    if (name === 'titulo' && !isEditMode) {
      const slug = value
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Quitar acentos
        .replace(/[^a-z0-9\s-]/g, '') // Solo letras, números, espacios y guiones
        .replace(/\s+/g, '-') // Espacios a guiones
        .replace(/-+/g, '-') // Múltiples guiones a uno solo
        .replace(/^-|-$/g, ''); // Quitar guiones del inicio/fin

      setFormData(prev => ({ ...prev, slug }));
    }
  };

  // Manejar selección de nuevas imágenes
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // Validar que sean imágenes
    const validImages = files.filter(file => 
      file.type.startsWith('image/')
    );

    if (validImages.length !== files.length) {
      alert('Solo se permiten archivos de imagen');
      return;
    }

    // Crear previews
    const imagePreviews = validImages.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      alt_text: '',
      es_principal: newImages.length === 0 && existingImages.length === 0 // Primera imagen es principal
    }));

    setNewImages(prev => [...prev, ...imagePreviews]);
  };

  // Eliminar imagen nueva (antes de guardar)
  const removeNewImage = (index) => {
    setNewImages(prev => {
      const updated = prev.filter((_, i) => i !== index);
      
      // Si eliminamos la principal, hacer principal la primera que quede
      if (prev[index].es_principal && updated.length > 0) {
        updated[0].es_principal = true;
      }
      
      return updated;
    });
  };

  // Eliminar imagen existente (del servidor)
  const deleteExistingImage = async (imageId) => {
    if (!window.confirm('¿Eliminar esta imagen del servidor?')) {
      return;
    }

    try {
      const response = await adminProductsAPI.deleteImage(id, imageId, token);
      
      if (response.success) {
        setExistingImages(prev => prev.filter(img => img.id !== imageId));
        alert('Imagen eliminada correctamente');
      } else {
        alert('Error al eliminar la imagen: ' + response.error);
      }
    } catch (error) {
      console.error('Error eliminando imagen:', error);
      alert('Error al eliminar la imagen');
    }
  };

  // Marcar como imagen principal
  const setAsPrincipal = (index, isNew = true) => {
    if (isNew) {
      setNewImages(prev => prev.map((img, i) => ({
        ...img,
        es_principal: i === index
      })));
    } else {
      setExistingImages(prev => prev.map((img, i) => ({
        ...img,
        es_principal: i === index
      })));
    }
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

    if (!formData.titulo.trim()) {
      newErrors.titulo = 'El título es obligatorio';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'El slug es obligatorio';
    }

    if (!formData.categoria_id) {
      newErrors.categoria_id = 'Debes seleccionar una categoría';
    }

    if (formData.precio_tipo === 'fijo' || formData.precio_tipo === 'desde') {
      if (!formData.precio_valor || formData.precio_valor <= 0) {
        newErrors.precio_valor = 'El precio debe ser mayor a 0';
      }
    }

    // Validar que haya al menos una imagen
    if (!isEditMode && newImages.length === 0) {
      newErrors.images = 'Debes agregar al menos una imagen';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Guardar producto
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      alert('Por favor corrige los errores del formulario');
      return;
    }

    setLoading(true);

    try {
      // Preparar datos del producto
      const productData = {
        ...formData,
        precio_valor: formData.precio_tipo === 'consultar' ? null : parseFloat(formData.precio_valor),
      };

      let productId;

      if (isEditMode) {
        // Actualizar producto existente
        const response = await adminProductsAPI.update(id, productData, token);
        
        if (!response.success) {
          throw new Error(response.error || 'Error al actualizar el producto');
        }
        
        productId = id;
      } else {
        // Crear nuevo producto
        const response = await adminProductsAPI.create(productData, token);
        
        if (!response.success || !response.data) {
          throw new Error(response.error || 'Error al crear el producto');
        }
        
        productId = response.data.id;
      }

      // Subir nuevas imágenes
      if (newImages.length > 0) {
        for (let i = 0; i < newImages.length; i++) {
          const imageData = newImages[i];
          const formData = new FormData();
          
          formData.append('imagen', imageData.file);
          formData.append('alt_text', imageData.alt_text || '');
          formData.append('es_principal', imageData.es_principal ? 'true' : 'false');

          await adminProductsAPI.uploadImage(productId, formData, token);
        }
      }

      alert(isEditMode ? 'Producto actualizado correctamente' : 'Producto creado correctamente');
      navigate('/admin/productos');
      
    } catch (error) {
      console.error('Error guardando producto:', error);
      alert('Error al guardar el producto: ' + error.message);
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
            {isEditMode ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <p className="text-gris-medio">
            {isEditMode 
              ? 'Modifica los datos del producto'
              : 'Completa los datos para crear un nuevo producto'
            }
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 text-secondary">Información Básica</h3>
            
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
                    errors.titulo ? 'border-red-500' : 'border-gris-claro'
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
                    errors.slug ? 'border-red-500' : 'border-gris-claro'
                  }`}
                  placeholder="mate-algarrobo-personalizado"
                />
                {errors.slug && (
                  <p className="text-red-500 text-sm mt-1">{errors.slug}</p>
                )}
                <p className="text-xs text-gris-medio mt-1">
                  Se genera automáticamente del título (puedes modificarlo)
                </p>
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
                  placeholder="Describe el producto detalladamente..."
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-texto mb-2">
                  Categoría *
                </label>
                <select
                  name="categoria_id"
                  value={formData.categoria_id}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.categoria_id ? 'border-red-500' : 'border-gris-claro'
                  }`}
                >
                  <option value="">Selecciona una categoría</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
                {errors.categoria_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.categoria_id}</p>
                )}
              </div>

              {/* Tipo de Precio */}
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
                  <option value="desde">Desde (precio base)</option>
                  <option value="consultar">Consultar</option>
                </select>
              </div>

              {/* Precio Valor */}
              {(formData.precio_tipo === 'fijo' || formData.precio_tipo === 'desde') && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-texto mb-2">
                    Precio (ARS) *
                  </label>
                  <input
                    type="number"
                    name="precio_valor"
                    value={formData.precio_valor}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.precio_valor ? 'border-red-500' : 'border-gris-claro'
                    }`}
                    placeholder="25000"
                  />
                  {errors.precio_valor && (
                    <p className="text-red-500 text-sm mt-1">{errors.precio_valor}</p>
                  )}
                </div>
              )}
            </div>

            {/* Checkboxes */}
            <div className="mt-6 space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="personalizable"
                  checked={formData.personalizable}
                  onChange={handleInputChange}
                  className="mr-2 h-4 w-4 text-primary focus:ring-primary border-gris-claro rounded"
                />
                <span className="text-sm text-texto">Producto personalizable</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="destacado"
                  checked={formData.destacado}
                  onChange={handleInputChange}
                  className="mr-2 h-4 w-4 text-primary focus:ring-primary border-gris-claro rounded"
                />
                <span className="text-sm text-texto">Producto destacado (aparece en inicio)</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="activo"
                  checked={formData.activo}
                  onChange={handleInputChange}
                  className="mr-2 h-4 w-4 text-primary focus:ring-primary border-gris-claro rounded"
                />
                <span className="text-sm text-texto">Producto activo (visible en tienda)</span>
              </label>
            </div>
          </div>

          {/* Imágenes */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 text-secondary">Imágenes del Producto</h3>
            
            {/* Imágenes Existentes */}
            {existingImages.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-texto mb-3">Imágenes actuales</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {existingImages.map((img, index) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.url}
                        alt={img.alt_text}
                        className="w-full h-32 object-cover rounded-lg border-2 border-gris-claro"
                      />
                      
                      {img.es_principal && (
                        <span className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded">
                          Principal
                        </span>
                      )}

                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                        {!img.es_principal && (
                          <button
                            type="button"
                            onClick={() => setAsPrincipal(index, false)}
                            className="bg-primary text-white px-3 py-1 rounded text-sm hover:bg-primary-dark"
                          >
                            Hacer principal
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteExistingImage(img.id)}
                          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nuevas Imágenes */}
            {newImages.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-texto mb-3">Nuevas imágenes a subir</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {newImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img.preview}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg border-2 border-gris-claro"
                      />
                      
                      {img.es_principal && (
                        <span className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded">
                          Principal
                        </span>
                      )}

                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                        {!img.es_principal && (
                          <button
                            type="button"
                            onClick={() => setAsPrincipal(index, true)}
                            className="bg-primary text-white px-3 py-1 rounded text-sm hover:bg-primary-dark"
                          >
                            Hacer principal
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botón para agregar imágenes */}
            <div>
              <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
                <i className="fas fa-upload mr-2"></i>
                Agregar Imágenes
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gris-medio mt-2">
                Formatos aceptados: JPG, PNG, GIF, WEBP. Recomendado: 800x800px
              </p>
              {errors.images && (
                <p className="text-red-500 text-sm mt-2">{errors.images}</p>
              )}
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  {isEditMode ? 'Actualizando...' : 'Creando...'}
                </>
              ) : (
                <>
                  <i className={`fas ${isEditMode ? 'fa-save' : 'fa-plus'} mr-2`}></i>
                  {isEditMode ? 'Actualizar Producto' : 'Crear Producto'}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin/productos')}
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