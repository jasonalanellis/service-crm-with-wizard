import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

type Props = {
  onChange: (range: { from: string; to: string }) => void;
};

const presets = [
  { label: 'Today', days: 0 },
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'This year', days: 365 },
];

export default function DateRangePicker({ onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState('Last 30 days');

  const handleSelect = (label: string, days: number) => {
    setSelected(label);
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    onChange({ from: from.toISOString(), to: to.toISOString() });
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        <Calendar size={16} />
        <span>{selected}</span>
        <ChevronDown size={14} />
      </button>
      
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 py-1 min-w-[140px]">
            {presets.map(preset => (
              <button
                key={preset.label}
                onClick={() => handleSelect(preset.label, preset.days)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  selected === preset.label ? 'text-blue-600 font-medium' : 'text-gray-700 dark:text-gray-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
