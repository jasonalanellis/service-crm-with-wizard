import { AlertTriangle, X } from 'lucide-react';

type Props = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: Props) {
  if (!isOpen) return null;

  const colors = {
    danger: { bg: 'bg-red-600 hover:bg-red-700', icon: 'text-red-600' },
    warning: { bg: 'bg-yellow-600 hover:bg-yellow-700', icon: 'text-yellow-600' },
    info: { bg: 'bg-blue-600 hover:bg-blue-700', icon: 'text-blue-600' },
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-full ${variant === 'danger' ? 'bg-red-100 dark:bg-red-900/30' : variant === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
              <AlertTriangle className={colors[variant].icon} size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{message}</p>
            </div>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <X size={20} />
            </button>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg ${colors[variant].bg}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
