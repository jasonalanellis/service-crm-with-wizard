import { useEffect, useState } from 'react';
import { supabase, Review, Customer } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { useToast } from '../context/ToastContext';
import { format } from 'date-fns';
import { Star, Send, ExternalLink, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function Reviews() {
  const { tenant } = useTenant();
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => {
    if (!tenant) return;
    fetchData();
  }, [tenant]);

  const fetchData = async () => {
    if (!tenant) return;
    setLoading(true);
    const [reviewsRes, customersRes] = await Promise.all([
      supabase.from('reviews').select('*, customer:customers(*)').eq('tenant_id', tenant.id).order('requested_at', { ascending: false }),
      supabase.from('customers').select('*').eq('tenant_id', tenant.id),
    ]);
    setReviews(reviewsRes.data || []);
    setCustomers(customersRes.data || []);
    setLoading(false);
  };

  const sendReviewRequest = async (customerId: string) => {
    if (!tenant) return;
    const { error } = await supabase.from('reviews').insert({
      tenant_id: tenant.id,
      customer_id: customerId,
      status: 'pending',
      requested_at: new Date().toISOString(),
    });
    if (error) showToast('Failed to send request', 'error');
    else { showToast('Review request sent', 'success'); fetchData(); }
    setShowRequestModal(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={16} className="text-yellow-500" />;
      case 'completed': return <CheckCircle size={16} className="text-green-500" />;
      case 'no_response': return <XCircle size={16} className="text-gray-400" />;
      default: return null;
    }
  };

  const filtered = reviews.filter(r => !filterStatus || r.status === filterStatus);

  if (!tenant) {
    return <div className="p-8 text-gray-500">Please select a business from the sidebar</div>;
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Reviews</h1>
        <div className="flex gap-3">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="no_response">No Response</option>
          </select>
          <button
            onClick={() => setShowRequestModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Send size={20} /> Request Review
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{reviews.filter(r => r.status === 'pending').length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-green-600">{reviews.filter(r => r.status === 'completed').length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-500">Avg Rating</p>
          <p className="text-2xl font-bold text-blue-600">
            {reviews.filter(r => r.rating).length > 0
              ? (reviews.filter(r => r.rating).reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.filter(r => r.rating).length).toFixed(1)
              : '-'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Customer</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Rating</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 hidden md:table-cell">Comment</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Requested</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No reviews found</td></tr>
                ) : (
                  filtered.map(review => {
                    const customer = review.customer as Customer;
                    return (
                      <tr key={review.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800">{customer?.first_name} {customer?.last_name}</p>
                          {customer?.email && <p className="text-sm text-gray-500">{customer.email}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(review.status)}
                            <span className="capitalize text-sm">{review.status.replace('_', ' ')}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {review.rating ? (
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  size={16}
                                  className={i < review.rating! ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                                />
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <p className="text-sm text-gray-600 truncate max-w-[200px]">{review.comment || '-'}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {format(new Date(review.requested_at), 'MMM d, yyyy')}
                        </td>
                        <td className="px-4 py-3">
                          {review.review_url && (
                            <a
                              href={review.review_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                            >
                              <ExternalLink size={14} /> View
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Request Review Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowRequestModal(false)}>
          <div className="bg-white rounded-lg max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Send Review Request</h2>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-600">Select a customer to send a review request to:</p>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {customers.map(customer => (
                  <button
                    key={customer.id}
                    onClick={() => sendReviewRequest(customer.id)}
                    className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">{customer.first_name} {customer.last_name}</p>
                      {customer.email && <p className="text-sm text-gray-500">{customer.email}</p>}
                    </div>
                    <Send size={16} className="text-gray-400" />
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowRequestModal(false)}
                className="w-full py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
