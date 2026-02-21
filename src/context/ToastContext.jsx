import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type = 'info', title, message, detail = null, duration = 5000 }) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, title, message, detail }]);
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (title, message, detail) => addToast({ type: 'success', title, message, detail }),
    error: (title, message, detail) => addToast({ type: 'error', title, message, detail, duration: 8000 }),
    warning: (title, message, detail) => addToast({ type: 'warning', title, message, detail }),
    info: (title, message, detail) => addToast({ type: 'info', title, message, detail }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

const ToastItem = ({ toast, onRemove }) => {
  const [showDetail, setShowDetail] = useState(false);

  const styles = {
    success: {
      container: 'bg-white border-l-4 border-green-500',
      icon: 'fas fa-check-circle text-green-500',
      title: 'text-green-700',
    },
    error: {
      container: 'bg-white border-l-4 border-red-500',
      icon: 'fas fa-times-circle text-red-500',
      title: 'text-red-700',
    },
    warning: {
      container: 'bg-white border-l-4 border-yellow-500',
      icon: 'fas fa-exclamation-triangle text-yellow-500',
      title: 'text-yellow-700',
    },
    info: {
      container: 'bg-white border-l-4 border-blue-500',
      icon: 'fas fa-info-circle text-blue-500',
      title: 'text-blue-700',
    },
  };

  const s = styles[toast.type] || styles.info;

  return (
    <div className={`${s.container} rounded-lg shadow-lg p-4 animate-slide-in`}>
      <div className="flex items-start gap-3">
        <i className={`${s.icon} text-xl mt-0.5 flex-shrink-0`}></i>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${s.title}`}>{toast.title}</p>
          {toast.message && (
            <p className="text-gray-600 text-sm mt-0.5">{toast.message}</p>
          )}
          {toast.detail && (
            <div className="mt-2">
              <button
                onClick={() => setShowDetail(!showDetail)}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                {showDetail ? 'Ocultar detalle' : 'Ver detalle'}
              </button>
              {showDetail && (
                <pre className="mt-1 text-xs bg-gray-50 p-2 rounded border text-gray-500 overflow-auto max-h-32 whitespace-pre-wrap break-all">
                  {toast.detail}
                </pre>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="text-gray-300 hover:text-gray-500 flex-shrink-0 ml-1"
        >
          <i className="fas fa-times text-sm"></i>
        </button>
      </div>
    </div>
  );
};