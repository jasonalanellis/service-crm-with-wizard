import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { Plus, Edit2, Trash2, Eye, Copy } from 'lucide-react';

type FormField = {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'date';
  required: boolean;
  options?: string[];
};

type CustomForm = {
  id: string;
  name: string;
  description: string;
  fields: FormField[];
  is_active: boolean;
  created_at: string;
};

export default function CustomForms() {
  const { tenant } = useTenant();
  const [forms, setForms] = useState<CustomForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingForm, setEditingForm] = useState<CustomForm | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', fields: [] as FormField[] });

  useEffect(() => {
    if (tenant) fetchForms();
  }, [tenant]);

  const fetchForms = async () => {
    const { data } = await supabase
      .from('custom_forms')
      .select('*')
      .eq('tenant_id', tenant!.id)
      .order('created_at', { ascending: false });
    setForms(data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (editingForm) {
      await supabase.from('custom_forms').update({ ...formData }).eq('id', editingForm.id);
    } else {
      await supabase.from('custom_forms').insert({ ...formData, tenant_id: tenant!.id, is_active: true });
    }
    setShowModal(false);
    setEditingForm(null);
    setFormData({ name: '', description: '', fields: [] });
    fetchForms();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this form?')) {
      await supabase.from('custom_forms').delete().eq('id', id);
      fetchForms();
    }
  };

  const addField = () => {
    const newField: FormField = { id: crypto.randomUUID(), label: '', type: 'text', required: false };
    setFormData(prev => ({ ...prev, fields: [...prev.fields, newField] }));
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map(f => f.id === id ? { ...f, ...updates } : f)
    }));
  };

  const removeField = (id: string) => {
    setFormData(prev => ({ ...prev, fields: prev.fields.filter(f => f.id !== id) }));
  };

  if (!tenant) return <div className="p-8 text-center text-gray-500">Select a business first</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Custom Forms</h1>
        <button onClick={() => { setShowModal(true); setFormData({ name: '', description: '', fields: [] }); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={20} /> Create Form
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : forms.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No custom forms yet</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {forms.map(form => (
            <div key={form.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900">{form.name}</h3>
                <span className={`text-xs px-2 py-1 rounded ${form.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {form.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{form.description}</p>
              <p className="text-xs text-gray-500 mb-3">{form.fields?.length || 0} fields</p>
              <div className="flex gap-2">
                <button onClick={() => { setEditingForm(form); setFormData({ name: form.name, description: form.description, fields: form.fields || [] }); setShowModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                <button onClick={() => handleDelete(form.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">{editingForm ? 'Edit Form' : 'Create Form'}</h2>
            </div>
            <div className="p-6 space-y-4">
              <input type="text" placeholder="Form Name" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full border rounded-lg px-3 py-2" />
              <textarea placeholder="Description" value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} className="w-full border rounded-lg px-3 py-2" rows={2} />
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Fields</h3>
                  <button onClick={addField} className="text-sm text-blue-600 hover:underline">+ Add Field</button>
                </div>
                {formData.fields.map((field, idx) => (
                  <div key={field.id} className="flex gap-2 items-start bg-gray-50 p-3 rounded">
                    <input type="text" placeholder="Label" value={field.label} onChange={e => updateField(field.id, { label: e.target.value })} className="flex-1 border rounded px-2 py-1 text-sm" />
                    <select value={field.type} onChange={e => updateField(field.id, { type: e.target.value as FormField['type'] })} className="border rounded px-2 py-1 text-sm">
                      <option value="text">Text</option>
                      <option value="textarea">Textarea</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="select">Select</option>
                      <option value="checkbox">Checkbox</option>
                    </select>
                    <label className="flex items-center gap-1 text-sm">
                      <input type="checkbox" checked={field.required} onChange={e => updateField(field.id, { required: e.target.checked })} /> Req
                    </label>
                    <button onClick={() => removeField(field.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => { setShowModal(false); setEditingForm(null); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
