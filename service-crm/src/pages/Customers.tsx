import { useEffect, useState } from 'react';
import { supabase, Customer, Appointment, Payment } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { useToast } from '../context/ToastContext';
import { format } from 'date-fns';
import { Search, Plus, X, Phone, Mail, MapPin, Calendar, DollarSign, Edit2 } from 'lucide-react';

export default function Customers() {
  const { tenant } = useTenant();
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [customerStats, setCustomerStats] = useState<Record<string, { jobs: number; spent: number }>>({});

  useEffect(() => {
    if (!tenant) return;
    fetchCustomers();
  }, [tenant]);

  const fetchCustomers = async () => {
    if (!tenant) return;
    setLoading(true);
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('first_name');
    setCustomers(data || []);

    // Fetch stats
    const { data: appointments } = await supabase
      .from('appointments')
      .select('customer_id')
      .eq('tenant_id', tenant.id);
    
    const { data: payments } = await supabase
      .from('payments')
      .select('customer_id, amount')
      .eq('tenant_id', tenant.id)
      .eq('status', 'paid');

    const stats: Record<string, { jobs: number; spent: number }> = {};
    appointments?.forEach(a => {
      if (!stats[a.customer_id]) stats[a.customer_id] = { jobs: 0, spent: 0 };
      stats[a.customer_id].jobs++;
    });
    payments?.forEach(p => {
      if (!stats[p.customer_id]) stats[p.customer_id] = { jobs: 0, spent: 0 };
      stats[p.customer_id].spent += Number(p.amount);
    });
    setCustomerStats(stats);
    setLoading(false);
  };

  const filtered = customers.filter(c =>
    `${c.first_name} ${c.last_name} ${c.email} ${c.phone}`.toLowerCase().includes(search.toLowerCase())
  );

  if (!tenant) {
    return <div className="p-8 text-gray-500">Please select a business from the sidebar</div>;
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
        <div className="flex gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <button
            onClick={() => { setSelectedCustomer(null); setShowForm(true); }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 whitespace-nowrap"
          >
            <Plus size={20} /> Add
          </button>
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
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Contact</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 hidden md:table-cell">Jobs</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 hidden md:table-cell">Total Spent</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No customers found</td>
                  </tr>
                ) : (
                  filtered.map(customer => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{customer.first_name} {customer.last_name}</p>
                        {customer.address_line1 && <p className="text-sm text-gray-500 truncate max-w-[200px]">{customer.address_line1}{customer.city ? `, ${customer.city}` : ''}</p>}
                      </td>
                      <td className="px-4 py-3">
                        {customer.email && <p className="text-sm text-gray-600">{customer.email}</p>}
                        {customer.phone && <p className="text-sm text-gray-600">{customer.phone}</p>}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-gray-800">{customerStats[customer.id]?.jobs || 0}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-gray-800">${(customerStats[customer.id]?.spent || 0).toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedCustomer(customer)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            View
                          </button>
                          <button
                            onClick={() => { setSelectedCustomer(customer); setShowForm(true); }}
                            className="text-gray-600 hover:text-gray-800 text-sm"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <CustomerForm
          customer={selectedCustomer}
          tenantId={tenant.id}
          onClose={() => { setShowForm(false); setSelectedCustomer(null); }}
          onSave={() => { setShowForm(false); setSelectedCustomer(null); fetchCustomers(); }}
        />
      )}

      {selectedCustomer && !showForm && (
        <CustomerDetail
          customer={selectedCustomer}
          stats={customerStats[selectedCustomer.id] || { jobs: 0, spent: 0 }}
          onClose={() => setSelectedCustomer(null)}
          onEdit={() => setShowForm(true)}
        />
      )}
    </div>
  );
}

function CustomerDetail({ customer, stats, onClose, onEdit }: {
  customer: Customer;
  stats: { jobs: number; spent: number };
  onClose: () => void;
  onEdit: () => void;
}) {
  const [history, setHistory] = useState<Appointment[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      const { data: appts } = await supabase
        .from('appointments')
        .select('*')
        .eq('customer_id', customer.id)
        .order('scheduled_start', { ascending: false })
        .limit(10);
      
      if (appts && appts.length > 0) {
        const serviceIds = [...new Set(appts.map(a => a.service_id).filter(Boolean))];
        const { data: services } = await supabase
          .from('services')
          .select('id, name')
          .in('id', serviceIds);
        const serviceMap: Record<string, { name: string }> = {};
        services?.forEach(s => { serviceMap[s.id] = s; });
        setHistory(appts.map(a => ({ ...a, service: serviceMap[a.service_id] })));
      } else {
        setHistory([]);
      }
    };
    fetchHistory();
  }, [customer.id]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">{customer.first_name} {customer.last_name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>
        <div className="p-4 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 flex items-center gap-3">
              <Calendar className="text-blue-600" size={24} />
              <div>
                <p className="text-sm text-gray-500">Total Jobs</p>
                <p className="text-xl font-bold text-gray-800">{stats.jobs}</p>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 flex items-center gap-3">
              <DollarSign className="text-green-600" size={24} />
              <div>
                <p className="text-sm text-gray-500">Total Spent</p>
                <p className="text-xl font-bold text-gray-800">${stats.spent.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 text-sm">
            {customer.phone && (
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-gray-400" />
                <a href={`tel:${customer.phone}`} className="text-blue-600 hover:underline">{customer.phone}</a>
              </div>
            )}
            {customer.email && (
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-gray-400" />
                <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">{customer.email}</a>
              </div>
            )}
            {customer.address_line1 && (
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-gray-400" />
                <span>{customer.address_line1}{customer.address_line2 ? ` ${customer.address_line2}` : ''}{customer.city ? `, ${customer.city}` : ''}{customer.state ? `, ${customer.state}` : ''} {customer.zip || ''}</span>
              </div>
            )}
          </div>

          {customer.industry_fields && Object.keys(customer.industry_fields).length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Additional Info</h3>
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                {Object.entries(customer.industry_fields).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-1">
                    <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="text-gray-800">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {customer.notes && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Notes</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{customer.notes}</p>
            </div>
          )}

          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Job History</h3>
            {history.length === 0 ? (
              <p className="text-sm text-gray-500">No jobs yet</p>
            ) : (
              <div className="space-y-2">
                {history.map(appt => (
                  <div key={appt.id} className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-800">{(appt.service as any)?.name || 'Service'}</p>
                      <p className="text-sm text-gray-500">{format(new Date((appt as any).scheduled_start), 'MMM d, yyyy h:mm a')}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded capitalize ${
                      appt.status === 'completed' ? 'bg-green-100 text-green-700' :
                      appt.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{appt.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <button onClick={onEdit} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              <Edit2 size={16} /> Edit Customer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomerForm({ customer, tenantId, onClose, onSave }: {
  customer: Customer | null;
  tenantId: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    first_name: customer?.first_name || '',
    last_name: customer?.last_name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address_line1: customer?.address_line1 || '',
    city: customer?.city || '',
    state: customer?.state || '',
    zip: customer?.zip || '',
    notes: customer?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name) {
      showToast('First name is required', 'error');
      return;
    }
    setSaving(true);
    if (customer) {
      const { error } = await supabase.from('customers').update(form).eq('id', customer.id);
      if (error) showToast('Failed to update customer', 'error');
      else { showToast('Customer updated', 'success'); onSave(); }
    } else {
      const { error } = await supabase.from('customers').insert({ ...form, tenant_id: tenantId });
      if (error) showToast('Failed to create customer', 'error');
      else { showToast('Customer created', 'success'); onSave(); }
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-lg w-full" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">{customer ? 'Edit Customer' : 'Add Customer'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="First Name *" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} className="border rounded-lg px-3 py-2" required />
            <input placeholder="Last Name" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} className="border rounded-lg px-3 py-2" />
            <input placeholder="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="border rounded-lg px-3 py-2" />
            <input placeholder="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="border rounded-lg px-3 py-2" />
          </div>
          <input placeholder="Street Address" value={form.address_line1} onChange={e => setForm(f => ({ ...f, address_line1: e.target.value }))} className="w-full border rounded-lg px-3 py-2" />
          <div className="grid grid-cols-3 gap-4">
            <input placeholder="City" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="border rounded-lg px-3 py-2" />
            <input placeholder="State" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} className="border rounded-lg px-3 py-2" />
            <input placeholder="ZIP" value={form.zip} onChange={e => setForm(f => ({ ...f, zip: e.target.value }))} className="border rounded-lg px-3 py-2" />
          </div>
          <textarea placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full border rounded-lg px-3 py-2 h-24" />
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
