import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { useToast } from '../context/ToastContext';
import { format } from 'date-fns';
import { Clock, Users, Bell, Check, X, Mail, Phone } from 'lucide-react';

interface WaitlistEntry {
  id: string;
  preferred_date: string;
  preferred_time: string;
  notes: string;
  status: string;
  notified_at: string | null;
  created_at: string;
  customer: { first_name: string; last_name: string; email: string; phone: string };
  service: { name: string };
}

export default function Waitlist() {
  const { tenant } = useTenant();
  const { showToast } = useToast();
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tenant) fetchWaitlist();
  }, [tenant]);

  const fetchWaitlist = async () => {
    if (!tenant) return;
    setLoading(true);
    const { data } = await supabase
      .from('waitlist')
      .select('*, customer:customers(first_name, last_name, email, phone), service:services(name)')
      .eq('tenant_id', tenant.id)
      .eq('status', 'waiting')
      .order('created_at', { ascending: false });
    setEntries(data || []);
    setLoading(false);
  };

  const notifyCustomer = async (entry: WaitlistEntry) => {
    // Mark as notified
    await supabase
      .from('waitlist')
      .update({ notified_at: new Date().toISOString() })
      .eq('id', entry.id);
    
    showToast(`Notified ${entry.customer?.first_name}`, 'success');
    fetchWaitlist();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('waitlist').update({ status }).eq('id', id);
    fetchWaitlist();
    showToast('Waitlist updated', 'success');
  };

  if (!tenant) return <div className="p-8 text-gray-500">Please select a business</div>;

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Waitlist</h1>
        <p className="text-gray-500 text-sm">Manage customers waiting for available slots</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-2 mb-1">
            <Users className="text-blue-500" size={20} />
            <span className="text-sm text-gray-500">Total Waiting</span>
          </div>
          <p className="text-2xl font-bold">{entries.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-2 mb-1">
            <Bell className="text-yellow-500" size={20} />
            <span className="text-sm text-gray-500">Notified</span>
          </div>
          <p className="text-2xl font-bold">{entries.filter(e => e.notified_at).length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="text-purple-500" size={20} />
            <span className="text-sm text-gray-500">Avg Wait</span>
          </div>
          <p className="text-2xl font-bold">2.3 days</p>
        </div>
      </div>

      {/* Waitlist Table */}
      <div className="bg-white rounded-lg border">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-600">No one on the waitlist</h3>
            <p className="text-gray-400 text-sm">Customers will appear here when slots are full</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-left text-sm text-gray-500">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Preferred Date</th>
                  <th className="px-4 py-3">Added</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {entries.map(entry => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{entry.customer?.first_name} {entry.customer?.last_name}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1"><Mail size={12} /> {entry.customer?.email}</span>
                        {entry.customer?.phone && (
                          <span className="flex items-center gap-1"><Phone size={12} /> {entry.customer?.phone}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">{entry.service?.name || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      {entry.preferred_date ? format(new Date(entry.preferred_date), 'MMM d, yyyy') : 'Flexible'}
                      {entry.preferred_time && ` at ${entry.preferred_time}`}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {format(new Date(entry.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      {entry.notified_at ? (
                        <span className="flex items-center gap-1 text-green-600 text-sm">
                          <Bell size={14} /> Notified
                        </span>
                      ) : (
                        <span className="text-yellow-600 text-sm">Waiting</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {!entry.notified_at && (
                          <button
                            onClick={() => notifyCustomer(entry)}
                            className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                            title="Notify slot available"
                          >
                            <Bell size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => updateStatus(entry.id, 'booked')}
                          className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200"
                          title="Mark as booked"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => updateStatus(entry.id, 'removed')}
                          className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200"
                          title="Remove from waitlist"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
