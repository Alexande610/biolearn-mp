import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getToastStyle = (type) => {
    switch (type) {
      case 'success':
        return {
          border: 'border-emerald-500/30 bg-emerald-950/40 shadow-emerald-900/20',
          text: 'text-emerald-200',
          icon: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />,
          glow: 'after:bg-emerald-500/20'
        };
      case 'error':
        return {
          border: 'border-red-500/30 bg-red-950/40 shadow-red-900/20',
          text: 'text-red-200',
          icon: <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />,
          glow: 'after:bg-red-500/20'
        };
      case 'warning':
        return {
          border: 'border-yellow-500/30 bg-yellow-950/40 shadow-yellow-900/20',
          text: 'text-yellow-200',
          icon: <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />,
          glow: 'after:bg-yellow-500/20'
        };
      case 'info':
      default:
        return {
          border: 'border-blue-500/30 bg-blue-950/40 shadow-blue-900/20',
          text: 'text-blue-200',
          icon: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
          glow: 'after:bg-blue-500/20'
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Container Toast */}
      <div className="fixed top-4 left-1/2 z-[99999] flex w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 flex-col gap-3 pointer-events-none sm:top-6 md:left-auto md:right-4 md:top-20 md:w-full md:max-w-md md:translate-x-0">
        {toasts.map((toast) => {
          const style = getToastStyle(toast.type);
          return (
            <div
              key={toast.id}
              className={`toast-enter pointer-events-auto relative overflow-hidden flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-xl transition-all duration-300 shadow-2xl ${style.border} ${style.glow} after:absolute after:inset-0 after:z-[-1] after:opacity-10 after:blur-xl`}
            >
              {style.icon}
              <div className="flex-1 text-sm font-medium text-white pr-2 leading-relaxed">
                {toast.message}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-white/40 hover:text-white transition shrink-0 self-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
