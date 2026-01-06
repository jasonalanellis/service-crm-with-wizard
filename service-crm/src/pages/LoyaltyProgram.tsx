import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { useToast } from '../context/ToastContext';
import { format } from 'date-fns';
import { Gift, Star, Users, TrendingUp, Settings, Plus, X } from 'lucide-react';

interface LoyaltyMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  loyalty_points_balance: number;
}

interface PointsTransaction {
  id: string;
  points: number;
  reason: string;
  created_at: string;
  customer: { first_name: string; last_name: string };
}

export default function LoyaltyProgram() {
  const { tenant } = useTenant();
  const { showToast } = useToast();
  const [members, setMembers] = useState<LoyaltyMember[]>([]);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showAwardForm, setShowAwardForm] = useState(false);
  const [settings, setSettings] = useState({ points_per_dollar: 1, redemption_rate: 100 });
  const [awardData, setAwardData] = useState({ customer_id: '', points: 0, reason: '' });

  useEffect(() => {
    if (tenant) {
      fetchData();
      setSettings({
        points_per_dollar: (tenant as any).loyalty_points_per_dollar || 1,
        redemption_rate: (tenant as any).loyalty_redemption_rate || 100,
      });
    }
  }, [tenant]);

  const fetchData = async () => {
    if (!tenant) return;
    setLoading(true);

    const [membersRes, transRes] = await Promise.all([
      supabase.from('customers').select('id, first_name, last_name, email, loyalty_points_balance')
        .eq('tenant_id', tenant.id).gt('loyalty_points_balance', 0).order('loyalty_points_balance', { ascending: false }),
      supabase.from('loyalty_points').select('*, customer:customers(first_name, last_name)')
        .eq('tenant_id', tenant.id).order('created_at', { ascending: false }).limit(50),
    ]);

    setMembers(membersRes.data || []);
    setTransactions(transRes.data || []);
    setLoading(false);
  };

  const saveSettings = async () => {
    if (!tenant) return;
    await supabase.from('tenants').update({
      loyalty_points_per_dollar: settings.points_per_dollar,
      loyalty_redemption_rate: settings.redemption_rate,
    }).eq('id', tenant.id);
    showToast('Settings saved', 'success');
    setShowSettings(false);
  };

  const awardPoints = async () => {
    if (!tenant || !awardData.customer_id || awardData.points <= 0) return;

    // Add points transaction
    await supabase.from('loyalty_points').insert({
      tenant_id: tenant.id,
      customer_id: awardData.customer_id,
      points: awardData.points,
      reason: awardData.reason || 'Manual award',
    });

    // Update customer balance
    const member = members.find(m => m.id === awardData.customer_id);
    if (member) {
      await supabase.from('customers').update({
        loyalty_points_balance: (member.loyalty_points_balance || 0) + awardData.points,
      }).eq('id', awardData.customer_id);
    }

    showToast('Points awarded', 'success');
    setShowAwardForm(false);
    setAwardData({ customer_id: '', points: 0, reason: '' });
    fetchData();
  };

  const totalPoints = members.reduce((sum, m) => sum + (m.loyalty_points_balance || 0), 0);

  if (!tenant) return <div className="p-8 text-gray-500">Please select a business</div>;

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Loyalty Program</h1>
          <p className="text-gray-500 text-sm">Reward your repeat customers</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <Settings size={18} /> Settings
          </button>
          <button
            onClick={() => setShowAwardForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} /> Award Points
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-2 mb-1">
            <Users className="text-blue-500" size={20} />
            <span className="text-sm text-gray-500">Active Members</span>
          </div>
          <p className="text-2xl font-bold">{members.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-2 mb-1">
            <Star className="text-yellow-500" size={20} />
            <span className="text-sm text-gray-500">Total Points</span>
          </div>
          <p className="text-2xl font-bold">{totalPoints.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-2 mb-1">
            <Gift className="text-purple-500" size={20} />
            <span className="text-sm text-gray-500">Points/Dollar</span>
          </div>
          <p className="text-2xl font-bold">{settings.points_per_dollar}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="text-green-500" size={20} />
            <span className="text-sm text-gray-500">Redemption Rate</span>
          </div>
          <p className="text-2xl font-bold">{settings.redemption_rate} pts = $1</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Members */}
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Top Members</h2>
          </div>
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : members.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No loyalty members yet</div>
          ) : (
            <div className="divide-y">
              {members.slice(0, 10).map((member, i) => (
                <div key={member.id} className="p-4 flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    i === 0 ? 'bg-yellow-100 text-yellow-700' :
                    i === 1 ? 'bg-gray-100 text-gray-700' :
                    i === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-50 text-blue-700'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{member.first_name} {member.last_name}</p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">{member.loyalty_points_balance?.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">points</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Recent Activity</h2>
          </div>
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No activity yet</div>
          ) : (
            <div className="divide-y max-h-96 overflow-y-auto">
              {transactions.map(tx => (
                <div key={tx.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{tx.customer?.first_name} {tx.customer?.last_name}</p>
                    <p className="text-sm text-gray-500">{tx.reason}</p>
                    <p className="text-xs text-gray-400">{format(new Date(tx.created_at), 'MMM d, h:mm a')}</p>
                  </div>
                  <span className={`font-bold ${tx.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.points > 0 ? '+' : ''}{tx.points}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Loyalty Settings</h2>
              <button onClick={() => setShowSettings(false)}><X size={20} /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Points per Dollar Spent</label>
                <input
                  type="number"
                  value={settings.points_per_dollar}
                  onChange={e => setSettings({ ...settings, points_per_dollar: parseFloat(e.target.value) || 1 })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Points to Redeem for $1</label>
                <input
                  type="number"
                  value={settings.redemption_rate}
                  onChange={e => setSettings({ ...settings, redemption_rate: parseFloat(e.target.value) || 100 })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <button onClick={saveSettings} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Award Points Modal */}
      {showAwardForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Award Points</h2>
              <button onClick={() => setShowAwardForm(false)}><X size={20} /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Customer</label>
                <select
                  value={awardData.customer_id}
                  onChange={e => setAwardData({ ...awardData, customer_id: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Select customer</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Points</label>
                <input
                  type="number"
                  value={awardData.points}
                  onChange={e => setAwardData({ ...awardData, points: parseInt(e.target.value) || 0 })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reason</label>
                <input
                  type="text"
                  value={awardData.reason}
                  onChange={e => setAwardData({ ...awardData, reason: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="e.g., Birthday bonus"
                />
              </div>
              <button onClick={awardPoints} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                Award Points
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
