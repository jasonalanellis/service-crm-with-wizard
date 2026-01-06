import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { HardDrive, Plus, Edit2, Trash2, AlertTriangle, Calendar } from 'lucide-react';

type Equipment = {
  id: string;
  name: string;
  serial_number: string;
  customer_id: string | null;
  status: 'active' | 'maintenance' | 'retired';
  last_service_date: string | null;
  next_service_date: string | null;
  notes: string;
  created_at: string;
  customer?: { name: string } | null;
};

export default function Equipment() {
  const { tenant } = useTenant();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Equipment | null>(null);
  const [formData, setFormData] = useState({ name: '', serial_number: '', customer_id: '', status: 'active' as Equipment['status'], notes: '', next_service_date: '' });
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (tenant) {
      fetchEquipment();
      fetchCustomers();
    }
  }, [tenant]);

  const fetchEquipment = async () => {
    const { data } = await supabase
      .from('equipment')
      .select(`*, customer:customers(name)`)
      .eq('tenant_id', tenant!.id)
      .order('created_at', { ascending: false });
    setEquipment(data || []);
    setLoading(false);
  };

  const fetchCustomers = async () => {
    const { data } = await supabase.from('customers').select('id, name').eq('tenant_id', tenant!.id);
    setCustomers(data || []);
  };

  const handleSave = async () => {
    const payload = { ...formData, customer_id: formData.customer_id || null, next_service_date: formData.next_service_date || null };
    if (editing) {
      await supabase.from('equipment').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('equipment').insert({ ...payload, tenant_id: tenant!.id });
    }
    setShowModal(false);
    setEditing(null);
    setFormData({ name: '', serial_number: '', customer_id: '', status: 'active', notes: '', next_service_date: '' });
    fetchEquipment();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this equipment?')) {
      await supabase.from('equipment').delete().eq('id', id);
      fetchEquipment();
    }
  };

  const needsService = (item: Equipment) => {
    if (!item.next_service_date) return false;
    return new Date(item.next_service_date) <= new Date();
  };

  if (!tenant) return <div className="p-8 text-center text-gray-500">Select a business first</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Equipment Tracking</h1>
        <button onClick={() => { setShowModal(true); setFormData({ name: '', serial_number: '', customer_id: '', status: 'active', notes: '', next_service_date: '' }); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={20} /> Add Equipment
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : equipment.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <HardDrive size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No equipment tracked</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serial #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {equipment.map(item => {
                const customer = Array.isArray(item.customer) ? item.customer[0] : item.customer;
                const overdue = needsService(item);
                return (
                  <tr key={item.id} className={overdue ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {overdue && <AlertTriangle size={16} className="text-red-500" />}
                        <span className="font-medium text-gray-900">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.serial_number}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{customer?.name || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded ${item.status === 'active' ? 'bg-green-100 text-green-800' : item.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{item.status}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.next_service_date ? new Date(item.next_service_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => { setEditing(item); setFormData({ name: item.name, serial_number: item.serial_number || '', customer_id: item.customer_id || '', status: item.status, notes: item.notes || '', next_service_date: item.next_service_date || '' }); setShowModal(true); }} className="text-blue-600 hover:text-blue-800"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">{editing ? 'Edit Equipment' : 'Add Equipment'}</h2>
            </div>
            <div className="p-6 space-y-4">
              <input type="text" placeholder="Equipment Name" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full border rounded-lg px-3 py-2" />
              <input type="text" placeholder="Serial Number" value={formData.serial_number} onChange={e => setFormData(prev => ({ ...prev, serial_number: e.target.value }))} className="w-full border rounded-lg px-3 py-2" />
              <select value={formData.customer_id} onChange={e => setFormData(prev => ({ ...prev, customer_id: e.target.value }))} className="w-full border rounded-lg px-3 py-2">
                <option value="">No Customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={formData.status} onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as Equipment['status'] }))} className="w-full border rounded-lg px-3 py-2">
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="retired">Retired</option>
              </select>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Next Service Date</label>
                <input type="date" value={formData.next_service_date} onChange={e => setFormData(prev => ({ ...prev, next_service_date: e.target.value }))} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <textarea placeholder="Notes" value={formData.notes} onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))} className="w-full border rounded-lg px-3 py-2" rows={2} />
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
