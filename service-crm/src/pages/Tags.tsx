import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { Tag, Plus, Edit2, Trash2 } from 'lucide-react';

type TagItem = {
  id: string;
  name: string;
  color: string;
  category: 'customer' | 'appointment' | 'lead';
  created_at: string;
};

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

export default function Tags() {
  const { tenant } = useTenant();
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState<TagItem | null>(null);
  const [formData, setFormData] = useState({ name: '', color: COLORS[0], category: 'customer' as TagItem['category'] });

  useEffect(() => {
    if (tenant) fetchTags();
  }, [tenant]);

  const fetchTags = async () => {
    const { data } = await supabase
      .from('tags')
      .select('*')
      .eq('tenant_id', tenant!.id)
      .order('category', { ascending: true });
    setTags(data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (editingTag) {
      await supabase.from('tags').update(formData).eq('id', editingTag.id);
    } else {
      await supabase.from('tags').insert({ ...formData, tenant_id: tenant!.id });
    }
    setShowModal(false);
    setEditingTag(null);
    setFormData({ name: '', color: COLORS[0], category: 'customer' });
    fetchTags();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this tag?')) {
      await supabase.from('tags').delete().eq('id', id);
      fetchTags();
    }
  };

  const grouped = {
    customer: tags.filter(t => t.category === 'customer'),
    appointment: tags.filter(t => t.category === 'appointment'),
    lead: tags.filter(t => t.category === 'lead')
  };

  if (!tenant) return <div className="p-8 text-center text-gray-500">Select a business first</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tags & Labels</h1>
        <button onClick={() => { setShowModal(true); setFormData({ name: '', color: COLORS[0], category: 'customer' }); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={20} /> Add Tag
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="space-y-6">
          {(['customer', 'appointment', 'lead'] as const).map(category => (
            <div key={category} className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 capitalize">{category} Tags</h2>
              {grouped[category].length === 0 ? (
                <p className="text-gray-500 text-sm">No tags in this category</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {grouped[category].map(tag => (
                    <div key={tag.id} className="flex items-center gap-2 px-3 py-1 rounded-full text-white text-sm" style={{ backgroundColor: tag.color }}>
                      <Tag size={14} />
                      <span>{tag.name}</span>
                      <button onClick={() => { setEditingTag(tag); setFormData({ name: tag.name, color: tag.color, category: tag.category }); setShowModal(true); }} className="hover:opacity-75"><Edit2 size={12} /></button>
                      <button onClick={() => handleDelete(tag.id)} className="hover:opacity-75"><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">{editingTag ? 'Edit Tag' : 'Add Tag'}</h2>
            </div>
            <div className="p-6 space-y-4">
              <input type="text" placeholder="Tag Name" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full border rounded-lg px-3 py-2" />
              <select value={formData.category} onChange={e => setFormData(prev => ({ ...prev, category: e.target.value as TagItem['category'] }))} className="w-full border rounded-lg px-3 py-2">
                <option value="customer">Customer</option>
                <option value="appointment">Appointment</option>
                <option value="lead">Lead</option>
              </select>
              <div>
                <label className="text-sm text-gray-600 block mb-2">Color</label>
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setFormData(prev => ({ ...prev, color: c }))} className={`w-8 h-8 rounded-full ${formData.color === c ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => { setShowModal(false); setEditingTag(null); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
