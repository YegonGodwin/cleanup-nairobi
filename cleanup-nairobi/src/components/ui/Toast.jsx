import { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle, RefreshCw } from 'lucide-react';

// Toast types
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Toast context for managing toasts globally
let toastId = 0;
let toastListeners = [];

const addToastListener = (listener) => {
  toastListeners.push(listener);
  return () => {
    toastListeners = toastListeners.filter(l => l !== listener);
  };
};

const notifyToastListeners = (toast) => {
  toastListeners.forEach(listener => listener(toast));
};

// Toast API
export const toast = {
  success: (message, options = {}) => {
    const toastData = {
      id: ++toastId,
      type: TOAST_TYPES.SUCCESS,
      message,
      ...options
    };
    notifyToastListeners(toastData);
    return toastData.id;
  },
  
  error: (message, options = {}) => {
    const toastData = {
      id: ++toastId,
      type: TOAST_TYPES.ERROR,
      message,
      duration: 6000, // Longer duration for errors
      ...options
    };
    notifyToastListeners(toastData);
    return toastData.id;
  },
  
  warning: (message, options = {}) => {
    const toastData = {
      id: ++toastId,
      type: TOAST_TYPES.WARNING,
      message,
      ...options
    };
    notifyToastListeners(toastData);
    return toastData.id;
  },
  
  info: (message, options = {}) => {
    const toastData = {
      id: ++toastId,
      type: TOAST_TYPES.INFO,
      message,
      ...options
    };
    notifyToastListeners(toastData);
    return toastData.id;
  },
  
  dismiss: (id) => {
    notifyToastListeners({ id, dismiss: true });
  }
};

// Individual Toast Component
const ToastItem = ({ toast, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (toast.duration !== 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, toast.duration || 4000);
      
      return () => clearTimeout(timer);
    }
  }, [toast.duration]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 300);
  };

  const getToastStyles = () => {
    const baseStyles = "flex items-start p-4 rounded-lg shadow-lg border transition-all duration-300 transform";
    const visibilityStyles = isVisible && !isExiting 
      ? "translate-x-0 opacity-100" 
      : "translate-x-full opacity-0";

    const typeStyles = {
      [TOAST_TYPES.SUCCESS]: "bg-green-50 border-green-200 text-green-800",
      [TOAST_TYPES.ERROR]: "bg-red-50 border-red-200 text-red-800",
      [TOAST_TYPES.WARNING]: "bg-yellow-50 border-yellow-200 text-yellow-800",
      [TOAST_TYPES.INFO]: "bg-blue-50 border-blue-200 text-blue-800"
    };

    return `${baseStyles} ${visibilityStyles} ${typeStyles[toast.type]}`;
  };

  const getIcon = () => {
    const iconProps = { className: "w-5 h-5 flex-shrink-0 mt-0.5" };
    
    switch (toast.type) {
      case TOAST_TYPES.SUCCESS:
        return <CheckCircle {...iconProps} className={`${iconProps.className} text-green-500`} />;
      case TOAST_TYPES.ERROR:
        return <AlertCircle {...iconProps} className={`${iconProps.className} text-red-500`} />;
      case TOAST_TYPES.WARNING:
        return <AlertTriangle {...iconProps} className={`${iconProps.className} text-yellow-500`} />;
      case TOAST_TYPES.INFO:
        return <Info {...iconProps} className={`${iconProps.className} text-blue-500`} />;
      default:
        return <Info {...iconProps} />;
    }
  };

  return (
    <div className={getToastStyles()}>
      {getIcon()}
      
      <div className="ml-3 flex-1">
        <div className="text-sm font-medium">
          {toast.message}
        </div>
        
        {toast.description && (
          <div className="mt-1 text-sm opacity-90">
            {toast.description}
          </div>
        )}
        
        {toast.action && (
          <div className="mt-2">
            <button
              onClick={toast.action.onClick}
              className="text-sm font-medium underline hover:no-underline focus:outline-none"
            >
              {toast.action.label}
            </button>
          </div>
        )}
      </div>

      {toast.showRetry && toast.onRetry && (
        <button
          onClick={toast.onRetry}
          className="ml-2 p-1 rounded hover:bg-black hover:bg-opacity-10 transition-colors"
          title="Retry"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      )}

      <button
        onClick={handleDismiss}
        className="ml-2 p-1 rounded hover:bg-black hover:bg-opacity-10 transition-colors"
        title="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Toast Container Component
export const ToastContainer = ({ position = 'top-right', maxToasts = 5 }) => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const removeListener = addToastListener((toast) => {
      if (toast.dismiss) {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      } else {
        setToasts(prev => {
          const newToasts = [toast, ...prev].slice(0, maxToasts);
          return newToasts;
        });
      }
    });

    return removeListener;
  }, [maxToasts]);

  const handleDismiss = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const getContainerStyles = () => {
    const baseStyles = "fixed z-50 flex flex-col gap-2 p-4 pointer-events-none";
    
    const positionStyles = {
      'top-right': 'top-0 right-0',
      'top-left': 'top-0 left-0',
      'bottom-right': 'bottom-0 right-0',
      'bottom-left': 'bottom-0 left-0',
      'top-center': 'top-0 left-1/2 transform -translate-x-1/2',
      'bottom-center': 'bottom-0 left-1/2 transform -translate-x-1/2'
    };

    return `${baseStyles} ${positionStyles[position]}`;
  };

  if (toasts.length === 0) return null;

  return (
    <div className={getContainerStyles()}>
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem 
            toast={toast} 
            onDismiss={handleDismiss}
          />
        </div>
      ))}
    </div>
  );
};

export default toast;