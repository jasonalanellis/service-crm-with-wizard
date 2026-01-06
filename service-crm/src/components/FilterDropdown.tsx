import { useState } from 'react';
import { Filter, ChevronDown, X } from 'lucide-react';

type Props = {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
};

export default function FilterDropdown({ label, options, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${
          value ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-600' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
      >
        <Filter size={14} />
        <span>{selected?.label || label}</span>
        {value ? (
          <button onClick={e => { e.stopPropagation(); onChange(''); }} className="hover:text-blue-800">
            <X size={14} />
          </button>
        ) : (
          <ChevronDown size={14} />
        )}
      </button>
      
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 py-1 min-w-[160px]">
            <button
              onClick={() => { onChange(''); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${!value ? 'text-blue-600 font-medium' : 'text-gray-700 dark:text-gray-200'}`}
            >
              All
            </button>
            {options.map(option => (
              <button
                key={option.value}
                onClick={() => { onChange(option.value); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${value === option.value ? 'text-blue-600 font-medium' : 'text-gray-700 dark:text-gray-200'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
