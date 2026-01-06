import { CheckSquare, Trash2, Tag, Send, X } from 'lucide-react';

type Props = {
  selectedCount: number;
  onClear: () => void;
  actions: { label: string; icon: 'delete' | 'tag' | 'send'; onClick: () => void; danger?: boolean }[];
};

const iconMap = {
  delete: Trash2,
  tag: Tag,
  send: Send,
};

export default function BulkActions({ selectedCount, onClear, actions }: Props) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg shadow-lg px-4 py-3 flex items-center gap-4 z-40">
      <div className="flex items-center gap-2">
        <CheckSquare size={18} className="text-blue-400" />
        <span className="text-sm font-medium">{selectedCount} selected</span>
      </div>
      <div className="h-6 w-px bg-gray-700 dark:bg-gray-600" />
      <div className="flex items-center gap-2">
        {actions.map(action => {
          const Icon = iconMap[action.icon];
          return (
            <button
              key={action.label}
              onClick={action.onClick}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors ${
                action.danger ? 'hover:bg-red-600' : 'hover:bg-gray-700 dark:hover:bg-gray-600'
              }`}
            >
              <Icon size={14} />
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>
      <button onClick={onClear} className="ml-2 p-1 hover:bg-gray-700 dark:hover:bg-gray-600 rounded">
        <X size={16} />
      </button>
    </div>
  );
}
