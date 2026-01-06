import { useState, useEffect } from 'react';
import { Shield, Plus, Clock, AlertTriangle, CheckCircle, X, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { useToast } from '../context/ToastContext';

type SLA = {
  id: string;
  name: string;
  description: string;
  response_time_hours: number;
  resolution_time_hours: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  applies_to: string;
  is_active: boolean;
  created_at: string;
};

export default function SLAs() {
  const { tenant } = useTenant();
  const { showToast } = useToast();
  const [slas, setSLAs] = useState<SLA[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    response_time_hours: 4,
    resolution_time_hours: 24,
    priority: 'medium' as SLA['priority'],
    applies_to: 'all'
  });

  useEffect(() => {
    if (tenant?.id) loadSLAs();
  }, [tenant?.id]);

  const loadSLAs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('slas')
      .select('*')
      .eq('tenant_id', tenant!.id)
      .order('priority');
    setSLAs(data || []);
    setLoading(false);
  };

  const saveSLA = async () => {
    if (!formData.name.trim()) {
      showToast('SLA name is required', 'error');
      return;
    }

    const { error } = await supabase.from('slas').insert({
      tenant_id: tenant!.id,
      ...formData,
      is_active: true
    });

    if (error) {
      showToast('Failed to save SLA', 'error');
    } else {
      showToast('SLA created', 'success');
      setShowModal(false);
      setFormData({ name: '', description: '', response_time_hours: 4, resolution_time_hours: 24, priority: 'medium', applies_to: 'all' });
      loadSLAs();
    }
  };

  const deleteSLA = async (id: string) => {
    if (!confirm('Delete this SLA?')) return;
    await supabase.from('slas').delete().eq('id', id);
    showToast('SLA deleted', 'success');
    loadSLAs();
  };

  const getPriorityColor = (priority: SLA['priority']) => {
    const colors = {
      low: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    };
    return colors[priority];
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Shield className="text-purple-600" />
          Service Level Agreements
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Plus size={18} />
          Create SLA
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : slas.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
          <Shield size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No SLAs defined</h3>
          <p className="text-gray-500">Create service level agreements to set expectations</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {slas.map(sla => (
            <div key={sla.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{sla.name}</h3>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${getPriorityColor(sla.priority)}`}>
                    {sla.priority} priority
                  </span>
                </div>
                <button onClick={() => deleteSLA(sla.id)} className="text-gray-400 hover:text-red-600">
                  <Trash2 size={16} />
                </button>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{sla.description || 'No description'}</p>
              
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-blue-500" />
                  <div>
                    <p className="text-xs text-gray-500">Response Time</p>
                    <p className="font-medium text-gray-900 dark:text-white">{sla.response_time_hours}h</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  <div>
                    <p className="text-xs text-gray-500">Resolution Time</p>
                    <p className="font-medium text-gray-900 dark:text-white">{sla.resolution_time_hours}h</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create SLA</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SLA Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  placeholder="e.g., Standard Support" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                <select value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Response Time (hours)</label>
                  <input type="number" value={formData.response_time_hours} onChange={(e) => setFormData({...formData, response_time_hours: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Resolution Time (hours)</label>
                  <input type="number" value={formData.resolution_time_hours} onChange={(e) => setFormData({...formData, resolution_time_hours: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" rows={2} />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg">Cancel</button>
              <button onClick={saveSLA} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Create SLA</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
