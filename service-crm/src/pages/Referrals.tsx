import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { Users, Gift, Copy, Check } from 'lucide-react';

type Referral = {
  id: string;
  referrer_customer_id: string;
  referred_customer_id: string | null;
  referral_code: string;
  status: 'pending' | 'completed' | 'rewarded';
  reward_type: string;
  reward_value: number;
  created_at: string;
  referrer?: { name: string; email: string };
  referred?: { name: string; email: string } | null;
};

export default function Referrals() {
  const { tenant } = useTenant();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, totalRewards: 0 });
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (tenant) fetchReferrals();
  }, [tenant]);

  const fetchReferrals = async () => {
    const { data } = await supabase
      .from('referrals')
      .select(`*, referrer:customers!referrer_customer_id(name, email), referred:customers!referred_customer_id(name, email)`)
      .eq('tenant_id', tenant!.id)
      .order('created_at', { ascending: false });
    
    const refs = data || [];
    setReferrals(refs);
    setStats({
      total: refs.length,
      pending: refs.filter(r => r.status === 'pending').length,
      completed: refs.filter(r => r.status === 'completed' || r.status === 'rewarded').length,
      totalRewards: refs.filter(r => r.status === 'rewarded').reduce((sum, r) => sum + (r.reward_value || 0), 0)
    });
    setLoading(false);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const markRewarded = async (id: string) => {
    await supabase.from('referrals').update({ status: 'rewarded' }).eq('id', id);
    fetchReferrals();
  };

  if (!tenant) return <div className="p-8 text-center text-gray-500">Select a business first</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Referral Program</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Referrals</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Rewards Given</p>
          <p className="text-2xl font-bold text-blue-600">${stats.totalRewards}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : referrals.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Users size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No referrals yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referrer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referred</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reward</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {referrals.map(ref => (
                <tr key={ref.id}>
                  <td className="px-6 py-4 text-sm">
                    <div className="font-medium text-gray-900">{Array.isArray(ref.referrer) ? ref.referrer[0]?.name : ref.referrer?.name}</div>
                    <div className="text-gray-500">{Array.isArray(ref.referrer) ? ref.referrer[0]?.email : ref.referrer?.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {ref.referred ? (
                      <>
                        <div className="font-medium text-gray-900">{Array.isArray(ref.referred) ? ref.referred[0]?.name : ref.referred?.name}</div>
                        <div className="text-gray-500">{Array.isArray(ref.referred) ? ref.referred[0]?.email : ref.referred?.email}</div>
                      </>
                    ) : <span className="text-gray-400">Pending signup</span>}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">{ref.referral_code}</code>
                      <button onClick={() => copyCode(ref.referral_code)} className="text-gray-400 hover:text-gray-600">
                        {copied === ref.referral_code ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded ${
                      ref.status === 'rewarded' ? 'bg-green-100 text-green-800' :
                      ref.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>{ref.status}</span>
                  </td>
                  <td className="px-6 py-4 text-sm">${ref.reward_value || 0}</td>
                  <td className="px-6 py-4">
                    {ref.status === 'completed' && (
                      <button onClick={() => markRewarded(ref.id)} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                        <Gift size={14} /> Mark Rewarded
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
