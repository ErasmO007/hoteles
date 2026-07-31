import React, { createContext, useContext, useState, useCallback } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, type, duration };

    setToasts((current) => [...current, toast]);

    window.setTimeout(() => removeToast(id), duration);
  }, [removeToast]);

  const styles = {
    success: 'border-green-200 bg-green-50 text-green-700',
    error: 'border-red-200 bg-red-50 text-red-700',
    info: 'border-blue-200 bg-blue-50 text-blue-700',
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex w-[min(92vw,24rem)] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start justify-between rounded-2xl border px-4 py-3 shadow-lg ${styles[toast.type] || styles.info}`}
          >
            <div className="pr-3">
              <p className="text-sm font-semibold">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="rounded-full p-1 transition hover:bg-black/5"
              aria-label="Cerrar notificación"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside a ToastProvider');
  }
  return context;
};
