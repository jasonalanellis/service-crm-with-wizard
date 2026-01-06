import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { Map, Plus, Edit2, Trash2 } from 'lucide-react';

type ServiceZone = {
  id: string;
  name: string;
  zip_codes: string[];
  surcharge: number;
  travel_time: number;
  is_active: boolean;
  created_at: string;
};

export default function ServiceZones() {
  const { tenant } = useTenant();
  const [zones, setZones] = useState<ServiceZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ServiceZone | null>(null);
  const [formData, setFormData] = useState({ name: '', zip_codes: '', surcharge: 0, travel_time: 0 });

  useEffect(() => {
    if (tenant) fetchZones();
  }, [tenant]);

  const fetchZones = async () => {
    const { data } = await supabase
      .from('service_zones')
      .select('*')
      .eq('tenant_id', tenant!.id)
      .order('name', { ascending: true });
    setZones(data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    const payload = {
      name: formData.name,
      zip_codes: formData.zip_codes.split(',').map(z => z.trim()).filter(Boolean),
      surcharge: formData.surcharge,
      travel_time: formData.travel_time
    };
    if (editing) {
      await supabase.from('service_zones').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('service_zones').insert({ ...payload, tenant_id: tenant!.id, is_active: true });
    }
    setShowModal(false);
    setEditing(null);
    setFormData({ name: '', zip_codes: '', surcharge: 0, travel_time: 0 });
    fetchZones();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this zone?')) {
      await supabase.from('service_zones').delete().eq('id', id);
      fetchZones();
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await supabase.from('service_zones').update({ is_active: !isActive }).eq('id', id);
    fetchZones();
  };

  if (!tenant) return <div className="p-8 text-center text-gray-500">Select a business first</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Service Zones</h1>
        <button onClick={() => { setShowModal(true); setFormData({ name: '', zip_codes: '', surcharge: 0, travel_time: 0 }); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={20} /> Add Zone
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : zones.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Map size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No service zones defined</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {zones.map(zone => (
            <div key={zone.id} className={`bg-white rounded-lg shadow p-4 ${!zone.is_active ? 'opacity-60' : ''}`}>
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-900">{zone.name}</h3>
                <button onClick={() => toggleActive(zone.id, zone.is_active)} className={`text-xs px-2 py-1 rounded ${zone.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {zone.is_active ? 'Active' : 'Inactive'}
                </button>
              </div>
              <div className="space-y-2 text-sm text-gray-600 mb-3">
                <div><span className="text-gray-500">ZIP Codes:</span> {zone.zip_codes?.join(', ') || 'None'}</div>
                <div><span className="text-gray-500">Surcharge:</span> ${zone.surcharge}</div>
                <div><span className="text-gray-500">Travel Time:</span> {zone.travel_time} min</div>
              </div>
              <div className="flex gap-2 pt-2 border-t">
                <button onClick={() => { setEditing(zone); setFormData({ name: zone.name, zip_codes: zone.zip_codes?.join(', ') || '', surcharge: zone.surcharge, travel_time: zone.travel_time }); setShowModal(true); }} className="text-sm text-blue-600 hover:underline flex items-center gap-1"><Edit2 size={14} /> Edit</button>
                <button onClick={() => handleDelete(zone.id)} className="text-sm text-red-600 hover:underline flex items-center gap-1"><Trash2 size={14} /> Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">{editing ? 'Edit Zone' : 'Add Service Zone'}</h2>
            </div>
            <div className="p-6 space-y-4">
              <input type="text" placeholder="Zone Name" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full border rounded-lg px-3 py-2" />
              <div>
                <label className="text-sm text-gray-600 block mb-1">ZIP Codes (comma separated)</label>
                <input type="text" placeholder="90210, 90211, 90212" value={formData.zip_codes} onChange={e => setFormData(prev => ({ ...prev, zip_codes: e.target.value }))} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Surcharge ($)</label>
                  <input type="number" value={formData.surcharge} onChange={e => setFormData(prev => ({ ...prev, surcharge: parseFloat(e.target.value) || 0 }))} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Travel Time (min)</label>
                  <input type="number" value={formData.travel_time} onChange={e => setFormData(prev => ({ ...prev, travel_time: parseInt(e.target.value) || 0 }))} className="w-full border rounded-lg px-3 py-2" />
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => { setShowModal(false); setEditing(null); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
