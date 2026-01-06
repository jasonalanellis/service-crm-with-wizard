import { useState, useEffect } from 'react';
import { DollarSign, Plus, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { useToast } from '../context/ToastContext';

type PriceRule = {
  id: string;
  name: string;
  type: 'discount' | 'surcharge';
  trigger: 'time' | 'day' | 'quantity' | 'customer' | 'service';
  condition: string;
  value: number;
  value_type: 'percent' | 'fixed';
  is_active: boolean;
  priority: number;
  created_at: string;
};

export default function PriceRules() {
  const { tenant } = useTenant();
  const { showToast } = useToast();
  const [rules, setRules] = useState<PriceRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'discount' as 'discount' | 'surcharge',
    trigger: 'time' as PriceRule['trigger'],
    condition: '',
    value: 10,
    value_type: 'percent' as 'percent' | 'fixed',
    priority: 1
  });

  useEffect(() => {
    if (tenant?.id) loadRules();
  }, [tenant?.id]);

  const loadRules = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('price_rules')
      .select('*')
      .eq('tenant_id', tenant!.id)
      .order('priority');
    setRules(data || []);
    setLoading(false);
  };

  const saveRule = async () => {
    if (!formData.name.trim() || !formData.condition.trim()) {
      showToast('Name and condition are required', 'error');
      return;
    }

    const { error } = await supabase.from('price_rules').insert({
      tenant_id: tenant!.id,
      ...formData,
      is_active: true
    });

    if (error) {
      showToast('Failed to save rule', 'error');
    } else {
      showToast('Price rule created', 'success');
      setShowModal(false);
      setFormData({ name: '', type: 'discount', trigger: 'time', condition: '', value: 10, value_type: 'percent', priority: 1 });
      loadRules();
    }
  };

  const toggleRule = async (rule: PriceRule) => {
    await supabase.from('price_rules').update({ is_active: !rule.is_active }).eq('id', rule.id);
    loadRules();
  };

  const deleteRule = async (id: string) => {
    if (!confirm('Delete this rule?')) return;
    await supabase.from('price_rules').delete().eq('id', id);
    showToast('Rule deleted', 'success');
    loadRules();
  };

  const TRIGGERS = [
    { value: 'time', label: 'Time-based', example: 'e.g., After 6 PM' },
    { value: 'day', label: 'Day of week', example: 'e.g., Weekends' },
    { value: 'quantity', label: 'Quantity', example: 'e.g., 3+ services' },
    { value: 'customer', label: 'Customer type', example: 'e.g., VIP segment' },
    { value: 'service', label: 'Service category', example: 'e.g., Premium services' },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <DollarSign className="text-green-600" />
          Price Rules Engine
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus size={18} />
          Create Rule
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : rules.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
          <DollarSign size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No pricing rules</h3>
          <p className="text-gray-500 mb-4">Create rules for dynamic pricing based on conditions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map(rule => (
            <div key={rule.id} className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow flex items-center justify-between ${!rule.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-4">
                <button onClick={() => toggleRule(rule)} className="text-gray-400">
                  {rule.is_active ? <ToggleRight size={24} className="text-green-500" /> : <ToggleLeft size={24} />}
                </button>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{rule.name}</h3>
                  <p className="text-sm text-gray-500">
                    {rule.trigger}: {rule.condition}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  rule.type === 'discount' 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                }`}>
                  {rule.type === 'discount' ? '-' : '+'}
                  {rule.value}{rule.value_type === 'percent' ? '%' : '$'}
                </span>
                <button onClick={() => deleteRule(rule.id)} className="text-gray-400 hover:text-red-600">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Price Rule</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rule Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  placeholder="e.g., Weekend Surcharge"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value="discount">Discount</option>
                    <option value="surcharge">Surcharge</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trigger</label>
                  <select
                    value={formData.trigger}
                    onChange={(e) => setFormData({...formData, trigger: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    {TRIGGERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Condition
                  <span className="text-gray-400 font-normal ml-1">
                    ({TRIGGERS.find(t => t.value === formData.trigger)?.example})
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.condition}
                  onChange={(e) => setFormData({...formData, condition: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Value</label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({...formData, value: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Value Type</label>
                  <select
                    value={formData.value_type}
                    onChange={(e) => setFormData({...formData, value_type: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg">Cancel</button>
              <button onClick={saveRule} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Create Rule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
