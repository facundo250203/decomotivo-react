// src/services/api.js
// Servicio centralizado para consumir el backend API

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'Error en la respuesta del servidor'
    }));
    const err = new Error(error.message || `HTTP Error: ${response.status}`);
    err.status = response.status;
    err.detail = JSON.stringify(error, null, 2);
    throw err;
  }
  return response.json();
};

// ============================================
// CATEGORÍAS
// ============================================
export const categoriesAPI = {
  // Obtener todas las categorías
  getAll: async () => {
    try {
      const response = await fetch(`${API_URL}/categorias`);
      return handleResponse(response);
    } catch (error) {
      console.error('Error obteniendo categorías:', error);
      throw error;
    }
  },

  // Obtener categoría por slug
  getBySlug: async (slug) => {
    try {
      const response = await fetch(`${API_URL}/categorias/slug/${slug}`);
      return handleResponse(response);
    } catch (error) {
      console.error(`Error obteniendo categoría ${slug}:`, error);
      throw error;
    }
  },

  // Obtener categoría por ID
  getById: async (id) => {
    try {
      const response = await fetch(`${API_URL}/categorias/${id}`);
      return handleResponse(response);
    } catch (error) {
      console.error(`Error obteniendo categoría ${id}:`, error);
      throw error;
    }
  }
};

// ============================================
// PRODUCTOS
// ============================================
export const productsAPI = {
  // Obtener todos los productos
  getAll: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.offset) params.append('offset', filters.offset);
      if (filters.en_oferta) params.append('en_oferta', 'true');
      if (filters.combo) params.append('combo', 'true');

      const response = await fetch(`${API_URL}/productos?${params}`);
      return handleResponse(response);
    } catch (error) {
      console.error('Error obteniendo productos:', error);
      throw error;
    }
  },

  // Obtener producto por slug
  getBySlug: async (slug) => {
    try {
      const response = await fetch(`${API_URL}/productos/slug/${slug}`);
      return handleResponse(response);
    } catch (error) {
      console.error(`Error obteniendo producto ${slug}:`, error);
      throw error;
    }
  },

  // Obtener productos por categoría
  getByCategory: async (categoryId) => {
    try {
      const response = await fetch(`${API_URL}/productos/categoria/${categoryId}`);
      return handleResponse(response);
    } catch (error) {
      console.error(`Error obteniendo productos de categoría ${categoryId}:`, error);
      throw error;
    }
  },

  // Obtener productos destacados
  getFeatured: async (limit = 6) => {
    try {
      const response = await fetch(`${API_URL}/productos/destacados?limit=${limit}`);
      return handleResponse(response);
    } catch (error) {
      console.error('Error obteniendo productos destacados:', error);
      throw error;
    }
  },

  // Obtener producto por ID
  getById: async (id) => {
    try {
      const response = await fetch(`${API_URL}/productos/${id}`);
      return handleResponse(response);
    } catch (error) {
      console.error(`Error obteniendo producto ${id}:`, error);
      throw error;
    }
  }
};

