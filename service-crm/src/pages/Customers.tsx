import { useEffect, useState } from 'react';
import { supabase, Customer, Appointment } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { useToast } from '../context/ToastContext';
import { format } from 'date-fns';
import { Search, Plus, X, Phone, Mail, MapPin, Calendar, DollarSign, Edit2, Trash2, Users, FileText } from 'lucide-react';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ExportButton from '../components/ExportButton';
import CustomerQuickView from '../components/CustomerQuickView';
import CustomerTimeline from '../components/CustomerTimeline';
import CustomerMergeTool from '../components/CustomerMergeTool';
import ConfirmDialog from '../components/ConfirmDialog';
import NotesTemplates from '../components/NotesTemplates';
import { usePinnedItems, PinButton } from '../hooks/usePinnedItems';
import { useFormValidation, ValidatedField } from '../components/FormValidation';
import { addRecentActivity } from '../components/RecentActivitySidebar';

export default function Customers() {
  const { tenant } = useTenant();
  const { showToast, showUndoToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [quickViewCustomerId, setQuickViewCustomerId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showMergeTool, setShowMergeTool] = useState(false);
  const [customerStats, setCustomerStats] = useState<Record<string, { jobs: number; spent: number }>>({});
  const { isPinned, togglePin, sortWithPinned } = usePinnedItems('customers');

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

  const filtered = sortWithPinned(customers.filter(c =>
    `${c.first_name} ${c.last_name} ${c.email} ${c.phone}`.toLowerCase().includes(search.toLowerCase())
  ));

  if (!tenant) {
    return <div className="p-8 text-gray-500 dark:text-gray-400">Please select a business from the sidebar</div>;
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customers</h1>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowMergeTool(true)}
            className="flex items-center gap-2 px-3 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm"
          >
            <Users size={16} /> Merge
          </button>
          <ExportButton data={customers.map(c => ({ name: `${c.first_name} ${c.last_name}`, email: c.email, phone: c.phone }))} filename="customers" />
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
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
        <LoadingSkeleton type="table" count={5} />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="w-10 px-2"></th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Name</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Contact</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300 hidden md:table-cell">Jobs</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300 hidden md:table-cell">Total Spent</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">No customers found</td>
                  </tr>
                ) : (
                  filtered.map(customer => (
                    <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-2 py-3">
                        <PinButton isPinned={isPinned(customer.id)} onToggle={() => togglePin(customer.id)} />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setQuickViewCustomerId(customer.id)}
                          className="text-left hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          <p className="font-medium text-gray-800 dark:text-white">{customer.first_name} {customer.last_name}</p>
                          {customer.address_line1 && <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{customer.address_line1}{customer.city ? `, ${customer.city}` : ''}</p>}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        {customer.email && <p className="text-sm text-gray-600 dark:text-gray-300">{customer.email}</p>}
                        {customer.phone && <p className="text-sm text-gray-600 dark:text-gray-300">{customer.phone}</p>}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-gray-800 dark:text-white">{customerStats[customer.id]?.jobs || 0}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-gray-800 dark:text-white">${(customerStats[customer.id]?.spent || 0).toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedCustomer(customer)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                          >
                            View
                          </button>
                          <button
                            onClick={() => { setSelectedCustomer(customer); setShowForm(true); }}
                            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-sm"
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

      {quickViewCustomerId && (
        <CustomerQuickView
          customerId={quickViewCustomerId}
          onClose={() => setQuickViewCustomerId(null)}
          onViewFull={() => {
            const c = customers.find(c => c.id === quickViewCustomerId);
            if (c) setSelectedCustomer(c);
            setQuickViewCustomerId(null);
          }}
        />
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
          onDelete={async () => {
            const deletedCustomer = selectedCustomer;
            await supabase.from('customers').delete().eq('id', selectedCustomer.id);
            setSelectedCustomer(null);
            fetchCustomers();
            showUndoToast(`Deleted ${deletedCustomer.first_name} ${deletedCustomer.last_name}`, async () => {
              await supabase.from('customers').insert(deletedCustomer);
              fetchCustomers();
            });
          }}
        />
      )}

      {showMergeTool && (
        <CustomerMergeTool
          tenantId={tenant.id}
          onClose={() => setShowMergeTool(false)}
          onMerged={() => { setShowMergeTool(false); fetchCustomers(); }}
        />
      )}
    </div>
  );
}

function CustomerDetail({ customer, stats, onClose, onEdit, onDelete }: {
  customer: Customer;
  stats: { jobs: number; spent: number };
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [showTimeline, setShowTimeline] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{customer.first_name} {customer.last_name}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={24} /></button>
          </div>
          <div className="p-4 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 flex items-center gap-3">
                <Calendar className="text-blue-600 dark:text-blue-400" size={24} />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Jobs</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">{stats.jobs}</p>
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 flex items-center gap-3">
                <DollarSign className="text-green-600 dark:text-green-400" size={24} />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Spent</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">${stats.spent.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 text-sm">
              {customer.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-gray-400" />
                  <a href={`tel:${customer.phone}`} className="text-blue-600 dark:text-blue-400 hover:underline">{customer.phone}</a>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-gray-400" />
                  <a href={`mailto:${customer.email}`} className="text-blue-600 dark:text-blue-400 hover:underline">{customer.email}</a>
                </div>
              )}
              {customer.address_line1 && (
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">{customer.address_line1}{customer.address_line2 ? ` ${customer.address_line2}` : ''}{customer.city ? `, ${customer.city}` : ''}{customer.state ? `, ${customer.state}` : ''} {customer.zip || ''}</span>
                </div>
              )}
            </div>

            {customer.notes && (
              <div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Notes</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{customer.notes}</p>
              </div>
            )}

            {/* Timeline Toggle */}
            <div>
              <button
                onClick={() => setShowTimeline(!showTimeline)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <Calendar size={16} />
                {showTimeline ? 'Hide' : 'Show'} Activity Timeline
              </button>
              {showTimeline && (
                <div className="mt-4 border dark:border-gray-700 rounded-lg p-4">
                  <CustomerTimeline customerId={customer.id} />
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4 border-t dark:border-gray-700">
              <button onClick={onEdit} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                <Edit2 size={16} /> Edit
              </button>
              <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50">
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Customer"
        message={`Are you sure you want to delete ${customer.first_name} ${customer.last_name}? This action can be undone within 5 seconds.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => { setShowDeleteConfirm(false); onDelete(); }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
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
  const [showNotesTemplates, setShowNotesTemplates] = useState(false);

  const { errors, validate } = useFormValidation<typeof form>({
    first_name: { required: true, minLength: 2 },
    email: { email: true },
    phone: { phone: true },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate(form)) return;
    
    setSaving(true);
    if (customer) {
      const { error } = await supabase.from('customers').update(form).eq('id', customer.id);
      if (error) showToast('Failed to update customer', 'error');
      else {
        showToast('Customer updated', 'success');
        addRecentActivity({ type: 'customer', title: `Updated ${form.first_name}`, description: 'Customer record modified' });
        onSave();
      }
    } else {
      const { error } = await supabase.from('customers').insert({ ...form, tenant_id: tenantId });
      if (error) showToast('Failed to create customer', 'error');
      else {
        showToast('Customer created', 'success');
        addRecentActivity({ type: 'customer', title: `Added ${form.first_name}`, description: 'New customer created' });
        onSave();
      }
    }
    setSaving(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full" onClick={e => e.stopPropagation()}>
          <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{customer ? 'Edit Customer' : 'Add Customer'}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={24} /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <ValidatedField error={errors.first_name} label="First Name" required>
                <input
                  placeholder="First Name"
                  value={form.first_name}
                  onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                  className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                />
              </ValidatedField>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                <input
                  placeholder="Last Name"
                  value={form.last_name}
                  onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                  className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ValidatedField error={errors.email} label="Email">
                <input
                  placeholder="Email"
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                />
              </ValidatedField>
              <ValidatedField error={errors.phone} label="Phone">
                <input
                  placeholder="Phone"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                />
              </ValidatedField>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
              <input
                placeholder="Street Address"
                value={form.address_line1}
                onChange={e => setForm(f => ({ ...f, address_line1: e.target.value }))}
                className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <input placeholder="City" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white" />
              <input placeholder="State" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} className="border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white" />
              <input placeholder="ZIP" value={form.zip} onChange={e => setForm(f => ({ ...f, zip: e.target.value }))} className="border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                <button
                  type="button"
                  onClick={() => setShowNotesTemplates(true)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <FileText size={12} /> Templates
                </button>
              </div>
              <textarea
                placeholder="Notes..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 h-24 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button type="button" onClick={onClose} className="px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showNotesTemplates && (
        <NotesTemplates
          onSelect={(text) => {
            setForm(f => ({ ...f, notes: f.notes + text }));
            setShowNotesTemplates(false);
          }}
          onClose={() => setShowNotesTemplates(false)}
        />
      )}
    </>
  );
}
