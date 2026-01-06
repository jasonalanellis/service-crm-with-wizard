import { useState, useEffect, ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

type Props = {
  id: string;
  title: string;
  icon?: ReactNode;
  defaultExpanded?: boolean;
  children: ReactNode;
  className?: string;
};

export default function CollapsibleWidget({ id, title, icon, defaultExpanded = true, children, className = '' }: Props) {
  const [expanded, setExpanded] = useState(() => {
    const saved = localStorage.getItem(`widget_${id}_expanded`);
    return saved !== null ? saved === 'true' : defaultExpanded;
  });

  useEffect(() => {
    localStorage.setItem(`widget_${id}_expanded`, String(expanded));
  }, [id, expanded]);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>
        </div>
        {expanded ? (
          <ChevronUp size={18} className="text-gray-400" />
        ) : (
          <ChevronDown size={18} className="text-gray-400" />
        )}
      </button>
      <div
        className={`transition-all duration-300 overflow-hidden ${expanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
