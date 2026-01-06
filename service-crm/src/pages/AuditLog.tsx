import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { History, Filter, User, Calendar } from 'lucide-react';

type AuditEntry = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  user_id: string;
  user_email: string;
  details: Record<string, any>;
  ip_address: string;
  created_at: string;
};

export default function AuditLog() {
  const { tenant } = useTenant();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  useEffect(() => {
    if (tenant) fetchAuditLog();
  }, [tenant]);

  const fetchAuditLog = async () => {
    let query = supabase
      .from('audit_log')
      .select('*')
      .eq('tenant_id', tenant!.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (filterType !== 'all') {
      query = query.eq('entity_type', filterType);
    }

    const { data } = await query;
    setEntries(data || []);
    setLoading(false);
  };

  const getActionColor = (action: string) => {
    if (action.includes('create')) return 'bg-green-100 text-green-800';
    if (action.includes('update')) return 'bg-blue-100 text-blue-800';
    if (action.includes('delete')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const entityTypes = ['all', ...new Set(entries.map(e => e.entity_type))];

  if (!tenant) return <div className="p-8 text-center text-gray-500">Select a business first</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <div className="flex gap-2">
          <select value={filterType} onChange={e => { setFilterType(e.target.value); fetchAuditLog(); }} className="border rounded-lg px-3 py-2 text-sm">
            {entityTypes.map(t => (
              <option key={t} value={t}>{t === 'all' ? 'All Types' : t}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <History size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No audit log entries</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="divide-y divide-gray-200">
            {entries.map(entry => (
              <div key={entry.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-1 rounded ${getActionColor(entry.action)}`}>{entry.action}</span>
                      <span className="text-sm text-gray-600">{entry.entity_type}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><User size={14} /> {entry.user_email}</span>
                      {entry.ip_address && <span>IP: {entry.ip_address}</span>}
                    </div>
                    {entry.details && Object.keys(entry.details).length > 0 && (
                      <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                        {JSON.stringify(entry.details, null, 2)}
                      </pre>
                    )}
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(entry.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
