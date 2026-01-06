import { Download } from 'lucide-react';

type Props = {
  data: Record<string, any>[];
  filename: string;
  columns?: { key: string; label: string }[];
};

export default function ExportButton({ data, filename, columns }: Props) {
  const exportToCSV = () => {
    if (data.length === 0) return;
    
    const cols = columns || Object.keys(data[0]).map(key => ({ key, label: key }));
    const headers = cols.map(c => c.label).join(',');
    const rows = data.map(row => 
      cols.map(c => {
        const val = row[c.key];
        if (val === null || val === undefined) return '';
        const str = String(val).replace(/"/g, '""');
        return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
      }).join(',')
    );
    
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  };

  return (
    <button
      onClick={exportToCSV}
      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
      title="Export to CSV"
    >
      <Download size={16} />
      <span className="hidden sm:inline">Export</span>
    </button>
  );
}
