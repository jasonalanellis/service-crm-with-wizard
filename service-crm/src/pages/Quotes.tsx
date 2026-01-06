import { useEffect, useState } from 'react';
import { supabase, Quote, Lead, Customer, Service } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { useToast } from '../context/ToastContext';
import { format } from 'date-fns';
import { Plus, X, FileText, Eye, Check, XCircle, Trash2, Copy } from 'lucide-react';

const STATUSES = [
  { id: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-700' },
  { id: 'sent', label: 'Sent', color: 'bg-blue-100 text-blue-700' },
  { id: 'viewed', label: 'Viewed', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'accepted', label: 'Accepted', color: 'bg-green-100 text-green-700' },
  { id: 'declined', label: 'Declined', color: 'bg-red-100 text-red-700' },
];

export default function Quotes() {
  const { tenant } = useTenant();
  const { showToast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => {
    if (!tenant) return;
    fetchData();
  }, [tenant]);

  const fetchData = async () => {
    if (!tenant) return;
    setLoading(true);
    const [quotesRes, leadsRes, customersRes, servicesRes] = await Promise.all([
      supabase.from('quotes').select('*, lead:leads(*), customer:customers(*)').eq('tenant_id', tenant.id).order('created_at', { ascending: false }),
      supabase.from('leads').select('*').eq('tenant_id', tenant.id).in('status', ['new', 'contacted', 'quote_sent']),
      supabase.from('customers').select('*').eq('tenant_id', tenant.id),
      supabase.from('services').select('*').eq('tenant_id', tenant.id),
    ]);
    setQuotes(quotesRes.data || []);
    setLeads(leadsRes.data || []);
    setCustomers(customersRes.data || []);
    setServices(servicesRes.data || []);
    setLoading(false);
  };

  const updateStatus = async (quoteId: string, status: string) => {
    const updates: Partial<Quote> = { status: status as Quote['status'] };
    if (status === 'sent') updates.sent_at = new Date().toISOString();
    if (status === 'viewed') updates.viewed_at = new Date().toISOString();
    if (status === 'accepted') updates.accepted_at = new Date().toISOString();

    const { error } = await supabase.from('quotes').update(updates).eq('id', quoteId);
    if (error) showToast('Failed to update status', 'error');
    else { showToast('Status updated', 'success'); fetchData(); }
  };

  const deleteQuote = async (quoteId: string) => {
    if (!confirm('Delete this quote?')) return;
    const { error } = await supabase.from('quotes').delete().eq('id', quoteId);
    if (error) showToast('Failed to delete', 'error');
    else { showToast('Quote deleted', 'success'); fetchData(); }
  };

  const copyShareLink = (quote: Quote) => {
    const link = `${window.location.origin}/quote/${quote.id}`;
    navigator.clipboard.writeText(link);
    showToast('Link copied to clipboard', 'success');
  };

  const filtered = quotes.filter(q => !filterStatus || q.status === filterStatus);

  if (!tenant) {
    return <div className="p-8 text-gray-500">Please select a business from the sidebar</div>;
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Quotes</h1>
        <div className="flex gap-3">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <button
            onClick={() => { setSelectedQuote(null); setShowForm(true); }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} /> New Quote
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
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Quote #</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">For</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Total</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 hidden md:table-cell">Date</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No quotes found</td></tr>
                ) : (
                  filtered.map(quote => {
                    const recipient = quote.customer || quote.lead;
                    const statusInfo = STATUSES.find(s => s.id === quote.status);
                    return (
                      <tr key={quote.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm">#{quote.id.slice(0, 8)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800">
                            {recipient ? `${(recipient as any).first_name} ${(recipient as any).last_name || ''}` : '-'}
                          </p>
                          <p className="text-xs text-gray-500">{quote.customer ? 'Customer' : 'Lead'}</p>
                        </td>
                        <td className="px-4 py-3 font-semibold">${Number(quote.total).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo?.color}`}>
                            {statusInfo?.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">
                          {format(new Date(quote.created_at), 'MMM d, yyyy')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button onClick={() => setSelectedQuote(quote)} className="p-1.5 hover:bg-gray-100 rounded" title="View">
                              <Eye size={16} className="text-gray-600" />
                            </button>
                            <button onClick={() => copyShareLink(quote)} className="p-1.5 hover:bg-gray-100 rounded" title="Copy Link">
                              <Copy size={16} className="text-gray-600" />
                            </button>
                            {quote.status === 'draft' && (
                              <button onClick={() => updateStatus(quote.id, 'sent')} className="p-1.5 hover:bg-gray-100 rounded" title="Mark Sent">
                                <FileText size={16} className="text-blue-600" />
                              </button>
                            )}
                            {(quote.status === 'sent' || quote.status === 'viewed') && (
                              <>
                                <button onClick={() => updateStatus(quote.id, 'accepted')} className="p-1.5 hover:bg-gray-100 rounded" title="Mark Accepted">
                                  <Check size={16} className="text-green-600" />
                                </button>
                                <button onClick={() => updateStatus(quote.id, 'declined')} className="p-1.5 hover:bg-gray-100 rounded" title="Mark Declined">
                                  <XCircle size={16} className="text-red-600" />
                                </button>
                              </>
                            )}
                            <button onClick={() => deleteQuote(quote.id)} className="p-1.5 hover:bg-gray-100 rounded" title="Delete">
                              <Trash2 size={16} className="text-red-600" />
                            </button>
                          </div>
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

      {showForm && (
        <QuoteForm
          quote={selectedQuote}
          tenantId={tenant.id}
          leads={leads}
          customers={customers}
          services={services}
          onClose={() => { setShowForm(false); setSelectedQuote(null); }}
          onSave={() => { setShowForm(false); setSelectedQuote(null); fetchData(); }}
        />
      )}

      {selectedQuote && !showForm && (
        <QuoteDetail quote={selectedQuote} onClose={() => setSelectedQuote(null)} onEdit={() => setShowForm(true)} />
      )}
    </div>
  );
}

function QuoteDetail({ quote, onClose, onEdit }: { quote: Quote; onClose: () => void; onEdit: () => void }) {
  const recipient = quote.customer || quote.lead;
  const items = Array.isArray(quote.items) ? quote.items : [];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Quote #{quote.id.slice(0, 8)}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">For:</p>
              <p className="font-medium text-lg">
                {recipient ? `${(recipient as any).first_name} ${(recipient as any).last_name || ''}` : '-'}
              </p>
              {(recipient as any)?.email && <p className="text-sm text-gray-600">{(recipient as any).email}</p>}
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-sm">Date:</p>
              <p>{format(new Date(quote.created_at), 'MMMM d, yyyy')}</p>
              {quote.valid_until && (
                <p className="text-sm text-gray-500">Valid until: {format(new Date(quote.valid_until), 'MMM d, yyyy')}</p>
              )}
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">Item</th>
                  <th className="text-right px-4 py-2 text-sm font-medium text-gray-600">Qty</th>
                  <th className="text-right px-4 py-2 text-sm font-medium text-gray-600">Price</th>
                  <th className="text-right px-4 py-2 text-sm font-medium text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3">{item.name}</td>
                    <td className="px-4 py-3 text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-right">${Number(item.price).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">${(item.quantity * item.price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal:</span><span>${Number(quote.subtotal).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Tax:</span><span>${Number(quote.tax).toFixed(2)}</span></div>
              <div className="flex justify-between font-semibold text-lg border-t pt-2"><span>Total:</span><span>${Number(quote.total).toFixed(2)}</span></div>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <button onClick={onEdit} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Edit</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuoteForm({ quote, tenantId, leads, customers, services, onClose, onSave }: {
  quote: Quote | null;
  tenantId: string;
  leads: Lead[];
  customers: Customer[];
  services: Service[];
  onClose: () => void;
  onSave: () => void;
}) {
  const { showToast } = useToast();
  const [recipientType, setRecipientType] = useState<'lead' | 'customer'>(quote?.lead_id ? 'lead' : 'customer');
  const [recipientId, setRecipientId] = useState(quote?.lead_id || quote?.customer_id || '');
  const [items, setItems] = useState<{ name: string; quantity: number; price: number }[]>(
    Array.isArray(quote?.items) ? quote.items : []
  );
  const [validUntil, setValidUntil] = useState(quote?.valid_until || '');
  const [saving, setSaving] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const addServiceItem = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setItems([...items, { name: service.name, quantity: 1, price: Number(service.base_price) }]);
    }
  };

  const addCustomItem = () => {
    setItems([...items, { name: '', quantity: 1, price: 0 }]);
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    setItems(items.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientId) {
      showToast('Please select a recipient', 'error');
      return;
    }
    if (items.length === 0) {
      showToast('Please add at least one item', 'error');
      return;
    }

    setSaving(true);
    const data = {
      tenant_id: tenantId,
      lead_id: recipientType === 'lead' ? recipientId : null,
      customer_id: recipientType === 'customer' ? recipientId : null,
      items,
      subtotal,
      tax,
      total,
      valid_until: validUntil || null,
      status: quote?.status || 'draft',
    };

    if (quote?.id) {
      const { error } = await supabase.from('quotes').update(data).eq('id', quote.id);
      if (error) showToast('Failed to update', 'error');
      else { showToast('Quote updated', 'success'); onSave(); }
    } else {
      const { error } = await supabase.from('quotes').insert(data);
      if (error) showToast('Failed to create', 'error');
      else { showToast('Quote created', 'success'); onSave(); }
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">{quote ? 'Edit Quote' : 'New Quote'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Type</label>
              <select value={recipientType} onChange={e => { setRecipientType(e.target.value as any); setRecipientId(''); }} className="w-full border rounded-lg px-3 py-2">
                <option value="lead">Lead</option>
                <option value="customer">Customer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {recipientType === 'lead' ? 'Select Lead' : 'Select Customer'}
              </label>
              <select value={recipientId} onChange={e => setRecipientId(e.target.value)} className="w-full border rounded-lg px-3 py-2" required>
                <option value="">Select...</option>
                {(recipientType === 'lead' ? leads : customers).map(r => (
                  <option key={r.id} value={r.id}>{r.first_name} {r.last_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
            <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} className="border rounded-lg px-3 py-2" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Line Items</label>
              <div className="flex gap-2">
                <select onChange={e => { if (e.target.value) { addServiceItem(e.target.value); e.target.value = ''; } }} className="border rounded-lg px-3 py-1 text-sm">
                  <option value="">Add Service...</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name} - ${s.base_price}</option>)}
                </select>
                <button type="button" onClick={addCustomItem} className="px-3 py-1 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">+ Custom</button>
              </div>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input placeholder="Item name" value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" />
                  <input type="number" placeholder="Qty" value={item.quantity} onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 1)} className="w-16 border rounded px-2 py-1 text-sm" min="1" />
                  <input type="number" placeholder="Price" value={item.price} onChange={e => updateItem(i, 'price', parseFloat(e.target.value) || 0)} className="w-24 border rounded px-2 py-1 text-sm" step="0.01" />
                  <button type="button" onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700"><X size={18} /></button>
                </div>
              ))}
              {items.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No items added yet</p>}
            </div>
          </div>

          <div className="flex justify-end">
            <div className="w-64 space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal:</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Tax (8%):</span><span>${tax.toFixed(2)}</span></div>
              <div className="flex justify-between font-semibold text-lg border-t pt-1"><span>Total:</span><span>${total.toFixed(2)}</span></div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Quote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
