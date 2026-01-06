import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { useToast } from '../context/ToastContext';
import { Plus, MapPin, Edit, Trash2, X, Star } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  is_primary: boolean;
}

export default function Locations() {
  const { tenant } = useTenant();
  const { showToast } = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState({
    name: '', address: '', city: '', state: '', zip: '', phone: '', is_primary: false
  });

  useEffect(() => {
    if (tenant) fetchLocations();
  }, [tenant]);

  const fetchLocations = async () => {
    if (!tenant) return;
    setLoading(true);
    const { data } = await supabase
      .from('locations')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('is_primary', { ascending: false });
    setLocations(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    // If setting as primary, unset other primaries
    if (formData.is_primary) {
      await supabase.from('locations').update({ is_primary: false }).eq('tenant_id', tenant.id);
    }

    if (editingLocation) {
      await supabase.from('locations').update(formData).eq('id', editingLocation.id);
      showToast('Location updated', 'success');
    } else {
      await supabase.from('locations').insert({ ...formData, tenant_id: tenant.id });
      showToast('Location added', 'success');
    }
    resetForm();
    fetchLocations();
  };

  const deleteLocation = async (id: string) => {
    if (!confirm('Delete this location?')) return;
    await supabase.from('locations').delete().eq('id', id);
    showToast('Location deleted', 'success');
    fetchLocations();
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingLocation(null);
    setFormData({ name: '', address: '', city: '', state: '', zip: '', phone: '', is_primary: false });
  };

  const openEdit = (loc: Location) => {
    setEditingLocation(loc);
    setFormData(loc);
    setShowForm(true);
  };

  if (!tenant) return <div className="p-8 text-gray-500">Please select a business</div>;

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Locations</h1>
          <p className="text-gray-500 text-sm">Manage business locations</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} /> Add Location
        </button>
      </div>

      {/* Locations Grid */}
      {loading ? (
        <div className="text-center text-gray-500 py-8">Loading...</div>
      ) : locations.length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <MapPin className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-600">No Locations</h3>
          <p className="text-gray-400 text-sm">Add your first business location</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map(loc => (
            <div key={loc.id} className={`bg-white rounded-xl border p-6 ${loc.is_primary ? 'ring-2 ring-blue-500' : ''}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${loc.is_primary ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <MapPin className={loc.is_primary ? 'text-blue-600' : 'text-gray-600'} size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{loc.name}</h3>
                    {loc.is_primary && (
                      <span className="flex items-center gap-1 text-xs text-blue-600">
                        <Star size={12} /> Primary
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(loc)} className="p-1 hover:bg-gray-100 rounded">
                    <Edit size={16} className="text-gray-400" />
                  </button>
                  <button onClick={() => deleteLocation(loc.id)} className="p-1 hover:bg-gray-100 rounded">
                    <Trash2 size={16} className="text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>{loc.address}</p>
                <p>{loc.city}, {loc.state} {loc.zip}</p>
                {loc.phone && <p>{loc.phone}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">{editingLocation ? 'Edit Location' : 'Add Location'}</h2>
              <button onClick={resetForm}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Location Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Main Office"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ZIP</label>
                  <input
                    type="text"
                    value={formData.zip}
                    onChange={e => setFormData({ ...formData, zip: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_primary}
                  onChange={e => setFormData({ ...formData, is_primary: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Set as primary location</span>
              </label>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                  {editingLocation ? 'Update' : 'Add Location'}
                </button>
                <button type="button" onClick={resetForm} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
