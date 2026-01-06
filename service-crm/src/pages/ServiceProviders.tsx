import { useEffect, useState } from 'react';
import { supabase, Technician } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { useToast } from '../context/ToastContext';
import { Plus, Search, Edit, Trash2, Star, X, Phone, Mail } from 'lucide-react';

export default function ServiceProviders() {
  const { tenant } = useTenant();
  const { showToast } = useToast();
  const [providers, setProviders] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Technician | null>(null);

  useEffect(() => {
    if (!tenant) return;
    fetchProviders();
  }, [tenant]);

  const fetchProviders = async () => {
    if (!tenant) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('technicians')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('first_name');
    
    if (error) {
      showToast('Failed to load providers', 'error');
    } else {
      setProviders(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this provider?')) return;
    const { error } = await supabase.from('technicians').delete().eq('id', id);
    if (error) {
      showToast('Failed to delete', 'error');
    } else {
      showToast('Provider deleted', 'success');
      fetchProviders();
    }
  };

  const filteredProviders = providers.filter(p => 
    search === '' ||
    p.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.last_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

  const renderStars = (rating?: number) => {
    const stars = rating || 0;
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            size={14}
            className={i <= stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
          />
        ))}
      </div>
    );
  };

  if (!tenant) {
    return <div className="p-8 text-gray-500">Please select a business from the sidebar</div>;
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Service Providers</h1>
          <p className="text-gray-500 text-sm">Manage your service providers and their details</p>
        </div>
        <button
          onClick={() => { setEditingProvider(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} /> New Service Provider
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-sm text-gray-500">Total Service Providers</p>
          <p className="text-2xl font-bold">{providers.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{providers.filter(p => p.is_active !== false).length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-sm text-gray-500">Avg Rating</p>
          <p className="text-2xl font-bold">
            {providers.length > 0
              ? (providers.reduce((sum, p) => sum + (p.rating || 0), 0) / providers.length).toFixed(1)
              : '-'}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <div className="relative max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search name, email or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg w-full"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : filteredProviders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No service providers found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-left text-sm text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Service Provider</th>
                  <th className="px-4 py-3 font-medium">Email Address</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Phone Number</th>
                  <th className="px-4 py-3 font-medium">Wage</th>
                  <th className="px-4 py-3 font-medium">Avg. Rating</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredProviders.map(provider => (
                  <tr key={provider.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                          {provider.first_name?.[0]}{provider.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-medium">{provider.first_name} {provider.last_name}</p>
                          {provider.specialty && (
                            <p className="text-xs text-gray-500">{provider.specialty}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {provider.email || '-'}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-600">
                      {provider.phone || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {provider.hourly_rate ? (
                        <span className="font-medium">${provider.hourly_rate}/hr</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {renderStars(provider.rating)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditingProvider(provider); setShowForm(true); }}
                          className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(provider.id)}
                          className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-red-600"
                        >
                          <Trash2 size={16} />
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
          {filteredProviders.length} of {providers.length} providers
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <ProviderForm
          provider={editingProvider}
          tenantId={tenant.id}
          onClose={() => { setShowForm(false); setEditingProvider(null); }}
          onSave={() => { setShowForm(false); setEditingProvider(null); fetchProviders(); }}
        />
      )}
    </div>
  );
}

function ProviderForm({ provider, tenantId, onClose, onSave }: {
  provider: Technician | null;
  tenantId: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    first_name: provider?.first_name || '',
    last_name: provider?.last_name || '',
    email: provider?.email || '',
    phone: provider?.phone || '',
    specialty: provider?.specialty || '',
    hourly_rate: provider?.hourly_rate || '',
    rating: provider?.rating || 5,
    is_active: provider?.is_active !== false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name) {
      showToast('Name is required', 'error');
      return;
    }
    setSaving(true);

    const data = {
      tenant_id: tenantId,
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email || null,
      phone: form.phone || null,
      specialty: form.specialty || null,
      hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate as string) : null,
      rating: form.rating,
      is_active: form.is_active,
    };

    if (provider?.id) {
      const { error } = await supabase.from('technicians').update(data).eq('id', provider.id);
      if (error) showToast('Failed to update', 'error');
      else { showToast('Provider updated', 'success'); onSave(); }
    } else {
      const { error } = await supabase.from('technicians').insert(data);
      if (error) showToast('Failed to create', 'error');
      else { showToast('Provider created', 'success'); onSave(); }
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-lg w-full" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">{provider ? 'Edit Provider' : 'New Service Provider'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="First Name *"
              value={form.first_name}
              onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
              className="border rounded-lg px-3 py-2"
              required
            />
            <input
              type="text"
              placeholder="Last Name *"
              value={form.last_name}
              onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
              className="border rounded-lg px-3 py-2"
              required
            />
          </div>
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full border rounded-lg pl-10 pr-3 py-2"
            />
          </div>
          <div className="relative">
            <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="tel"
              placeholder="Phone Number"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full border rounded-lg pl-10 pr-3 py-2"
            />
          </div>
          <input
            type="text"
            placeholder="Specialty (e.g. Deep Cleaning, Move-out)"
            value={form.specialty}
            onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2"
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Hourly Rate ($)</label>
              <input
                type="number"
                step="0.01"
                placeholder="30.00"
                value={form.hourly_rate}
                onChange={e => setForm(f => ({ ...f, hourly_rate: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Rating</label>
              <select
                value={form.rating}
                onChange={e => setForm(f => ({ ...f, rating: parseInt(e.target.value) }))}
                className="w-full border rounded-lg px-3 py-2"
              >
                {[5, 4, 3, 2, 1].map(r => (
                  <option key={r} value={r}>{r} stars</option>
                ))}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm">Active</span>
          </label>
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
