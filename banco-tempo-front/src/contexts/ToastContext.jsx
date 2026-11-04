import { useState, useCallback, useMemo, useRef } from 'react';
import ToastContainer from '../components/ui/ToastContainer';
import { ToastContext } from './toastContexto';

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const proximoId = useRef(0);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info') => {
    proximoId.current += 1;
    const id = proximoId.current;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  // Valor estável: as páginas que usam o toast como dependência não refazem requisições a cada aviso.
  const value = useMemo(() => ({
    success: (message) => addToast(message, 'success'),
    error: (message) => addToast(message, 'error'),
    info: (message) => addToast(message, 'info'),
  }), [addToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};
