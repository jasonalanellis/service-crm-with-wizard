import { ReactNode } from 'react';

type Column<T> = {
  key: keyof T | string;
  label: string;
  render?: (item: T) => ReactNode;
  className?: string;
  hideOnMobile?: boolean;
};

type Props<T> = {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  keyExtractor: (item: T) => string;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectChange?: (ids: string[]) => void;
};

export default function ResponsiveTable<T>({ 
  data, 
  columns, 
  onRowClick, 
  keyExtractor,
  selectable,
  selectedIds = [],
  onSelectChange
}: Props<T>) {
  const toggleAll = () => {
    if (selectedIds.length === data.length) {
      onSelectChange?.([]);
    } else {
      onSelectChange?.(data.map(keyExtractor));
    }
  };

  const toggleOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectChange?.(selectedIds.filter(i => i !== id));
    } else {
      onSelectChange?.([...selectedIds, id]);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              {selectable && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === data.length && data.length > 0}
                    onChange={toggleAll}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                </th>
              )}
              {columns.map(col => (
                <th
                  key={String(col.key)}
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${col.className || ''}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.map(item => {
              const id = keyExtractor(item);
              return (
                <tr
                  key={id}
                  onClick={() => onRowClick?.(item)}
                  className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : ''} ${selectedIds.includes(id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                >
                  {selectable && (
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(id)}
                        onChange={() => toggleOne(id)}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                    </td>
                  )}
                  {columns.map(col => (
                    <td key={String(col.key)} className={`px-4 py-3 text-sm text-gray-900 dark:text-gray-100 ${col.className || ''}`}>
                      {col.render ? col.render(item) : String((item as any)[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
        {data.map(item => {
          const id = keyExtractor(item);
          return (
            <div
              key={id}
              onClick={() => onRowClick?.(item)}
              className={`p-4 ${onRowClick ? 'cursor-pointer active:bg-gray-50 dark:active:bg-gray-700' : ''} ${selectedIds.includes(id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
            >
              {selectable && (
                <div className="flex items-center gap-3 mb-2" onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(id)}
                    onChange={() => toggleOne(id)}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-xs text-gray-500">Select</span>
                </div>
              )}
              {columns.filter(c => !c.hideOnMobile).map((col, idx) => (
                <div key={String(col.key)} className={idx === 0 ? 'font-medium text-gray-900 dark:text-white' : 'text-sm text-gray-600 dark:text-gray-300 mt-1'}>
                  {idx > 0 && <span className="text-gray-400 mr-1">{col.label}:</span>}
                  {col.render ? col.render(item) : String((item as any)[col.key] ?? '')}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
