import { useState } from 'react';
import { Plus, Edit2, Trash2, Tag, Copy, Check } from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrder?: number;
  maxUses?: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  description?: string;
}

const mockCoupons: Coupon[] = [
  {
    id: '1',
    code: 'WELCOME20',
    type: 'percentage',
    value: 20,
    minOrder: 100,
    maxUses: 100,
    usedCount: 45,
    validFrom: '2026-01-01',
    validUntil: '2026-03-31',
    isActive: true,
    description: 'New customer discount'
  },
  {
    id: '2',
    code: 'SPRING50',
    type: 'fixed',
    value: 50,
    minOrder: 200,
    maxUses: 50,
    usedCount: 12,
    validFrom: '2026-03-01',
    validUntil: '2026-05-31',
    isActive: true,
    description: 'Spring cleaning special'
  },
  {
    id: '3',
    code: 'LOYALTY15',
    type: 'percentage',
    value: 15,
    usedCount: 89,
    validFrom: '2025-01-01',
    validUntil: '2026-12-31',
    isActive: true,
    description: 'Returning customer reward'
  },
  {
    id: '4',
    code: 'EXPIRED10',
    type: 'percentage',
    value: 10,
    maxUses: 20,
    usedCount: 20,
    validFrom: '2025-01-01',
    validUntil: '2025-12-31',
    isActive: false,
    description: 'Old promo - expired'
  }
];

export default function Coupons() {
  const [coupons, setCoupons] = useState<Coupon[]>(mockCoupons);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: 0,
    minOrder: '',
    maxUses: '',
    validFrom: '',
    validUntil: '',
    description: ''
  });

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
      minOrder: coupon.minOrder?.toString() || '',
      maxUses: coupon.maxUses?.toString() || '',
      validFrom: coupon.validFrom,
      validUntil: coupon.validUntil,
      description: coupon.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this coupon?')) {
      setCoupons(coupons.filter(c => c.id !== id));
    }
  };

  const handleToggleActive = (id: string) => {
    setCoupons(coupons.map(c => 
      c.id === id ? { ...c, isActive: !c.isActive } : c
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const couponData: Coupon = {
      id: editingCoupon?.id || Date.now().toString(),
      code: formData.code.toUpperCase(),
      type: formData.type,
      value: formData.value,
      minOrder: formData.minOrder ? parseInt(formData.minOrder) : undefined,
      maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
      usedCount: editingCoupon?.usedCount || 0,
      validFrom: formData.validFrom,
      validUntil: formData.validUntil,
      isActive: true,
      description: formData.description || undefined
    };

    if (editingCoupon) {
      setCoupons(coupons.map(c => c.id === editingCoupon.id ? couponData : c));
    } else {
      setCoupons([couponData, ...coupons]);
    }

    setShowModal(false);
    setEditingCoupon(null);
    setFormData({
      code: '',
      type: 'percentage',
      value: 0,
      minOrder: '',
      maxUses: '',
      validFrom: '',
      validUntil: '',
      description: ''
    });
  };

  const isExpired = (date: string) => new Date(date) < new Date();

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
              minOrder: '',
              maxUses: '',
              validFrom: new Date().toISOString().split('T')[0],
              validUntil: '',
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
          <p className="text-2xl font-bold text-green-600">{coupons.filter(c => c.isActive && !isExpired(c.validUntil)).length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Uses</p>
          <p className="text-2xl font-bold text-blue-600">{coupons.reduce((sum, c) => sum + c.usedCount, 0)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Expired</p>
          <p className="text-2xl font-bold text-gray-400">{coupons.filter(c => isExpired(c.validUntil)).length}</p>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
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
                    {coupon.minOrder ? `$${coupon.minOrder}` : '-'}
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    <span className="text-gray-900">{coupon.usedCount}</span>
                    {coupon.maxUses && (
                      <span className="text-gray-400"> / {coupon.maxUses}</span>
                    )}
                  </td>
                  <td className="p-4 hidden md:table-cell text-gray-600">
                    {new Date(coupon.validUntil).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    {isExpired(coupon.validUntil) ? (
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">Expired</span>
                    ) : coupon.maxUses && coupon.usedCount >= coupon.maxUses ? (
                      <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700">Maxed Out</span>
                    ) : coupon.isActive ? (
                      <button
                        onClick={() => handleToggleActive(coupon.id)}
                        className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 hover:bg-green-200"
                      >
                        Active
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleActive(coupon.id)}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Coupon Code
                  </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Type
                    </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Value
                    </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Order ($)
                    </label>
                    <input
                      type="number"
                      value={formData.minOrder}
                      onChange={(e) => setFormData({ ...formData, minOrder: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Uses
                    </label>
                    <input
                      type="number"
                      value={formData.maxUses}
                      onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Unlimited"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valid From
                    </label>
                    <input
                      type="date"
                      value={formData.validFrom}
                      onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valid Until
                    </label>
                    <input
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
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
