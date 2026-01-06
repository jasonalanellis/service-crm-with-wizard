import { useState } from 'react';
import { Plus, Edit2, Trash2, Clock, DollarSign, ChevronDown, ChevronRight, Package } from 'lucide-react';

interface ServiceExtra {
  id: string;
  name: string;
  price: number;
  duration: number; // minutes
}

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  duration: number; // minutes
  isActive: boolean;
  extras: ServiceExtra[];
  pricingTiers?: { name: string; bedrooms: number; bathrooms: number; price: number }[];
}

const mockServices: Service[] = [
  {
    id: '1',
    name: 'Standard Cleaning',
    description: 'Regular house cleaning service',
    category: 'Residential',
    basePrice: 120,
    duration: 120,
    isActive: true,
    extras: [
      { id: 'e1', name: 'Inside Fridge', price: 35, duration: 20 },
      { id: 'e2', name: 'Inside Oven', price: 30, duration: 15 },
      { id: 'e3', name: 'Laundry', price: 25, duration: 30 },
    ],
    pricingTiers: [
      { name: '1BR/1BA', bedrooms: 1, bathrooms: 1, price: 100 },
      { name: '2BR/1BA', bedrooms: 2, bathrooms: 1, price: 120 },
      { name: '2BR/2BA', bedrooms: 2, bathrooms: 2, price: 140 },
      { name: '3BR/2BA', bedrooms: 3, bathrooms: 2, price: 170 },
      { name: '4BR/3BA', bedrooms: 4, bathrooms: 3, price: 210 },
    ]
  },
  {
    id: '2',
    name: 'Deep Cleaning',
    description: 'Thorough top-to-bottom cleaning',
    category: 'Residential',
    basePrice: 220,
    duration: 240,
    isActive: true,
    extras: [
      { id: 'e4', name: 'Inside Cabinets', price: 50, duration: 30 },
      { id: 'e5', name: 'Baseboards', price: 40, duration: 25 },
    ],
    pricingTiers: [
      { name: '1BR/1BA', bedrooms: 1, bathrooms: 1, price: 180 },
      { name: '2BR/1BA', bedrooms: 2, bathrooms: 1, price: 220 },
      { name: '2BR/2BA', bedrooms: 2, bathrooms: 2, price: 260 },
      { name: '3BR/2BA', bedrooms: 3, bathrooms: 2, price: 320 },
      { name: '4BR/3BA', bedrooms: 4, bathrooms: 3, price: 400 },
    ]
  },
  {
    id: '3',
    name: 'Move In/Out Cleaning',
    description: 'Complete cleaning for moving',
    category: 'Residential',
    basePrice: 280,
    duration: 300,
    isActive: true,
    extras: [
      { id: 'e6', name: 'Garage Sweep', price: 45, duration: 30 },
      { id: 'e7', name: 'Window Cleaning', price: 60, duration: 45 },
    ],
    pricingTiers: []
  },
  {
    id: '4',
    name: 'Office Cleaning',
    description: 'Commercial office cleaning',
    category: 'Commercial',
    basePrice: 150,
    duration: 120,
    isActive: true,
    extras: [],
    pricingTiers: []
  },
  {
    id: '5',
    name: 'Carpet Cleaning',
    description: 'Professional carpet deep clean',
    category: 'Specialty',
    basePrice: 100,
    duration: 60,
    isActive: false,
    extras: [
      { id: 'e8', name: 'Stain Treatment', price: 25, duration: 15 },
    ],
    pricingTiers: []
  }
];

export default function Services() {
  const [services, setServices] = useState<Service[]>(mockServices);
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'Residential' | 'Commercial' | 'Specialty'>('all');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Residential',
    basePrice: 0,
    duration: 60
  });

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      category: service.category,
      basePrice: service.basePrice,
      duration: service.duration
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this service?')) {
      setServices(services.filter(s => s.id !== id));
    }
  };

  const handleToggleActive = (id: string) => {
    setServices(services.map(s => 
      s.id === id ? { ...s, isActive: !s.isActive } : s
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const serviceData: Service = {
      id: editingService?.id || Date.now().toString(),
      ...formData,
      isActive: true,
      extras: editingService?.extras || [],
      pricingTiers: editingService?.pricingTiers || []
    };

    if (editingService) {
      setServices(services.map(s => s.id === editingService.id ? serviceData : s));
    } else {
      setServices([serviceData, ...services]);
    }

    setShowModal(false);
    setEditingService(null);
    setFormData({ name: '', description: '', category: 'Residential', basePrice: 0, duration: 60 });
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

  return (
    <div className="p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services Catalog</h1>
          <p className="text-gray-600">Manage your service offerings and pricing</p>
        </div>
        <button
          onClick={() => {
            setEditingService(null);
            setFormData({ name: '', description: '', category: 'Residential', basePrice: 0, duration: 60 });
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
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab === 'all' ? 'All Services' : tab}
          </button>
        ))}
      </div>

      {/* Services List */}
      <div className="space-y-4">
        {filteredServices.map((service) => (
          <div key={service.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div 
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
              onClick={() => setExpandedService(expandedService === service.id ? null : service.id)}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${service.isActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <Package size={24} className={service.isActive ? 'text-blue-600' : 'text-gray-400'} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{service.name}</h3>
                    {!service.isActive && (
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded-full">Inactive</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{service.description}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="hidden sm:flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <DollarSign size={16} />
                    From ${service.basePrice}
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
              <div className="border-t p-4 bg-gray-50">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Pricing Tiers */}
                  {service.pricingTiers && service.pricingTiers.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3">Pricing Tiers</h4>
                      <div className="space-y-2">
                        {service.pricingTiers.map((tier, i) => (
                          <div key={i} className="flex justify-between items-center bg-white p-3 rounded-lg">
                            <span className="text-gray-700">{tier.name}</span>
                            <span className="font-semibold text-green-600">${tier.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Extras */}
                  {service.extras.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3">Available Extras</h4>
                      <div className="space-y-2">
                        {service.extras.map((extra) => (
                          <div key={extra.id} className="flex justify-between items-center bg-white p-3 rounded-lg">
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
                    onClick={() => handleToggleActive(service.id)}
                    className={`px-4 py-2 rounded-lg ${
                      service.isActive 
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {service.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md">
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
                      value={formData.basePrice}
                      onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) })}
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
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
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