// ============================================
// AUTENTICACIÓN (para admin)
// ============================================
export const authAPI = {
  // Login
  login: async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  },

  // Verificar token
  verify: async (token) => {
    try {
      const response = await fetch(`${API_URL}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error verificando token:', error);
      throw error;
    }
  }
};

// ============================================
// ADMIN - PRODUCTOS (requiere autenticación)
// ============================================
export const adminProductsAPI = {
  // Crear producto
  create: async (productData, token) => {
    try {
      const response = await fetch(`${API_URL}/admin/productos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error creando producto:', error);
      throw error;
    }
  },

  // Actualizar producto
  update: async (id, productData, token) => {
    try {
      const response = await fetch(`${API_URL}/admin/productos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error actualizando producto ${id}:`, error);
      throw error;
    }
  },

  // Eliminar producto (soft delete)
  delete: async (id, token) => {
    try {
      const response = await fetch(`${API_URL}/admin/productos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error eliminando producto ${id}:`, error);
      throw error;
    }
  },

// Obtener todos los productos (incluyendo inactivos)
  getAll: async (token) => {
    try {
      const response = await fetch(`${API_URL}/admin/productos`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error obteniendo productos admin:', error);
      throw error;
    }
  },

  // Obtener un producto por ID (sin filtro de activo/visible_publico, a
  // diferencia de productsAPI.getById)
  getById: async (id, token) => {
    try {
      const response = await fetch(`${API_URL}/admin/productos/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error obteniendo producto admin ${id}:`, error);
      throw error;
    }
  },

  // Subir imagen de producto
  uploadImage: async (productId, formData, token) => {
    try {
      const response = await fetch(`${API_URL}/admin/productos/${productId}/imagenes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData, // FormData con la imagen
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error subiendo imagen para producto ${productId}:`, error);
      throw error;
    }
  },

  // Eliminar imagen de producto
  deleteImage: async (productId, imageId, token) => {
    try {
      const response = await fetch(`${API_URL}/admin/productos/${productId}/imagenes/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error eliminando imagen ${imageId}:`, error);
      throw error;
    }
  },

  // Crear variante (medida con precio/stock propios)
  createVariante: async (productId, varianteData, token) => {
    try {
      const response = await fetch(`${API_URL}/admin/productos/${productId}/variantes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(varianteData),
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error creando variante para producto ${productId}:`, error);
      throw error;
    }
  },

  // Actualizar variante
  updateVariante: async (productId, varianteId, varianteData, token) => {
    try {
      const response = await fetch(`${API_URL}/admin/productos/${productId}/variantes/${varianteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(varianteData),
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error actualizando variante ${varianteId}:`, error);
      throw error;
    }
  },

  // Eliminar variante (soft delete)
  deleteVariante: async (productId, varianteId, token) => {
    try {
      const response = await fetch(`${API_URL}/admin/productos/${productId}/variantes/${varianteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error eliminando variante ${varianteId}:`, error);
      throw error;
    }
  },

  // Listar la receta de un combo (ver migración 021)
  getComboItems: async (comboId, token) => {
    try {
      const response = await fetch(`${API_URL}/admin/productos/${comboId}/combo-items`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error obteniendo items de combo para producto ${comboId}:`, error);
      throw error;
    }
  },

  // Agregar componente a la receta de un combo (ver migración 021)
  createComboItem: async (comboId, comboItemData, token) => {
    try {
      const response = await fetch(`${API_URL}/admin/productos/${comboId}/combo-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(comboItemData),
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error creando item de combo para producto ${comboId}:`, error);
      throw error;
    }
  },

  // Actualizar componente de la receta
  updateComboItem: async (comboId, comboItemId, comboItemData, token) => {
    try {
      const response = await fetch(`${API_URL}/admin/productos/${comboId}/combo-items/${comboItemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(comboItemData),
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error actualizando item de combo ${comboItemId}:`, error);
      throw error;
    }
  },

  // Quitar componente de la receta (hard delete -- ver productoComboController.js)
  deleteComboItem: async (comboId, comboItemId, token) => {
    try {
      const response = await fetch(`${API_URL}/admin/productos/${comboId}/combo-items/${comboItemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error eliminando item de combo ${comboItemId}:`, error);
      throw error;
    }
  }
};

// ============================================
// HELPER: Formatear precio
// ============================================
export const formatPrice = (price) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

// ============================================
// EXPORTAR TODO
// ============================================
export default {
  categories: categoriesAPI,
  products: productsAPI,
  auth: authAPI,
  adminProducts: adminProductsAPI,
  formatPrice
};

export const adminOrdersAPI = {
  // Obtener todos los pedidos
  getAll: async (filters = {}, token) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.estado) params.append('estado', filters.estado);
      if (filters.desde) params.append('desde', filters.desde);
      if (filters.hasta) params.append('hasta', filters.hasta);
      if (filters.cliente_id) params.append('cliente_id', filters.cliente_id);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.offset) params.append('offset', filters.offset);

      const response = await fetch(`${API_URL}/pedidos?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error obteniendo pedidos:', error);
      throw error;
    }
  },

  // Obtener pedido por ID
  getById: async (id, token) => {
    try {
      const response = await fetch(`${API_URL}/pedidos/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error obteniendo pedido ${id}:`, error);
      throw error;
    }
  },

  // Crear nuevo pedido
  create: async (orderData, token) => {
    try {
      const response = await fetch(`${API_URL}/pedidos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error creando pedido:', error);
      throw error;
    }
  },

  // Actualizar pedido
  update: async (id, orderData, token) => {
    try {
      const response = await fetch(`${API_URL}/pedidos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error actualizando pedido ${id}:`, error);
      throw error;
    }
  },

  // Actualizar estado del pedido (extra: { monto_efectivo, monto_transferencia } al señar)
  updateStatus: async (id, estado, extra = {}, token) => {
    try {
      const response = await fetch(`${API_URL}/pedidos/${id}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ estado, ...extra }),
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error actualizando estado del pedido ${id}:`, error);
      throw error;
    }
  },

  // Registrar un pago adicional sobre un pedido ya señado
  registerPayment: async (id, pagoData, token) => {
    try {
      const response = await fetch(`${API_URL}/pedidos/${id}/pagos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(pagoData),
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error registrando pago del pedido ${id}:`, error);
      throw error;
    }
  },

  // Eliminar pedido
  delete: async (id, token) => {
    try {
      const response = await fetch(`${API_URL}/pedidos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error eliminando pedido ${id}:`, error);
      throw error;
    }
  },

  // Obtener estadísticas de pedidos
  getStats: async (token) => {
    try {
      const response = await fetch(`${API_URL}/pedidos/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }
};

// ============================================
// VENTAS (libro de caja diario) - requiere autenticación
// ============================================
export const ventasAPI = {
  // Listar ventas (filtros: desde, hasta, pedido_id, cliente_id)
  getAll: async (filters = {}, token) => {
    try {
      const params = new URLSearchParams();
      if (filters.desde) params.append('desde', filters.desde);
      if (filters.hasta) params.append('hasta', filters.hasta);
      if (filters.pedido_id) params.append('pedido_id', filters.pedido_id);
      if (filters.cliente_id) params.append('cliente_id', filters.cliente_id);

      const response = await fetch(`${API_URL}/ventas?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error obteniendo ventas:', error);
      throw error;
    }
  },

  // Obtener venta por ID (con items si es venta directa)
  getById: async (id, token) => {
    try {
      const response = await fetch(`${API_URL}/ventas/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error obteniendo venta ${id}:`, error);
      throw error;
    }
  },

  // Crear venta directa de mostrador
  createDirecta: async (ventaData, token) => {
    try {
      const response = await fetch(`${API_URL}/ventas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(ventaData),
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error creando venta directa:', error);
      throw error;
    }
  },

  // Resumen diario de caja
  getResumenDiario: async (fecha, token) => {
    try {
      const response = await fetch(`${API_URL}/ventas/resumen?fecha=${fecha}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error obteniendo resumen diario:', error);
      throw error;
    }
  }
};

// ============================================
// PROVEEDORES - requiere autenticación
// ============================================
export const proveedoresAPI = {
  getAll: async (token) => {
    try {
      const response = await fetch(`${API_URL}/proveedores`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error obteniendo proveedores:', error);
      throw error;
    }
  },

  getById: async (id, token) => {
    try {
      const response = await fetch(`${API_URL}/proveedores/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error obteniendo proveedor ${id}:`, error);
      throw error;
    }
  },

  create: async (proveedorData, token) => {
    try {
      const response = await fetch(`${API_URL}/proveedores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(proveedorData),
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error creando proveedor:', error);
      throw error;
    }
  },

  update: async (id, proveedorData, token) => {
    try {
      const response = await fetch(`${API_URL}/proveedores/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(proveedorData),
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error actualizando proveedor ${id}:`, error);
      throw error;
    }
  },

  delete: async (id, token) => {
    try {
      const response = await fetch(`${API_URL}/proveedores/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error eliminando proveedor ${id}:`, error);
      throw error;
    }
  }
};

// ============================================
// COMPRAS - requiere autenticación
// ============================================
export const comprasAPI = {
  getAll: async (filters = {}, token) => {
    try {
      const params = new URLSearchParams();
      if (filters.desde) params.append('desde', filters.desde);
      if (filters.hasta) params.append('hasta', filters.hasta);
      if (filters.proveedor_id) params.append('proveedor_id', filters.proveedor_id);

      const response = await fetch(`${API_URL}/compras?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error obteniendo compras:', error);
      throw error;
    }
  },

  getById: async (id, token) => {
    try {
      const response = await fetch(`${API_URL}/compras/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error obteniendo compra ${id}:`, error);
      throw error;
    }
  },

  create: async (compraData, token) => {
    try {
      const response = await fetch(`${API_URL}/compras`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(compraData),
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error creando compra:', error);
      throw error;
    }
  }
};

// ============================================
// CAJA - saldo neto (ventas - compras reales) - requiere autenticación
// ============================================
export const cajaAPI = {
  getSaldo: async (filters = {}, token) => {
    try {
      const params = new URLSearchParams();
      if (filters.desde) params.append('desde', filters.desde);
      if (filters.hasta) params.append('hasta', filters.hasta);

      const response = await fetch(`${API_URL}/caja/saldo?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error obteniendo saldo de caja:', error);
      throw error;
    }
  },

  getCierres: async (token) => {
    try {
      const response = await fetch(`${API_URL}/caja/cierres`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error obteniendo cierres de caja:', error);
      throw error;
    }
  },

  getUltimoCierre: async (token) => {
    try {
      const response = await fetch(`${API_URL}/caja/cierres/ultimo`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error obteniendo el último cierre de caja:', error);
      throw error;
    }
  },

  crearCierre: async (cierreData, token) => {
    try {
      const response = await fetch(`${API_URL}/caja/cierres`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(cierreData),
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error cerrando caja:', error);
      throw error;
    }
  }
};

// ============================================
// GASTOS (salidas de dinero: servicios, retiros, etc.) - requiere autenticación
// ============================================
export const gastosAPI = {
  getAll: async (filters = {}, token) => {
    try {
      const params = new URLSearchParams();
      if (filters.desde) params.append('desde', filters.desde);
      if (filters.hasta) params.append('hasta', filters.hasta);

      const response = await fetch(`${API_URL}/gastos?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error obteniendo gastos:', error);
      throw error;
    }
  },

  getById: async (id, token) => {
    try {
      const response = await fetch(`${API_URL}/gastos/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error obteniendo gasto ${id}:`, error);
      throw error;
    }
  },

  create: async (gastoData, token) => {
    try {
      const response = await fetch(`${API_URL}/gastos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(gastoData),
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error creando gasto:', error);
      throw error;
    }
  },

  update: async (id, gastoData, token) => {
    try {
      const response = await fetch(`${API_URL}/gastos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(gastoData),
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error actualizando gasto ${id}:`, error);
      throw error;
    }
  },

  delete: async (id, token) => {
    try {
      const response = await fetch(`${API_URL}/gastos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error eliminando gasto ${id}:`, error);
      throw error;
    }
  }
};

// ============================================
// CLIENTES - requiere autenticación
// ============================================
export const clientesAPI = {
  getAll: async (token) => {
    try {
      const response = await fetch(`${API_URL}/clientes`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error obteniendo clientes:', error);
      throw error;
    }
  },

  getById: async (id, token) => {
    try {
      const response = await fetch(`${API_URL}/clientes/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error obteniendo cliente ${id}:`, error);
      throw error;
    }
  },

  create: async (clienteData, token) => {
    try {
      const response = await fetch(`${API_URL}/clientes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(clienteData),
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error creando cliente:', error);
      throw error;
    }
  },

  update: async (id, clienteData, token) => {
    try {
      const response = await fetch(`${API_URL}/clientes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(clienteData),
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error actualizando cliente ${id}:`, error);
      throw error;
    }
  },

  delete: async (id, token) => {
    try {
      const response = await fetch(`${API_URL}/clientes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error eliminando cliente ${id}:`, error);
      throw error;
    }
  },

  // Saldo (deudor/a favor) + historial de movimientos del cliente
  getCuentaCorriente: async (id, token) => {
    try {
      const response = await fetch(`${API_URL}/clientes/${id}/cuenta-corriente`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error obteniendo cuenta corriente del cliente ${id}:`, error);
      throw error;
    }
  },

  // Registrar un pago suelto del cliente contra su deuda
  registrarPago: async (id, pagoData, token) => {
    try {
      const response = await fetch(`${API_URL}/clientes/${id}/pagos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(pagoData),
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error registrando pago del cliente ${id}:`, error);
      throw error;
    }
  }
};

// ============================================
// REPORTES (KPIs para el dashboard) - requiere autenticación
// ============================================
export const reportesAPI = {
  getResumen: async (filters = {}, token) => {
    try {
      const params = new URLSearchParams();
      if (filters.desde) params.append('desde', filters.desde);
      if (filters.hasta) params.append('hasta', filters.hasta);

      const response = await fetch(`${API_URL}/reportes/resumen?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error obteniendo el resumen de reportes:', error);
      throw error;
    }
  }
};