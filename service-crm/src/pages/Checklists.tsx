import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { CheckSquare, Plus, Edit2, Trash2, Copy } from 'lucide-react';

type ChecklistItem = { id: string; text: string; required: boolean };
type Checklist = {
  id: string;
  name: string;
  description: string;
  items: ChecklistItem[];
  service_id: string | null;
  is_active: boolean;
  created_at: string;
};

export default function Checklists() {
  const { tenant } = useTenant();
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Checklist | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', service_id: '', items: [] as ChecklistItem[] });

  useEffect(() => {
    if (tenant) {
      fetchChecklists();
      fetchServices();
    }
  }, [tenant]);

  const fetchChecklists = async () => {
    const { data } = await supabase
      .from('checklists')
      .select('*')
      .eq('tenant_id', tenant!.id)
      .order('created_at', { ascending: false });
    setChecklists(data || []);
    setLoading(false);
  };

  const fetchServices = async () => {
    const { data } = await supabase.from('services').select('id, name').eq('tenant_id', tenant!.id);
    setServices(data || []);
  };

  const handleSave = async () => {
    const payload = { ...formData, service_id: formData.service_id || null };
    if (editing) {
      await supabase.from('checklists').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('checklists').insert({ ...payload, tenant_id: tenant!.id, is_active: true });
    }
    setShowModal(false);
    setEditing(null);
    setFormData({ name: '', description: '', service_id: '', items: [] });
    fetchChecklists();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this checklist?')) {
      await supabase.from('checklists').delete().eq('id', id);
      fetchChecklists();
    }
  };

  const addItem = () => {
    const newItem: ChecklistItem = { id: crypto.randomUUID(), text: '', required: false };
    setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const updateItem = (id: string, updates: Partial<ChecklistItem>) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === id ? { ...i, ...updates } : i)
    }));
  };

  const removeItem = (id: string) => {
    setFormData(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
  };

  const duplicateChecklist = async (checklist: Checklist) => {
    await supabase.from('checklists').insert({
      ...checklist,
      id: undefined,
      name: `${checklist.name} (Copy)`,
      tenant_id: tenant!.id,
      created_at: undefined
    });
    fetchChecklists();
  };

  if (!tenant) return <div className="p-8 text-center text-gray-500">Select a business first</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Service Checklists</h1>
        <button onClick={() => { setShowModal(true); setFormData({ name: '', description: '', service_id: '', items: [] }); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={20} /> Create Checklist
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : checklists.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <CheckSquare size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No checklists yet</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {checklists.map(checklist => (
            <div key={checklist.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900">{checklist.name}</h3>
                <span className={`text-xs px-2 py-1 rounded ${checklist.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {checklist.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{checklist.description}</p>
              <p className="text-xs text-gray-500 mb-3">{checklist.items?.length || 0} items</p>
              <div className="flex gap-2 pt-2 border-t">
                <button onClick={() => { setEditing(checklist); setFormData({ name: checklist.name, description: checklist.description || '', service_id: checklist.service_id || '', items: checklist.items || [] }); setShowModal(true); }} className="text-sm text-blue-600 hover:underline flex items-center gap-1"><Edit2 size={14} /> Edit</button>
                <button onClick={() => duplicateChecklist(checklist)} className="text-sm text-gray-600 hover:underline flex items-center gap-1"><Copy size={14} /> Copy</button>
                <button onClick={() => handleDelete(checklist.id)} className="text-sm text-red-600 hover:underline flex items-center gap-1"><Trash2 size={14} /> Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">{editing ? 'Edit Checklist' : 'Create Checklist'}</h2>
            </div>
            <div className="p-6 space-y-4">
              <input type="text" placeholder="Checklist Name" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full border rounded-lg px-3 py-2" />
              <textarea placeholder="Description" value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} className="w-full border rounded-lg px-3 py-2" rows={2} />
              <select value={formData.service_id} onChange={e => setFormData(prev => ({ ...prev, service_id: e.target.value }))} className="w-full border rounded-lg px-3 py-2">
                <option value="">All Services</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Checklist Items</h3>
                  <button onClick={addItem} className="text-sm text-blue-600 hover:underline">+ Add Item</button>
                </div>
                {formData.items.map((item, idx) => (
                  <div key={item.id} className="flex gap-2 items-center bg-gray-50 p-2 rounded">
                    <span className="text-xs text-gray-400 w-6">{idx + 1}.</span>
                    <input type="text" placeholder="Item text" value={item.text} onChange={e => updateItem(item.id, { text: e.target.value })} className="flex-1 border rounded px-2 py-1 text-sm" />
                    <label className="flex items-center gap-1 text-xs">
                      <input type="checkbox" checked={item.required} onChange={e => updateItem(item.id, { required: e.target.checked })} /> Required
                    </label>
                    <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                  </div>
                ))}
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
