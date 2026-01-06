import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { Clock, CheckCircle, Send, Plus } from 'lucide-react';

type FollowUp = {
  id: string;
  customer_id: string;
  appointment_id: string | null;
  type: 'review_request' | 'rebooking' | 'feedback' | 'custom';
  status: 'scheduled' | 'sent' | 'completed';
  scheduled_for: string;
  message: string;
  created_at: string;
  customer?: { name: string; email: string; phone: string };
};

export default function FollowUps() {
  const { tenant } = useTenant();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'sent' | 'completed'>('all');

  useEffect(() => {
    if (tenant) fetchFollowUps();
  }, [tenant]);

  const fetchFollowUps = async () => {
    const { data } = await supabase
      .from('follow_ups')
      .select(`*, customer:customers(name, email, phone)`)
      .eq('tenant_id', tenant!.id)
      .order('scheduled_for', { ascending: true });
    setFollowUps(data || []);
    setLoading(false);
  };

  const sendFollowUp = async (id: string) => {
    await supabase.from('follow_ups').update({ status: 'sent' }).eq('id', id);
    fetchFollowUps();
  };

  const markComplete = async (id: string) => {
    await supabase.from('follow_ups').update({ status: 'completed' }).eq('id', id);
    fetchFollowUps();
  };

  const filtered = filter === 'all' ? followUps : followUps.filter(f => f.status === filter);

  if (!tenant) return <div className="p-8 text-center text-gray-500">Select a business first</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Automated Follow-Ups</h1>
      </div>

      <div className="flex gap-2 mb-6">
        {(['all', 'scheduled', 'sent', 'completed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Clock size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No follow-ups found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(followUp => {
            const customer = Array.isArray(followUp.customer) ? followUp.customer[0] : followUp.customer;
            return (
              <div key={followUp.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-1 rounded ${
                        followUp.type === 'review_request' ? 'bg-purple-100 text-purple-800' :
                        followUp.type === 'rebooking' ? 'bg-blue-100 text-blue-800' :
                        followUp.type === 'feedback' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>{followUp.type.replace('_', ' ')}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        followUp.status === 'completed' ? 'bg-green-100 text-green-800' :
                        followUp.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>{followUp.status}</span>
                    </div>
                    <h3 className="font-medium text-gray-900">{customer?.name}</h3>
                    <p className="text-sm text-gray-500">{customer?.email}</p>
                    <p className="text-sm text-gray-600 mt-2">{followUp.message}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Scheduled for</p>
                    <p className="text-sm font-medium">{new Date(followUp.scheduled_for).toLocaleString()}</p>
                    <div className="mt-2 flex gap-2 justify-end">
                      {followUp.status === 'scheduled' && (
                        <button onClick={() => sendFollowUp(followUp.id)} className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                          <Send size={14} /> Send Now
                        </button>
                      )}
                      {followUp.status === 'sent' && (
                        <button onClick={() => markComplete(followUp.id)} className="flex items-center gap-1 text-sm text-green-600 hover:underline">
                          <CheckCircle size={14} /> Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
