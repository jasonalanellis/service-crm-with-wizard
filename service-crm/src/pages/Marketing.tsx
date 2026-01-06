import { useState } from 'react';
import { Mail, MessageSquare, TrendingUp, Users, Send, Plus, Calendar, BarChart3, Target } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'both';
  status: 'draft' | 'scheduled' | 'active' | 'completed';
  audience: string;
  sentCount: number;
  openRate?: number;
  clickRate?: number;
  scheduledDate?: string;
  createdAt: string;
}

const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Spring Cleaning Special',
    type: 'email',
    status: 'completed',
    audience: 'All Customers',
    sentCount: 450,
    openRate: 32.5,
    clickRate: 8.2,
    createdAt: '2026-01-01'
  },
  {
    id: '2',
    name: 'New Year Discount',
    type: 'both',
    status: 'active',
    audience: 'Past Customers',
    sentCount: 280,
    openRate: 45.1,
    clickRate: 12.3,
    createdAt: '2025-12-28'
  },
  {
    id: '3',
    name: 'Referral Reminder',
    type: 'sms',
    status: 'scheduled',
    audience: 'Loyal Customers',
    sentCount: 0,
    scheduledDate: '2026-01-15',
    createdAt: '2026-01-05'
  },
  {
    id: '4',
    name: 'Service Follow-up',
    type: 'email',
    status: 'draft',
    audience: 'Recent Bookings',
    sentCount: 0,
    createdAt: '2026-01-06'
  }
];

const stats = {
  totalSent: 1250,
  avgOpenRate: 38.2,
  avgClickRate: 10.5,
  subscribers: 892
};

export default function Marketing() {
  const [campaigns] = useState<Campaign[]>(mockCampaigns);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'analytics'>('campaigns');

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

  return (
    <div className="p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing</h1>
          <p className="text-gray-600">Email & SMS campaigns and analytics</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
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

      {activeTab === 'campaigns' ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
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
                      {campaign.scheduledDate && (
                        <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <Calendar size={14} />
                          {new Date(campaign.scheduledDate).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <div className="flex items-center gap-1 text-gray-600">
                        {getTypeIcon(campaign.type)}
                      </div>
                    </td>
                    <td className="p-4 hidden lg:table-cell text-gray-600">{campaign.audience}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="p-4 hidden md:table-cell text-gray-900">
                      {campaign.sentCount.toLocaleString()}
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      {campaign.openRate ? (
                        <span className="text-green-600 font-medium">{campaign.openRate}%</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                        {campaign.status === 'draft' ? 'Edit' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Campaign Performance</h3>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
            <div className="text-center text-gray-500">
              <BarChart3 size={48} className="mx-auto mb-2 opacity-50" />
              <p>Analytics charts will be displayed here</p>
              <p className="text-sm">Integrate with your analytics provider</p>
            </div>
          </div>
          
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Best Performing</p>
              <p className="font-semibold">New Year Discount</p>
              <p className="text-green-600 text-sm">45.1% open rate</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Most Clicked</p>
              <p className="font-semibold">New Year Discount</p>
              <p className="text-purple-600 text-sm">12.3% click rate</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">This Month</p>
              <p className="font-semibold">4 campaigns</p>
              <p className="text-blue-600 text-sm">730 messages sent</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
