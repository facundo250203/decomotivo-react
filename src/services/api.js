// src/services/api.js
// Servicio centralizado para consumir el backend API

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// ============================================
// HELPER: Manejo de errores HTTP
// ============================================
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ 
      message: 'Error en la respuesta del servidor' 
    }));
    throw new Error(error.message || `HTTP Error: ${response.status}`);
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
  getAll: async () => {
    try {
      const response = await fetch(`${API_URL}/productos`);
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
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.offset) params.append('offset', filters.offset);

      const response = await fetch(`${API_URL}/admin/pedidos?${params}`, {
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
      const response = await fetch(`${API_URL}/admin/pedidos/${id}`, {
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
      const response = await fetch(`${API_URL}/admin/pedidos`, {
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
      const response = await fetch(`${API_URL}/admin/pedidos/${id}`, {
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

  // Actualizar estado del pedido
  updateStatus: async (id, estado, token) => {
    try {
      const response = await fetch(`${API_URL}/admin/pedidos/${id}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ estado }),
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error actualizando estado del pedido ${id}:`, error);
      throw error;
    }
  },

  // Eliminar pedido
  delete: async (id, token) => {
    try {
      const response = await fetch(`${API_URL}/admin/pedidos/${id}`, {
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
      const response = await fetch(`${API_URL}/admin/pedidos/stats`, {
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