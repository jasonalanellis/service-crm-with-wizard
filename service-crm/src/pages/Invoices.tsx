import { useEffect, useState } from 'react';
import { supabase, Customer, Appointment, Service } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { useToast } from '../context/ToastContext';
import { format, parseISO } from 'date-fns';
import { Plus, Search, Edit, Trash2, Send, Eye, X, FileText } from 'lucide-react';

type Invoice = {
  id: string;
  tenant_id: string;
  customer_id: string;
  appointment_id?: string;
  invoice_number: string;
  items: Array<{ description: string; quantity: number; unit_price: number; total: number }>;
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue';
  due_date?: string;
  sent_at?: string;
  paid_at?: string;
  created_at: string;
  customer?: Customer;
};

export default function Invoices() {
  const { tenant } = useTenant();
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    if (!tenant) return;
    fetchData();
  }, [tenant]);

  const fetchData = async () => {
    if (!tenant) return;
    setLoading(true);

    const [invRes, custRes] = await Promise.all([
      supabase.from('invoices').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: false }),
      supabase.from('customers').select('*').eq('tenant_id', tenant.id),
    ]);

    const custs = custRes.data || [];
    setCustomers(custs);

    // Map customers to invoices
    const invoicesWithCustomers = (invRes.data || []).map(inv => ({
      ...inv,
      customer: custs.find(c => c.id === inv.customer_id),
    }));

    setInvoices(invoicesWithCustomers);
    setLoading(false);
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchSearch = search === '' ||
      inv.customer?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer?.last_name?.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoice_number.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === '' || inv.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700';
      case 'sent': return 'bg-blue-100 text-blue-700';
      case 'viewed': return 'bg-purple-100 text-purple-700';
      case 'overdue': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const paidAmount = filteredInvoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + inv.total, 0);
  const pendingAmount = filteredInvoices.filter(i => i.status !== 'paid').reduce((sum, inv) => sum + inv.total, 0);

  if (!tenant) {
    return <div className="p-8 text-gray-500 dark:text-gray-400">Please select a business from the sidebar</div>;
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invoices</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">View and manage invoices generated from quotes or create new invoices</p>
        </div>
        <button
          onClick={() => { setEditingInvoice(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} /> New Invoice
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Invoices</p>
          <p className="text-2xl font-bold">{filteredInvoices.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Amount</p>
          <p className="text-2xl font-bold">${totalAmount.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
          <p className="text-sm text-gray-500 dark:text-gray-400">Paid</p>
          <p className="text-2xl font-bold text-green-600">${paidAmount.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
          <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">${pendingAmount.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search client or invoice number..."
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
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="viewed">Viewed</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">No invoices found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 text-left text-sm text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Invoice</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Created at</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredInvoices.map(invoice => (
                  <tr key={invoice.id} className="hover:bg-gray-50 dark:bg-gray-900">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                          <FileText size={20} />
                        </div>
                        <span className="font-medium">{invoice.invoice_number}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{invoice.customer?.first_name} {invoice.customer?.last_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{invoice.customer?.email}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-600 dark:text-gray-300">
                      {format(parseISO(invoice.created_at), 'MM-dd-yyyy hh:mm a')}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      ${invoice.total.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-gray-600 dark:text-gray-300" title="View">
                          <Eye size={16} />
                        </button>
                        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-gray-600 dark:text-gray-300" title="Edit">
                          <Edit size={16} />
                        </button>
                        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-blue-600" title="Send">
                          <Send size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t text-sm text-gray-500 dark:text-gray-400">
          {filteredInvoices.length} of {invoices.length} invoices
        </div>
      </div>
    </div>
  );
}
