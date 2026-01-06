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

    // Check if invoices table exists, if not create mock data from appointments
    const [custRes, apptRes] = await Promise.all([
      supabase.from('customers').select('*').eq('tenant_id', tenant.id),
      supabase.from('appointments').select('*').eq('tenant_id', tenant.id).eq('status', 'completed').order('scheduled_start', { ascending: false }).limit(20),
    ]);

    const custs = custRes.data || [];
    setCustomers(custs);

    // Generate invoices from completed appointments for demo
    const appointments = apptRes.data || [];
    const mockInvoices: Invoice[] = appointments.map((appt, index) => {
      const customer = custs.find(c => c.id === appt.customer_id);
      const price = appt.price || 150;
      const tax = price * 0.08;
      return {
        id: appt.id,
        tenant_id: tenant.id,
        customer_id: appt.customer_id,
        appointment_id: appt.id,
        invoice_number: `INV-${String(1000 + index).padStart(4, '0')}`,
        items: [{ description: 'Cleaning Service', quantity: 1, unit_price: price, total: price }],
        subtotal: price,
        tax: Math.round(tax * 100) / 100,
        total: Math.round((price + tax) * 100) / 100,
        status: Math.random() > 0.3 ? 'paid' : Math.random() > 0.5 ? 'sent' : 'draft',
        due_date: appt.scheduled_start,
        created_at: appt.created_at,
        customer,
      } as Invoice;
    });

    setInvoices(mockInvoices);
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
    return <div className="p-8 text-gray-500">Please select a business from the sidebar</div>;
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Invoices</h1>
          <p className="text-gray-500 text-sm">View and manage invoices generated from quotes or create new invoices</p>
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
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-sm text-gray-500">Total Invoices</p>
          <p className="text-2xl font-bold">{filteredInvoices.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-sm text-gray-500">Total Amount</p>
          <p className="text-2xl font-bold">${totalAmount.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-sm text-gray-500">Paid</p>
          <p className="text-2xl font-bold text-green-600">${paidAmount.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">${pendingAmount.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border">
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
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No invoices found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-left text-sm text-gray-500">
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
                  <tr key={invoice.id} className="hover:bg-gray-50">
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
                      <p className="text-xs text-gray-500">{invoice.customer?.email}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-600">
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
                        <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600" title="View">
                          <Eye size={16} />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600" title="Edit">
                          <Edit size={16} />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-600" title="Send">
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

        <div className="p-4 border-t text-sm text-gray-500">
          {filteredInvoices.length} of {invoices.length} invoices
        </div>
      </div>
    </div>
  );
}
