import { useEffect, useState } from 'react';
import { supabase, Campaign } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { Mail, MessageSquare, TrendingUp, Users, Send, Plus, Calendar, BarChart3, Target, X, Trash2, Edit2 } from 'lucide-react';
import { format } from 'date-fns';

export default function Marketing() {
  const { tenant } = useTenant();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'analytics'>('campaigns');
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [stats, setStats] = useState({ totalSent: 0, avgOpenRate: 0, avgClickRate: 0, subscribers: 0 });

  useEffect(() => {
    if (tenant) fetchCampaigns();
  }, [tenant]);

  const fetchCampaigns = async () => {
    if (!tenant) return;
    setLoading(true);
    const { data } = await supabase
      .from('campaigns')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false });
    
    const campaignList = data || [];
    setCampaigns(campaignList);

    // Calculate stats
    const totalSent = campaignList.reduce((sum, c) => sum + (c.sent_count || 0), 0);
    const withOpenRate = campaignList.filter(c => c.open_rate);
    const avgOpenRate = withOpenRate.length > 0 
      ? withOpenRate.reduce((sum, c) => sum + (c.open_rate || 0), 0) / withOpenRate.length 
      : 0;
    const withClickRate = campaignList.filter(c => c.click_rate);
    const avgClickRate = withClickRate.length > 0 
      ? withClickRate.reduce((sum, c) => sum + (c.click_rate || 0), 0) / withClickRate.length 
      : 0;

    // Get subscriber count from customers
    const { count } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id);

    setStats({
      totalSent,
      avgOpenRate: Math.round(avgOpenRate * 10) / 10,
      avgClickRate: Math.round(avgClickRate * 10) / 10,
      subscribers: count || 0
    });
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this campaign?')) {
      await supabase.from('campaigns').delete().eq('id', id);
      setCampaigns(campaigns.filter(c => c.id !== id));
    }
  };

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'scheduled': return 'bg-yellow-100 text-yellow-700';
      case 'active': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
    }
  };

  const getTypeIcon = (type: Campaign['type']) => {
    switch (type) {
      case 'email': return <Mail size={16} />;
      case 'sms': return <MessageSquare size={16} />;
      case 'both': return <><Mail size={16} /><MessageSquare size={16} /></>;
    }
  };

  if (!tenant) {
    return <div className="p-8 text-gray-500">Please select a business from the sidebar</div>;
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing</h1>
          <p className="text-gray-600">Email & SMS campaigns and analytics</p>
        </div>
        <button 
          onClick={() => { setEditingCampaign(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          New Campaign
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Send size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Sent</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalSent.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Open Rate</p>
              <p className="text-xl font-bold text-gray-900">{stats.avgOpenRate}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Click Rate</p>
              <p className="text-xl font-bold text-gray-900">{stats.avgClickRate}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Subscribers</p>
              <p className="text-xl font-bold text-gray-900">{stats.subscribers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            activeTab === 'campaigns' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Mail size={18} />
          Campaigns
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            activeTab === 'analytics' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <BarChart3 size={18} />
          Analytics
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : activeTab === 'campaigns' ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {campaigns.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No campaigns yet. Create your first campaign!</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-600">Campaign</th>
                    <th className="text-left p-4 font-medium text-gray-600 hidden md:table-cell">Type</th>
                    <th className="text-left p-4 font-medium text-gray-600 hidden lg:table-cell">Audience</th>
                    <th className="text-left p-4 font-medium text-gray-600">Status</th>
                    <th className="text-left p-4 font-medium text-gray-600 hidden md:table-cell">Sent</th>
                    <th className="text-left p-4 font-medium text-gray-600 hidden lg:table-cell">Open Rate</th>
                    <th className="text-right p-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <div className="font-medium text-gray-900">{campaign.name}</div>
                        {campaign.scheduled_date && (
                          <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <Calendar size={14} />
                            {format(new Date(campaign.scheduled_date), 'MMM d, yyyy')}
                          </div>
                        )}
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <div className="flex items-center gap-1 text-gray-600">
                          {getTypeIcon(campaign.type)}
                        </div>
                      </td>
                      <td className="p-4 hidden lg:table-cell text-gray-600">{campaign.audience || '-'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="p-4 hidden md:table-cell text-gray-900">
                        {campaign.sent_count.toLocaleString()}
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        {campaign.open_rate ? (
                          <span className="text-green-600 font-medium">{campaign.open_rate}%</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => { setEditingCampaign(campaign); setShowModal(true); }}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(campaign.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
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
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Campaign Performance</h3>
          {campaigns.length === 0 ? (
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
              <div className="text-center text-gray-500">
                <BarChart3 size={48} className="mx-auto mb-2 opacity-50" />
                <p>No campaign data yet</p>
              </div>
            </div>
          ) : (
            <>
              <div className="h-48 flex items-end gap-2 mb-6">
                {campaigns.slice(0, 6).map((c) => (
                  <div key={c.id} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                      style={{ height: `${Math.max((c.open_rate || 0) * 3, 4)}px` }}
                      title={`${c.name}: ${c.open_rate || 0}% open rate`}
                    />
                    <span className="text-xs text-gray-500 mt-2 truncate max-w-full">{c.name.slice(0, 10)}</span>
                  </div>
                ))}
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {campaigns.filter(c => c.status === 'completed').slice(0, 1).map(c => (
                  <div key={c.id} className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Best Performing</p>
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-green-600 text-sm">{c.open_rate || 0}% open rate</p>
                  </div>
                ))}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Total Campaigns</p>
                  <p className="font-semibold">{campaigns.length}</p>
                  <p className="text-blue-600 text-sm">{campaigns.filter(c => c.status === 'completed').length} completed</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">This Month</p>
                  <p className="font-semibold">{campaigns.filter(c => new Date(c.created_at).getMonth() === new Date().getMonth()).length} campaigns</p>
                  <p className="text-purple-600 text-sm">{stats.totalSent} messages sent</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Campaign Modal */}
      {showModal && (
        <CampaignModal 
          campaign={editingCampaign}
          tenantId={tenant.id}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchCampaigns(); }}
        />
      )}
    </div>
  );
}

function CampaignModal({ campaign, tenantId, onClose, onSave }: {
  campaign: Campaign | null;
  tenantId: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    name: campaign?.name || '',
    type: campaign?.type || 'email',
    status: campaign?.status || 'draft',
    audience: campaign?.audience || '',
    scheduled_date: campaign?.scheduled_date ? format(new Date(campaign.scheduled_date), "yyyy-MM-dd'T'HH:mm") : '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const data = {
      tenant_id: tenantId,
      name: form.name,
      type: form.type,
      status: form.status,
      audience: form.audience || null,
      scheduled_date: form.scheduled_date ? new Date(form.scheduled_date).toISOString() : null,
      sent_count: campaign?.sent_count || 0,
    };

    if (campaign) {
      await supabase.from('campaigns').update(data).eq('id', campaign.id);
    } else {
      await supabase.from('campaigns').insert(data);
    }
    setSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold">{campaign ? 'Edit Campaign' : 'New Campaign'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
            <input
              type="text"
              value={form.audience}
              onChange={(e) => setForm({ ...form, audience: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="e.g., All Customers, Past Bookings"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Date (optional)</label>
            <input
              type="datetime-local"
              value={form.scheduled_date}
              onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : campaign ? 'Save Changes' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
