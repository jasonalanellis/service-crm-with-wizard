import { useState, useEffect } from 'react';
import { Wallet, Plus, Check, X, Clock, DollarSign, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { useToast } from '../context/ToastContext';

type Deposit = {
  id: string;
  booking_id: string;
  customer_name?: string;
  amount: number;
  status: 'pending' | 'paid' | 'refunded' | 'forfeited';
  due_date: string;
  paid_at?: string;
  created_at: string;
};

export default function Deposits() {
  const { tenant } = useTenant();
  const { showToast } = useToast();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');

  useEffect(() => {
    if (tenant?.id) loadDeposits();
  }, [tenant?.id]);

  const loadDeposits = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('deposits')
      .select('*, bookings(customers(name))')
      .eq('tenant_id', tenant!.id)
      .order('created_at', { ascending: false });
    
    const formatted = (data || []).map(d => ({
      ...d,
      customer_name: d.bookings?.customers?.name
    }));
    setDeposits(formatted);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: Deposit['status']) => {
    const update: any = { status };
    if (status === 'paid') update.paid_at = new Date().toISOString();
    
    await supabase.from('deposits').update(update).eq('id', id);
    showToast(`Deposit marked as ${status}`, 'success');
    loadDeposits();
  };

  const filteredDeposits = deposits.filter(d => 
    filter === 'all' || d.status === filter
  );

  const totalPending = deposits.filter(d => d.status === 'pending').reduce((sum, d) => sum + d.amount, 0);
  const totalCollected = deposits.filter(d => d.status === 'paid').reduce((sum, d) => sum + d.amount, 0);

  const getStatusBadge = (status: Deposit['status']) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      refunded: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      forfeited: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    };
    const icons = {
      pending: <Clock size={12} />,
      paid: <Check size={12} />,
      refunded: <DollarSign size={12} />,
      forfeited: <X size={12} />
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${styles[status]}`}>
        {icons[status]} {status}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Wallet className="text-emerald-600" />
          Deposits & Prepayments
        </h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <p className="text-sm text-gray-600 dark:text-gray-400">Pending Collection</p>
          <p className="text-2xl font-bold text-yellow-600">${totalPending.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Collected</p>
          <p className="text-2xl font-bold text-green-600">${totalCollected.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Deposits</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{deposits.length}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {['all', 'pending', 'paid'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-lg text-sm ${
              filter === f 
                ? 'bg-emerald-600 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          </div>
        ) : filteredDeposits.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Wallet size={48} className="mx-auto text-gray-400 mb-4" />
            <p>No deposits found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Due Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredDeposits.map(deposit => (
                <tr key={deposit.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {deposit.customer_name || 'Unknown'}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                    ${deposit.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(deposit.due_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(deposit.status)}</td>
                  <td className="px-4 py-3">
                    {deposit.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateStatus(deposit.id, 'paid')}
                          className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                        >
                          Mark Paid
                        </button>
                        <button
                          onClick={() => updateStatus(deposit.id, 'forfeited')}
                          className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Forfeit
                        </button>
                      </div>
                    )}
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
