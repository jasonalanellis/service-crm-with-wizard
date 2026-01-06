import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { ClipboardList, Plus, Eye, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

type WorkOrder = {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to: string | null;
  appointment_id: string | null;
  due_date: string | null;
  created_at: string;
  assignee?: { name: string } | null;
};

export default function WorkOrders() {
  const { tenant } = useTenant();
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', priority: 'medium' as WorkOrder['priority'], due_date: '' });

  useEffect(() => {
    if (tenant) fetchOrders();
  }, [tenant]);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('work_orders')
      .select(`*, assignee:team_members(name)`)
      .eq('tenant_id', tenant!.id)
      .order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  const handleCreate = async () => {
    await supabase.from('work_orders').insert({ ...formData, tenant_id: tenant!.id, status: 'pending' });
    setShowModal(false);
    setFormData({ title: '', description: '', priority: 'medium', due_date: '' });
    fetchOrders();
  };

  const updateStatus = async (id: string, status: WorkOrder['status']) => {
    await supabase.from('work_orders').update({ status }).eq('id', id);
    fetchOrders();
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const priorityColor = (p: string) => {
    switch (p) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const statusIcon = (s: string) => {
    switch (s) {
      case 'completed': return <CheckCircle size={16} className="text-green-500" />;
      case 'in_progress': return <Clock size={16} className="text-blue-500" />;
      case 'pending': return <AlertTriangle size={16} className="text-yellow-500" />;
      default: return null;
    }
  };

  if (!tenant) return <div className="p-8 text-center text-gray-500">Select a business first</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Work Orders</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={20} /> Create Work Order
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {(['all', 'pending', 'in_progress', 'completed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <ClipboardList size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No work orders found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(order => {
            const assignee = Array.isArray(order.assignee) ? order.assignee[0] : order.assignee;
            return (
              <div key={order.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {statusIcon(order.status)}
                      <h3 className="font-medium text-gray-900">{order.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${priorityColor(order.priority)}`}>{order.priority}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{order.description}</p>
                    <div className="flex gap-4 text-xs text-gray-500">
                      {assignee && <span>Assigned: {assignee.name}</span>}
                      {order.due_date && <span>Due: {new Date(order.due_date).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {order.status === 'pending' && (
                      <button onClick={() => updateStatus(order.id, 'in_progress')} className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Start</button>
                    )}
                    {order.status === 'in_progress' && (
                      <button onClick={() => updateStatus(order.id, 'completed')} className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">Complete</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Create Work Order</h2>
            </div>
            <div className="p-6 space-y-4">
              <input type="text" placeholder="Title" value={formData.title} onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} className="w-full border rounded-lg px-3 py-2" />
              <textarea placeholder="Description" value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} className="w-full border rounded-lg px-3 py-2" rows={3} />
              <select value={formData.priority} onChange={e => setFormData(prev => ({ ...prev, priority: e.target.value as WorkOrder['priority'] }))} className="w-full border rounded-lg px-3 py-2">
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>
              <input type="date" value={formData.due_date} onChange={e => setFormData(prev => ({ ...prev, due_date: e.target.value }))} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
