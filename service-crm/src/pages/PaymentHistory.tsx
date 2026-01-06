import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { format } from 'date-fns';
import { CreditCard, DollarSign, TrendingUp, Clock, CheckCircle, XCircle, RefreshCw, Search, Filter } from 'lucide-react';

interface Payment {
  id: string;
  appointment_id: string;
  amount: number;
  status: string;
  payment_method: string;
  stripe_payment_intent_id: string;
  created_at: string;
  customer: { first_name: string; last_name: string; email: string };
  service: { name: string };
}

export default function PaymentHistory() {
  const { tenant } = useTenant();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    if (tenant) fetchPayments();
  }, [tenant, dateRange]);

  const fetchPayments = async () => {
    if (!tenant) return;
    setLoading(true);

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));

    const { data } = await supabase
      .from('appointments')
      .select('id, price, payment_status, stripe_payment_intent_id, created_at, customer:customers(first_name, last_name, email), service:services(name)')
      .eq('tenant_id', tenant.id)
      .not('stripe_payment_intent_id', 'is', null)
      .gte('created_at', daysAgo.toISOString())
      .order('created_at', { ascending: false });

    const paymentsData = (data || []).map((appt: any) => ({
      id: appt.id,
      appointment_id: appt.id,
      amount: appt.price || 0,
      status: appt.payment_status || 'pending',
      payment_method: 'card',
      stripe_payment_intent_id: appt.stripe_payment_intent_id,
      created_at: appt.created_at,
      customer: Array.isArray(appt.customer) ? appt.customer[0] : appt.customer,
      service: Array.isArray(appt.service) ? appt.service[0] : appt.service,
    }));

    setPayments(paymentsData);
    setLoading(false);
  };

  const filteredPayments = payments.filter(p => {
    const matchSearch = !search ||
      p.customer?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.customer?.last_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.customer?.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalReceived = filteredPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const totalPending = filteredPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
  const totalRefunded = filteredPayments.filter(p => p.status === 'refunded').reduce((sum, p) => sum + p.amount, 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="text-green-500" size={16} />;
      case 'pending': return <Clock className="text-yellow-500" size={16} />;
      case 'refunded': return <RefreshCw className="text-blue-500" size={16} />;
      case 'failed': return <XCircle className="text-red-500" size={16} />;
      default: return <Clock className="text-gray-500" size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'refunded': return 'bg-blue-100 text-blue-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (!tenant) {
    return <div className="p-8 text-gray-500">Please select a business from the sidebar</div>;
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Payment History</h1>
        <p className="text-gray-500 text-sm">Track all payments, refunds, and outstanding balances</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-6 border shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="text-green-600" size={20} />
            </div>
            <span className="text-gray-600 text-sm">Total Received</span>
          </div>
          <p className="text-2xl font-bold text-green-600">${totalReceived.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="text-yellow-600" size={20} />
            </div>
            <span className="text-gray-600 text-sm">Pending</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600">${totalPending.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <RefreshCw className="text-blue-600" size={20} />
            </div>
            <span className="text-gray-600 text-sm">Refunded</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">${totalRefunded.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="text-purple-600" size={20} />
            </div>
            <span className="text-gray-600 text-sm">Transactions</span>
          </div>
          <p className="text-2xl font-bold">{filteredPayments.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-4 border-b flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg w-full"
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
            <option value="failed">Failed</option>
          </select>
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-600">No payments found</h3>
            <p className="text-gray-400 text-sm">Payments will appear here when customers complete bookings</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-left text-sm text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Service</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium hidden lg:table-cell">Transaction ID</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredPayments.map(payment => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{payment.customer?.first_name} {payment.customer?.last_name}</p>
                      <p className="text-xs text-gray-500">{payment.customer?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm">{payment.service?.name || '-'}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-600">
                      {format(new Date(payment.created_at), 'MMM d, yyyy h:mm a')}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      ${payment.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(payment.status)}`}>
                        {getStatusIcon(payment.status)}
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {payment.stripe_payment_intent_id?.slice(0, 20)}...
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t text-sm text-gray-500">
          Showing {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}
