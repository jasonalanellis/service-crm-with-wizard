import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { Star, Send, Clock, CheckCircle, AlertTriangle, XCircle, Phone, RefreshCw } from 'lucide-react';

type ReviewRequest = {
  id: string;
  tenant_id: string;
  appointment_id: string;
  customer_id: string;
  technician_name: string;
  customer_phone: string;
  status: string;
  rating: number | null;
  reply_text: string | null;
  wants_callback: boolean | null;
  sent_at: string;
  replied_at: string | null;
  created_at: string;
  customer?: { first_name: string; last_name: string };
};

export default function ReviewDashboard() {
  const { tenant } = useTenant();
  const [reviews, setReviews] = useState<ReviewRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (tenant) fetchReviews();
  }, [tenant, filter]);

  const fetchReviews = async () => {
    if (!tenant) return;
    setLoading(true);
    
    let query = supabase
      .from('review_requests')
      .select('*, customer:customers(first_name, last_name)')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data } = await query.limit(100);
    setReviews(data || []);
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="text-gray-400" size={18} />;
      case 'sent': return <Send className="text-blue-500" size={18} />;
      case 'reminded_1':
      case 'reminded_2': return <RefreshCw className="text-yellow-500" size={18} />;
      case 'replied': return <CheckCircle className="text-green-500" size={18} />;
      case 'completed': return <CheckCircle className="text-green-600" size={18} />;
      case 'escalated': return <Phone className="text-red-500" size={18} />;
      case 'expired': return <XCircle className="text-gray-400" size={18} />;
      default: return <Clock className="text-gray-400" size={18} />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'sent': return 'Sent';
      case 'reminded_1': return 'Reminder 1';
      case 'reminded_2': return 'Reminder 2';
      case 'replied': return 'Replied';
      case 'completed': return 'Completed';
      case 'escalated': return 'Needs Callback';
      case 'expired': return 'Expired';
      default: return status;
    }
  };

  const stats = {
    total: reviews.length,
    sent: reviews.filter(r => r.status === 'sent').length,
    replied: reviews.filter(r => ['replied', 'completed'].includes(r.status)).length,
    escalated: reviews.filter(r => r.status === 'escalated').length,
    fiveStars: reviews.filter(r => r.rating === 5).length,
    avgRating: reviews.filter(r => r.rating).length > 0 
      ? (reviews.filter(r => r.rating).reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.filter(r => r.rating).length).toFixed(1)
      : 'N/A'
  };

  if (!tenant) {
    return <div className="p-8 text-gray-500">Please select a business</div>;
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Review Requests</h1>
        <button
          onClick={fetchReviews}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-500">Total Sent</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-500">Awaiting Reply</p>
          <p className="text-2xl font-bold text-blue-600">{stats.sent}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-500">Replied</p>
          <p className="text-2xl font-bold text-green-600">{stats.replied}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-500">Need Callback</p>
          <p className="text-2xl font-bold text-red-600">{stats.escalated}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-500">5-Star Reviews</p>
          <p className="text-2xl font-bold text-yellow-500">{stats.fiveStars}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-500">Avg Rating</p>
          <p className="text-2xl font-bold">{stats.avgRating}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'sent', 'reminded_1', 'reminded_2', 'replied', 'completed', 'escalated', 'expired'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-white border hover:bg-gray-50'
            }`}
          >
            {f === 'all' ? 'All' : getStatusLabel(f)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : reviews.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No review requests yet</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Customer</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Technician</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Rating</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Feedback</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Sent</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {reviews.map(review => (
                <tr key={review.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">
                      {review.customer?.first_name} {review.customer?.last_name}
                    </p>
                    <p className="text-sm text-gray-500">{review.customer_phone}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{review.technician_name || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(review.status)}
                      <span className={`text-sm ${review.status === 'escalated' ? 'text-red-600 font-medium' : ''}`}>
                        {getStatusLabel(review.status)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {review.rating ? (
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            size={16}
                            className={star <= review.rating! ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                          />
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-600 max-w-xs truncate">
                      {review.reply_text || '-'}
                    </p>
                    {review.wants_callback && (
                      <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium mt-1">
                        <Phone size={12} /> Wants callback
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {review.sent_at ? new Date(review.sent_at).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
