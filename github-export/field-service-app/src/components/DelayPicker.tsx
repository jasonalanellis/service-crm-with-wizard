import { X } from 'lucide-react';

interface Props {
  onSelect: (minutes: 15 | 30 | 45 | 60) => void;
  onClose: () => void;
  loading: boolean;
}

const options: Array<15 | 30 | 45 | 60> = [15, 30, 45, 60];

export function DelayPicker({ onSelect, onClose, loading }: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50">
      <div className="bg-white w-full rounded-t-2xl p-4 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">How late will you be?</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-gray-500 text-sm mb-4">
          Customer will be notified via SMS
        </p>
        <div className="grid grid-cols-2 gap-3">
          {options.map((mins) => (
            <button
              key={mins}
              onClick={() => onSelect(mins)}
              disabled={loading}
              className="py-4 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-xl font-semibold text-gray-900 disabled:opacity-50 transition-colors"
            >
              {mins} minutes
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full py-4 mt-4 text-gray-500 font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
