import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { FileSignature, Plus, Eye, Download, Send } from 'lucide-react';

type Contract = {
  id: string;
  customer_id: string;
  title: string;
  content: string;
  status: 'draft' | 'sent' | 'signed' | 'expired';
  sent_at: string | null;
  signed_at: string | null;
  expires_at: string | null;
  created_at: string;
  customer?: { name: string; email: string };
};

export default function Contracts() {
  const { tenant } = useTenant();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'sent' | 'signed'>('all');

  useEffect(() => {
    if (tenant) fetchContracts();
  }, [tenant]);

  const fetchContracts = async () => {
    const { data } = await supabase
      .from('contracts')
      .select(`*, customer:customers(name, email)`)
      .eq('tenant_id', tenant!.id)
      .order('created_at', { ascending: false });
    setContracts(data || []);
    setLoading(false);
  };

  const sendContract = async (id: string) => {
    await supabase.from('contracts').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', id);
    fetchContracts();
  };

  const filtered = filter === 'all' ? contracts : contracts.filter(c => c.status === filter);

  const statusColor = (s: string) => {
    switch (s) {
      case 'signed': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!tenant) return <div className="p-8 text-center text-gray-500">Select a business first</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Contracts & Agreements</h1>
      </div>

      <div className="flex gap-2 mb-6">
        {(['all', 'draft', 'sent', 'signed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <FileSignature size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No contracts found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map(contract => {
                const customer = Array.isArray(contract.customer) ? contract.customer[0] : contract.customer;
                return (
                  <tr key={contract.id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{contract.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{customer?.name}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded ${statusColor(contract.status)}`}>{contract.status}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {contract.sent_at ? new Date(contract.sent_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {contract.status === 'draft' && (
                          <button onClick={() => sendContract(contract.id)} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm">
                            <Send size={14} /> Send
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
