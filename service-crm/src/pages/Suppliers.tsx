import { useState, useEffect } from 'react';
import { Truck, Plus, Phone, Mail, MapPin, Trash2, Edit2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { useToast } from '../context/ToastContext';

type Supplier = {
  id: string;
  name: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  notes: string;
  is_active: boolean;
  created_at: string;
};

export default function Suppliers() {
  const { tenant } = useTenant();
  const { showToast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '', contact_name: '', email: '', phone: '', address: '', category: '', notes: ''
  });

  useEffect(() => {
    if (tenant?.id) loadSuppliers();
  }, [tenant?.id]);

  const loadSuppliers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('suppliers')
      .select('*')
      .eq('tenant_id', tenant!.id)
      .order('name');
    setSuppliers(data || []);
    setLoading(false);
  };

  const saveSupplier = async () => {
    if (!formData.name.trim()) {
      showToast('Supplier name is required', 'error');
      return;
    }

    const payload = { tenant_id: tenant!.id, ...formData, is_active: true };
    let error;
    
    if (editingId) {
      ({ error } = await supabase.from('suppliers').update(formData).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('suppliers').insert(payload));
    }

    if (error) {
      showToast('Failed to save supplier', 'error');
    } else {
      showToast(editingId ? 'Supplier updated' : 'Supplier added', 'success');
      resetForm();
      loadSuppliers();
    }
  };

  const deleteSupplier = async (id: string) => {
    if (!confirm('Delete this supplier?')) return;
    await supabase.from('suppliers').delete().eq('id', id);
    showToast('Supplier deleted', 'success');
    loadSuppliers();
  };

  const editSupplier = (supplier: Supplier) => {
    setFormData({
      name: supplier.name,
      contact_name: supplier.contact_name || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      category: supplier.category || '',
      notes: supplier.notes || ''
    });
    setEditingId(supplier.id);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '', contact_name: '', email: '', phone: '', address: '', category: '', notes: '' });
    setEditingId(null);
    setShowModal(false);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Truck className="text-orange-600" />
          Supplier Management
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
        >
          <Plus size={18} />
          Add Supplier
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      ) : suppliers.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
          <Truck size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No suppliers</h3>
          <p className="text-gray-500">Add your vendors and suppliers</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map(supplier => (
            <div key={supplier.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{supplier.name}</h3>
                  {supplier.category && (
                    <span className="text-xs px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded">
                      {supplier.category}
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => editSupplier(supplier)} className="p-1 text-gray-400 hover:text-blue-600">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => deleteSupplier(supplier.id)} className="p-1 text-gray-400 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                {supplier.contact_name && <p>{supplier.contact_name}</p>}
                {supplier.phone && (
                  <p className="flex items-center gap-1"><Phone size={12} /> {supplier.phone}</p>
                )}
                {supplier.email && (
                  <p className="flex items-center gap-1"><Mail size={12} /> {supplier.email}</p>
                )}
                {supplier.address && (
                  <p className="flex items-center gap-1"><MapPin size={12} /> {supplier.address}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingId ? 'Edit Supplier' : 'Add Supplier'}
              </h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <div className="space-y-3">
              <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" placeholder="Company Name *" />
              <input type="text" value={formData.contact_name} onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" placeholder="Contact Person" />
              <div className="grid grid-cols-2 gap-3">
                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" placeholder="Email" />
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" placeholder="Phone" />
              </div>
              <input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" placeholder="Address" />
              <input type="text" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" placeholder="Category (e.g., Supplies, Equipment)" />
              <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" rows={2} placeholder="Notes" />
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={resetForm} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg">Cancel</button>
              <button onClick={saveSupplier} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
