import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { useToast } from '../context/ToastContext';
import { Plus, Edit2, Trash2, Tag, Copy, Check } from 'lucide-react';

interface Coupon {
  id: string;
  tenant_id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_order?: number;
  max_uses?: number;
  used_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  description?: string;
  created_at: string;
}

export default function Coupons() {
  const { tenant } = useTenant();
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: 0,
    min_order: '',
    max_uses: '',
    valid_from: '',
    valid_until: '',
    description: ''
  });

  useEffect(() => {
    if (!tenant) return;
    fetchCoupons();
  }, [tenant]);

  const fetchCoupons = async () => {
    if (!tenant) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false });
    
    if (error) showToast('Failed to load coupons', 'error');
    setCoupons(data || []);
    setLoading(false);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      min_order: coupon.min_order?.toString() || '',
      max_uses: coupon.max_uses?.toString() || '',
      valid_from: coupon.valid_from,
      valid_until: coupon.valid_until,
      description: coupon.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (error) showToast('Failed to delete coupon', 'error');
    else { showToast('Coupon deleted', 'success'); fetchCoupons(); }
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    const { error } = await supabase.from('coupons').update({ is_active: !currentState }).eq('id', id);
    if (error) showToast('Failed to update coupon', 'error');
    else fetchCoupons();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    
    const couponData = {
      tenant_id: tenant.id,
      code: formData.code.toUpperCase(),
      type: formData.type,
      value: formData.value,
      min_order: formData.min_order ? parseFloat(formData.min_order) : null,
      max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
      valid_from: formData.valid_from,
      valid_until: formData.valid_until,
      is_active: true,
      description: formData.description || null
    };

    if (editingCoupon) {
      const { error } = await supabase.from('coupons').update(couponData).eq('id', editingCoupon.id);
      if (error) showToast('Failed to update coupon', 'error');
      else { showToast('Coupon updated', 'success'); fetchCoupons(); }
    } else {
      const { error } = await supabase.from('coupons').insert({ ...couponData, used_count: 0 });
      if (error) showToast('Failed to create coupon', 'error');
      else { showToast('Coupon created', 'success'); fetchCoupons(); }
    }

    setShowModal(false);
    setEditingCoupon(null);
    setFormData({ code: '', type: 'percentage', value: 0, min_order: '', max_uses: '', valid_from: '', valid_until: '', description: '' });
  };

  const isExpired = (date: string) => new Date(date) < new Date();

  if (!tenant) {
    return <div className="p-8 text-gray-500">Please select a business from the sidebar</div>;
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupons & Discounts</h1>
          <p className="text-gray-600">Manage promotional codes and discounts</p>
        </div>
        <button
          onClick={() => {
            setEditingCoupon(null);
            setFormData({
              code: '',
              type: 'percentage',
              value: 0,
              min_order: '',
              max_uses: '',
              valid_from: new Date().toISOString().split('T')[0],
              valid_until: '',
              description: ''
            });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Create Coupon
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Coupons</p>
          <p className="text-2xl font-bold text-gray-900">{coupons.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{coupons.filter(c => c.is_active && !isExpired(c.valid_until)).length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Uses</p>
          <p className="text-2xl font-bold text-blue-600">{coupons.reduce((sum, c) => sum + (c.used_count || 0), 0)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Expired</p>
          <p className="text-2xl font-bold text-gray-400">{coupons.filter(c => isExpired(c.valid_until)).length}</p>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : coupons.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No coupons yet. Create your first coupon!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-600">Code</th>
                  <th className="text-left p-4 font-medium text-gray-600">Discount</th>
                  <th className="text-left p-4 font-medium text-gray-600 hidden md:table-cell">Min Order</th>
                  <th className="text-left p-4 font-medium text-gray-600 hidden lg:table-cell">Usage</th>
                  <th className="text-left p-4 font-medium text-gray-600 hidden md:table-cell">Valid Until</th>
                  <th className="text-left p-4 font-medium text-gray-600">Status</th>
                  <th className="text-right p-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Tag size={16} className="text-blue-600" />
                        <span className="font-mono font-medium">{coupon.code}</span>
                        <button
                          onClick={() => handleCopyCode(coupon.code)}
                          className="p-1 text-gray-400 hover:text-blue-600"
                          title="Copy code"
                        >
                          {copiedCode === coupon.code ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                        </button>
                      </div>
                      {coupon.description && (
                        <p className="text-sm text-gray-500 mt-1">{coupon.description}</p>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-green-600">
                        {coupon.type === 'percentage' ? `${coupon.value}%` : `$${coupon.value}`}
                      </span>
                    </td>
                    <td className="p-4 hidden md:table-cell text-gray-600">
                      {coupon.min_order ? `$${coupon.min_order}` : '-'}
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <span className="text-gray-900">{coupon.used_count || 0}</span>
                      {coupon.max_uses && (
                        <span className="text-gray-400"> / {coupon.max_uses}</span>
                      )}
                    </td>
                    <td className="p-4 hidden md:table-cell text-gray-600">
                      {new Date(coupon.valid_until).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      {isExpired(coupon.valid_until) ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">Expired</span>
                      ) : coupon.max_uses && coupon.used_count >= coupon.max_uses ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700">Maxed Out</span>
                      ) : coupon.is_active ? (
                        <button
                          onClick={() => handleToggleActive(coupon.id, coupon.is_active)}
                          className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 hover:bg-green-200"
                        >
                          Active
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleActive(coupon.id, coupon.is_active)}
                          className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600 hover:bg-gray-200"
                        >
                          Inactive
                        </button>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(coupon)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border rounded-lg font-mono uppercase"
                    placeholder="e.g., SUMMER25"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as 'percentage' | 'fixed' })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount ($)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                    <input
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg"
                      min="0"
                      max={formData.type === 'percentage' ? 100 : undefined}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Order ($)</label>
                    <input
                      type="number"
                      value={formData.min_order}
                      onChange={(e) => setFormData({ ...formData, min_order: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses</label>
                    <input
                      type="number"
                      value={formData.max_uses}
                      onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Unlimited"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
                    <input
                      type="date"
                      value={formData.valid_from}
                      onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                    <input
                      type="date"
                      value={formData.valid_until}
                      onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., Summer promotion"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingCoupon ? 'Save Changes' : 'Create Coupon'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
