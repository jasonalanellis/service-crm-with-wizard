import { useEffect, useState } from 'react';
import { supabase, Service, ServiceExtra, PricingTier } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { Plus, Edit2, Trash2, Clock, DollarSign, ChevronDown, ChevronRight, Package } from 'lucide-react';

export default function Services() {
  const { tenant } = useTenant();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'Residential' | 'Commercial' | 'Specialty'>('all');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Residential',
    base_price: 0,
    duration: 60
  });

  useEffect(() => {
    if (tenant) fetchServices();
  }, [tenant]);

  const fetchServices = async () => {
    if (!tenant) return;
    setLoading(true);
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('name');
    setServices(data || []);
    setLoading(false);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      category: service.category,
      base_price: service.base_price,
      duration: service.duration
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this service?')) {
      await supabase.from('services').delete().eq('id', id);
      setServices(services.filter(s => s.id !== id));
    }
  };

  const handleToggleActive = async (service: Service) => {
    const newActive = !service.is_active;
    await supabase.from('services').update({ is_active: newActive }).eq('id', service.id);
    setServices(services.map(s => s.id === service.id ? { ...s, is_active: newActive } : s));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    const serviceData = {
      tenant_id: tenant.id,
      name: formData.name,
      description: formData.description,
      category: formData.category,
      base_price: formData.base_price,
      duration: formData.duration,
      is_active: true,
      extras: editingService?.extras || [],
      pricing_tiers: editingService?.pricing_tiers || []
    };

    if (editingService) {
      const { data } = await supabase
        .from('services')
        .update(serviceData)
        .eq('id', editingService.id)
        .select()
        .single();
      if (data) setServices(services.map(s => s.id === editingService.id ? data : s));
    } else {
      const { data } = await supabase.from('services').insert(serviceData).select().single();
      if (data) setServices([data, ...services]);
    }

    setShowModal(false);
    setEditingService(null);
    setFormData({ name: '', description: '', category: 'Residential', base_price: 0, duration: 60 });
  };

  const filteredServices = activeTab === 'all' 
    ? services 
    : services.filter(s => s.category === activeTab);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours && mins) return `${hours}h ${mins}m`;
    if (hours) return `${hours}h`;
    return `${mins}m`;
  };

  if (!tenant) {
    return <div className="p-8 text-gray-500 dark:text-gray-400">Please select a business from the sidebar</div>;
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services Catalog</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage your service offerings and pricing</p>
        </div>
        <button
          onClick={() => {
            setEditingService(null);
            setFormData({ name: '', description: '', category: 'Residential', base_price: 0, duration: 60 });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Add Service
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {(['all', 'Residential', 'Commercial', 'Specialty'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${
              activeTab === tab 
                ? 'bg-blue-600 text-white' 
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {tab === 'all' ? 'All Services' : tab}
          </button>
        ))}
      </div>

      {/* Services List */}
      {loading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">No services found. Add your first service!</div>
      ) : (
        <div className="space-y-4">
          {filteredServices.map((service) => (
            <div key={service.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:bg-gray-900"
                onClick={() => setExpandedService(expandedService === service.id ? null : service.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${service.is_active ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <Package size={24} className={service.is_active ? 'text-blue-600' : 'text-gray-400'} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{service.name}</h3>
                      {!service.is_active && (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 dark:text-gray-400 rounded-full">Inactive</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{service.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="hidden sm:flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                    <span className="flex items-center gap-1">
                      <DollarSign size={16} />
                      From ${service.base_price}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={16} />
                      {formatDuration(service.duration)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(service); }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(service.id); }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                    {expandedService === service.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedService === service.id && (
                <div className="border-t p-4 bg-gray-50 dark:bg-gray-900">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Pricing Tiers */}
                    {service.pricing_tiers && service.pricing_tiers.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-3">Pricing Tiers</h4>
                        <div className="space-y-2">
                          {service.pricing_tiers.map((tier, i) => (
                            <div key={i} className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-lg">
                              <span className="text-gray-700">{tier.name}</span>
                              <span className="font-semibold text-green-600">${tier.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Extras */}
                    {service.extras && service.extras.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-3">Available Extras</h4>
                        <div className="space-y-2">
                          {service.extras.map((extra, i) => (
                            <div key={i} className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-lg">
                              <div>
                                <span className="text-gray-700">{extra.name}</span>
                                <span className="text-sm text-gray-400 ml-2">+{extra.duration}min</span>
                              </div>
                              <span className="font-semibold text-green-600">+${extra.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t flex gap-3">
                    <button
                      onClick={() => handleToggleActive(service)}
                      className={`px-4 py-2 rounded-lg ${
                        service.is_active 
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {service.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingService ? 'Edit Service' : 'Add Service'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Specialty">Specialty</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Base Price ($)</label>
                    <input
                      type="number"
                      value={formData.base_price}
                      onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg"
                      min="15"
                      step="15"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:bg-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingService ? 'Save Changes' : 'Add Service'}
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
