import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { X, Undo2 } from 'lucide-react';

type Toast = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'undo';
  undoAction?: () => Promise<void>;
  countdown?: number;
};

type ToastContextType = {
  showToast: (message: string, type?: Toast['type']) => void;
  showUndoToast: (message: string, undoAction: () => Promise<void>, seconds?: number) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const showUndoToast = useCallback((message: string, undoAction: () => Promise<void>, seconds: number = 5) => {
    const id = Date.now().toString();
    let countdown = seconds;
    
    setToasts(prev => [...prev, { id, message, type: 'undo', undoAction, countdown }]);

    // Countdown timer
    const countdownInterval = setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        setToasts(prev => prev.filter(t => t.id !== id));
      } else {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, countdown } : t));
      }
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleUndo = async (toast: Toast) => {
    if (toast.undoAction) {
      try {
        await toast.undoAction();
        removeToast(toast.id);
        showToast('Action undone', 'success');
      } catch {
        showToast('Failed to undo', 'error');
      }
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, showUndoToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-md text-white animate-slide-up ${
              toast.type === 'success' ? 'bg-green-600' :
              toast.type === 'error' ? 'bg-red-600' :
              toast.type === 'undo' ? 'bg-gray-800' : 'bg-blue-600'
            }`}
          >
            <span className="flex-1">{toast.message}</span>
            {toast.type === 'undo' && toast.undoAction && (
              <>
                <button
                  onClick={() => handleUndo(toast)}
                  className="flex items-center gap-1 px-2 py-1 bg-white/20 rounded hover:bg-white/30 text-sm font-medium"
                >
                  <Undo2 size={14} /> Undo ({toast.countdown}s)
                </button>
              </>
            )}
            <button onClick={() => removeToast(toast.id)} className="hover:opacity-70">
              <X size={18} />
            </button>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.2s ease-out; }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
