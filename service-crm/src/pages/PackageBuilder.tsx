import { useState, useEffect } from 'react';
import { Package, Plus, Trash2, DollarSign, Percent, Save, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { useToast } from '../context/ToastContext';

type Service = { id: string; name: string; price: number; duration: number };
type PackageItem = { service_id: string; service_name: string; quantity: number };
type ServicePackage = {
  id: string;
  name: string;
  description: string;
  items: PackageItem[];
  regular_price: number;
  package_price: number;
  discount_percent: number;
  is_active: boolean;
};

export default function PackageBuilder() {
  const { tenant } = useTenant();
  const { showToast } = useToast();
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    items: [] as PackageItem[],
    discount_percent: 10
  });

  useEffect(() => {
    if (tenant?.id) loadData();
  }, [tenant?.id]);

  const loadData = async () => {
    setLoading(true);
    const [packagesRes, servicesRes] = await Promise.all([
      supabase.from('service_packages').select('*').eq('tenant_id', tenant!.id).order('name'),
      supabase.from('services').select('id, name, price, duration').eq('tenant_id', tenant!.id)
    ]);
    setPackages(packagesRes.data || []);
    setServices(servicesRes.data || []);
    setLoading(false);
  };

  const calculatePrices = (items: PackageItem[], discountPercent: number) => {
    const regularPrice = items.reduce((sum, item) => {
      const service = services.find(s => s.id === item.service_id);
      return sum + (service?.price || 0) * item.quantity;
    }, 0);
    const packagePrice = regularPrice * (1 - discountPercent / 100);
    return { regularPrice, packagePrice };
  };

  const addService = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;
    
    const existing = formData.items.find(i => i.service_id === serviceId);
    if (existing) {
      setFormData({
        ...formData,
        items: formData.items.map(i => 
          i.service_id === serviceId ? {...i, quantity: i.quantity + 1} : i
        )
      });
    } else {
      setFormData({
        ...formData,
        items: [...formData.items, { service_id: serviceId, service_name: service.name, quantity: 1 }]
      });
    }
  };

  const removeItem = (serviceId: string) => {
    setFormData({
      ...formData,
      items: formData.items.filter(i => i.service_id !== serviceId)
    });
  };

  const savePackage = async () => {
    if (!formData.name.trim() || formData.items.length === 0) {
      showToast('Name and at least one service are required', 'error');
      return;
    }

    const { regularPrice, packagePrice } = calculatePrices(formData.items, formData.discount_percent);

    const { error } = await supabase.from('service_packages').insert({
      tenant_id: tenant!.id,
      name: formData.name,
      description: formData.description,
      items: formData.items,
      regular_price: regularPrice,
      package_price: packagePrice,
      discount_percent: formData.discount_percent,
      is_active: true
    });

    if (error) {
      showToast('Failed to save package', 'error');
    } else {
      showToast('Package created', 'success');
      setShowModal(false);
      setFormData({ name: '', description: '', items: [], discount_percent: 10 });
      loadData();
    }
  };

  const toggleActive = async (pkg: ServicePackage) => {
    await supabase.from('service_packages').update({ is_active: !pkg.is_active }).eq('id', pkg.id);
    loadData();
  };

  const deletePackage = async (id: string) => {
    if (!confirm('Delete this package?')) return;
    await supabase.from('service_packages').delete().eq('id', id);
    showToast('Package deleted', 'success');
    loadData();
  };

  const { regularPrice, packagePrice } = calculatePrices(formData.items, formData.discount_percent);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Package className="text-indigo-600" />
          Package Builder
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus size={18} />
          Create Package
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : packages.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
          <Package size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No packages yet</h3>
          <p className="text-gray-500 mb-4">Bundle services together with discounts</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map(pkg => (
            <div key={pkg.id} className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow ${!pkg.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">{pkg.name}</h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => toggleActive(pkg)}
                    className={`text-xs px-2 py-1 rounded ${pkg.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                  >
                    {pkg.is_active ? 'Active' : 'Inactive'}
                  </button>
                  <button onClick={() => deletePackage(pkg.id)} className="text-gray-400 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{pkg.description || 'No description'}</p>
              
              <div className="space-y-1 mb-3">
                {pkg.items?.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{item.service_name} x{item.quantity}</span>
                  </div>
                ))}
              </div>
              
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-500 line-through">${pkg.regular_price?.toFixed(2)}</span>
                  <span className="ml-2 text-xl font-bold text-indigo-600">${pkg.package_price?.toFixed(2)}</span>
                </div>
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs font-medium">
                  {pkg.discount_percent}% OFF
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Package</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Package Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  placeholder="e.g., Premium Bundle"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Add Services</label>
                <select
                  onChange={(e) => { addService(e.target.value); e.target.value = ''; }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                >
                  <option value="">Select service to add</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name} - ${s.price}</option>)}
                </select>
              </div>

              {formData.items.length > 0 && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Included Services</h4>
                  {formData.items.map((item, i) => {
                    const service = services.find(s => s.id === item.service_id);
                    return (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                        <span className="text-sm text-gray-900 dark:text-white">{item.service_name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">${((service?.price || 0) * item.quantity).toFixed(2)}</span>
                          <button onClick={() => removeItem(item.service_id)} className="text-red-500 hover:text-red-600">
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Discount: {formData.discount_percent}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={formData.discount_percent}
                  onChange={(e) => setFormData({...formData, discount_percent: parseInt(e.target.value)})}
                  className="w-full"
                />
              </div>

              {formData.items.length > 0 && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Regular Price:</span>
                    <span className="text-gray-500 line-through">${regularPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900 dark:text-white">Package Price:</span>
                    <span className="text-xl font-bold text-indigo-600">${packagePrice.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={savePackage}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Save Package
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
