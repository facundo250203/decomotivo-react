export const getErrorInfo = (error) => {
  const status = error?.status;

  const map = {
    401: {
      title: 'Sesión expirada',
      message: 'Tu sesión ha vencido. Por favor, volvé a iniciar sesión.',
    },
    403: {
      title: 'Sin permiso',
      message: 'No tenés permisos para realizar esta acción.',
    },
    404: {
      title: 'No encontrado',
      message: 'El recurso que buscás no existe.',
    },
    422: {
      title: 'Datos inválidos',
      message: 'Revisá los datos ingresados e intentá de nuevo.',
    },
    500: {
      title: 'Error del servidor',
      message: 'Ocurrió un error interno. Intentá más tarde.',
    },
  };

  return {
    ...(map[status] || {
      title: 'Error inesperado',
      message: error?.message || 'Ocurrió un error desconocido.',
    }),
    detail: error?.detail || error?.message || String(error),
  };
};