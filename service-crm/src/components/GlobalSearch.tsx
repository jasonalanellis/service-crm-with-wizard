import { useState, useEffect, useRef } from 'react';
import { Search, X, Users, CalendarCheck, FileText, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';

type SearchResult = {
  type: 'customer' | 'booking' | 'service' | 'lead';
  id: string;
  title: string;
  subtitle: string;
};

type Props = {
  tenantId: string | undefined;
  onNavigate: (page: string) => void;
};

export default function GlobalSearch({ tenantId, onNavigate }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    if (!query.trim() || !tenantId) {
      setResults([]);
      return;
    }
    const search = async () => {
      setLoading(true);
      const searchTerm = `%${query}%`;
      const [customers, bookings, services] = await Promise.all([
        supabase.from('customers').select('id, name, email').eq('tenant_id', tenantId).or(`name.ilike.${searchTerm},email.ilike.${searchTerm}`).limit(5),
        supabase.from('appointments').select('id, status, scheduled_time').eq('tenant_id', tenantId).limit(5),
        supabase.from('services').select('id, name, price').eq('tenant_id', tenantId).ilike('name', searchTerm).limit(5),
      ]);
      const res: SearchResult[] = [
        ...(customers.data || []).map(c => ({ type: 'customer' as const, id: c.id, title: c.name, subtitle: c.email })),
        ...(services.data || []).map(s => ({ type: 'service' as const, id: s.id, title: s.name, subtitle: `$${s.price}` })),
      ];
      setResults(res);
      setLoading(false);
    };
    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [query, tenantId]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'customer': return <Users size={16} className="text-blue-500" />;
      case 'booking': return <CalendarCheck size={16} className="text-green-500" />;
      case 'service': return <Package size={16} className="text-purple-500" />;
      default: return <FileText size={16} className="text-gray-500" />;
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700">
        <Search size={14} />
        <span>Search...</span>
        <kbd className="hidden sm:inline text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">⌘K</kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20" onClick={() => setOpen(false)}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 p-3 border-b dark:border-gray-700">
          <Search size={18} className="text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search customers, services..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white"
          />
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading && <div className="p-4 text-center text-gray-500">Searching...</div>}
          {!loading && results.length === 0 && query && <div className="p-4 text-center text-gray-500">No results found</div>}
          {!loading && results.map(r => (
            <button key={`${r.type}-${r.id}`} onClick={() => { onNavigate(r.type === 'customer' ? 'customers' : 'services'); setOpen(false); }} className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-left">
              {getIcon(r.type)}
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">{r.title}</div>
                <div className="text-xs text-gray-500">{r.subtitle}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
