// src/pages/admin/ProductDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productsAPI } from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getById(id);
      
      if (response.success && response.data) {
        setProduct(response.data);
        // Seleccionar imagen principal o la primera
        const principal = response.data.imagenes?.find(img => img.es_principal);
        setSelectedImage(principal || response.data.imagenes?.[0] || null);
      } else {
        alert('Producto no encontrado');
        navigate('/admin/productos');
      }
    } catch (error) {
      console.error('Error cargando producto:', error);
      alert('Error al cargar el producto');
      navigate('/admin/productos');
    } finally {
      setLoading(false);
    }
  };

  // Formatear precio
  const formatPrecio = () => {
    if (!product) return '';
    
    if (product.precio_tipo === 'consultar') {
      return 'Consultar precio';
    }
    
    const precio = product.precio_valor?.toLocaleString('es-AR');
    
    if (product.precio_tipo === 'desde') {
      return `Desde $${precio}`;
    }
    
    return `$${precio}`;
  };

  // Formatear tiempo de entrega
  const formatTiempoEntrega = () => {
    if (!product) return '';
    
    const cantidad = product.tiempo_entrega_dias || 3;
    const tipo = product.tiempo_entrega_tipo || 'dias';
    
    const tipoLabel = {
      dias: cantidad === 1 ? 'día' : 'días',
      semanas: cantidad === 1 ? 'semana' : 'semanas',
      horas: cantidad === 1 ? 'hora' : 'horas',
    };
    
    return `${cantidad} ${tipoLabel[tipo] || tipo}`;
  };

  if (loading) {
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

  if (!product) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gris-medio">Producto no encontrado</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/productos')}
            className="text-gris-medio hover:text-secondary transition-colors"
          >
            <i className="fas fa-arrow-left text-xl"></i>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-secondary">{product.titulo}</h2>
            <p className="text-gris-medio">ID: {product.id} | Slug: {product.slug}</p>
          </div>
        </div>
        <Link
          to={`/admin/productos/editar/${product.id}`}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
        >
          <i className="fas fa-edit"></i>
          Editar Producto
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda: Imágenes */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-4">
            {/* Imagen principal */}
            <div className="mb-4">
              {selectedImage ? (
                <img
                  src={selectedImage.url}
                  alt={selectedImage.alt_text || product.titulo}
                  className="w-full h-64 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-64 bg-gris-claro rounded-lg flex items-center justify-center">
                  <i className="fas fa-image text-4xl text-gris-medio"></i>
                </div>
              )}
            </div>

            {/* Miniaturas */}
            {product.imagenes && product.imagenes.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.imagenes.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(img)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage?.id === img.id 
                        ? 'border-primary' 
                        : 'border-transparent hover:border-gris-claro'
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={img.alt_text || ''}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Sin imágenes */}
            {(!product.imagenes || product.imagenes.length === 0) && (
              <p className="text-sm text-gris-medio text-center">
                Sin imágenes
              </p>
            )}
          </div>
        </div>

        {/* Columna derecha: Información */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Estados */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex flex-wrap gap-3">
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                product.activo 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <i className={`fas fa-${product.activo ? 'check' : 'times'}-circle`}></i>
                {product.activo ? 'Activo' : 'Inactivo'}
              </span>
              
              {product.destacado && (
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  <i className="fas fa-star"></i>
                  Destacado
                </span>
              )}
              
              {product.personalizable && (
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  <i className="fas fa-edit"></i>
                  Personalizable
                </span>
              )}

              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                <i className="fas fa-folder"></i>
                {product.categoria?.nombre || 'Sin categoría'}
              </span>
            </div>
          </div>

          {/* Precio y Stock */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 text-secondary flex items-center gap-2">
              <i className="fas fa-dollar-sign text-primary"></i>
              Precio y Disponibilidad
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gris-medio mb-1">Precio</p>
                <p className="text-2xl font-bold text-primary">{formatPrecio()}</p>
                <p className="text-xs text-gris-medio">
                  Tipo: {product.precio_tipo === 'fijo' ? 'Fijo' : product.precio_tipo === 'desde' ? 'Desde' : 'Consultar'}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gris-medio mb-1">Stock disponible</p>
                <p className={`text-2xl font-bold ${
                  (product.cantidad || 0) > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {product.cantidad || 0} unidades
                </p>
              </div>

              <div>
                <p className="text-sm text-gris-medio mb-1">Tiempo de entrega</p>
                <p className="text-2xl font-bold text-secondary">
                  {formatTiempoEntrega()}
                </p>
              </div>
            </div>
          </div>

          {/* Detalles del producto */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 text-secondary flex items-center gap-2">
              <i className="fas fa-list-alt text-primary"></i>
              Detalles del Producto
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <i className="fas fa-tree text-primary mt-1"></i>
                <div>
                  <p className="text-sm text-gris-medio">Material</p>
                  <p className="font-medium text-texto">{product.material || 'No especificado'}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <i className="fas fa-ruler-combined text-primary mt-1"></i>
                <div>
                  <p className="text-sm text-gris-medio">Medidas</p>
                  <p className="font-medium text-texto">{product.medidas || 'No especificado'}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <i className="fas fa-tint text-primary mt-1"></i>
                <div>
                  <p className="text-sm text-gris-medio">Capacidad</p>
                  <p className="font-medium text-texto">{product.capacidad || 'No especificado'}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <i className="fas fa-palette text-primary mt-1"></i>
                <div>
                  <p className="text-sm text-gris-medio">Colores disponibles</p>
                  <p className="font-medium text-texto">{product.colores || 'No especificado'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 text-secondary flex items-center gap-2">
              <i className="fas fa-align-left text-primary"></i>
              Descripción
            </h3>
            
            {product.descripcion ? (
              <p className="text-texto whitespace-pre-wrap">{product.descripcion}</p>
            ) : (
              <p className="text-gris-medio italic">Sin descripción</p>
            )}
          </div>

          {/* Información adicional */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 text-secondary flex items-center gap-2">
              <i className="fas fa-info-circle text-primary"></i>
              Información Adicional
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gris-medio">ID</p>
                <p className="font-medium text-texto">{product.id}</p>
              </div>
              <div>
                <p className="text-gris-medio">Categoría ID</p>
                <p className="font-medium text-texto">{product.categoria_id}</p>
              </div>
              <div>
                <p className="text-gris-medio">Imágenes</p>
                <p className="font-medium text-texto">{product.imagenes?.length || 0}</p>
              </div>
              <div>
                <p className="text-gris-medio">Slug</p>
                <p className="font-medium text-texto break-all">{product.slug}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ProductDetail;