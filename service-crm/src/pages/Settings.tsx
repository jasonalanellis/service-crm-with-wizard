import { useEffect, useState } from 'react';
import { supabase, Tenant, Service, Technician } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { useToast } from '../context/ToastContext';
import { Building2, Wrench, Users, MessageSquare, Plus, Edit2, Trash2, X, Save } from 'lucide-react';

type Tab = 'business' | 'services' | 'technicians' | 'templates';

export default function Settings() {
  const { tenant, setTenant } = useTenant();
  const [activeTab, setActiveTab] = useState<Tab>('business');

  if (!tenant) {
    return <div className="p-8 text-gray-500">Please select a business from the sidebar</div>;
  }

  const tabs = [
    { id: 'business' as Tab, label: 'Business Profile', icon: Building2 },
    { id: 'services' as Tab, label: 'Services', icon: Wrench },
    { id: 'technicians' as Tab, label: 'Technicians', icon: Users },
    { id: 'templates' as Tab, label: 'SMS Templates', icon: MessageSquare },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Settings</h1>

      <div className="flex flex-wrap gap-2 border-b">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={18} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'business' && <BusinessProfile tenant={tenant} onUpdate={setTenant} />}
      {activeTab === 'services' && <ServicesManager tenantId={tenant.id} />}
      {activeTab === 'technicians' && <TechniciansManager tenantId={tenant.id} />}
      {activeTab === 'templates' && <SMSTemplates />}
    </div>
  );
}

function BusinessProfile({ tenant, onUpdate }: { tenant: Tenant; onUpdate: (t: Tenant) => void }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: tenant.name || '',
    phone: tenant.phone || '',
    email: tenant.email || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { data, error } = await supabase
      .from('tenants')
      .update(form)
      .eq('id', tenant.id)
      .select()
      .single();
    if (error) showToast('Failed to update', 'error');
    else {
      showToast('Business profile updated', 'success');
      if (data) onUpdate(data);
    }
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 max-w-lg">
      <h2 className="text-lg font-semibold mb-4">Business Profile</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

function ServicesManager({ tenantId }: { tenantId: string }) {
  const { showToast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { fetchServices(); }, [tenantId]);

  const fetchServices = async () => {
    setLoading(true);
    const { data } = await supabase.from('services').select('*').eq('tenant_id', tenantId).order('name');
    setServices(data || []);
    setLoading(false);
  };

  const deleteService = async (id: string) => {
    if (!confirm('Delete this service?')) return;
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) showToast('Failed to delete', 'error');
    else { showToast('Service deleted', 'success'); fetchServices(); }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold">Service Catalog</h2>
        <button
          onClick={() => { setEditingService(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 text-sm"
        >
          <Plus size={16} /> Add Service
        </button>
      </div>
      {loading ? (
        <div className="p-4 text-gray-500">Loading...</div>
      ) : (
        <div className="divide-y">
          {services.length === 0 ? (
            <p className="p-4 text-gray-500 text-center">No services yet</p>
          ) : (
            services.map(service => (
              <div key={service.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">{service.name}</p>
                  {service.description && <p className="text-sm text-gray-500">{service.description}</p>}
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-gray-700">${Number(service.base_price).toFixed(2)}</span>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingService(service); setShowForm(true); }} className="p-1.5 hover:bg-gray-100 rounded">
                      <Edit2 size={16} className="text-gray-600" />
                    </button>
                    <button onClick={() => deleteService(service.id)} className="p-1.5 hover:bg-gray-100 rounded">
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showForm && (
        <ServiceForm
          service={editingService}
          tenantId={tenantId}
          onClose={() => setShowForm(false)}
          onSave={() => { setShowForm(false); fetchServices(); }}
        />
      )}
    </div>
  );
}

function ServiceForm({ service, tenantId, onClose, onSave }: {
  service: Service | null;
  tenantId: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: service?.name || '',
    description: service?.description || '',
    base_price: service?.base_price || 0,
    duration: service?.duration || 60,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { showToast('Name is required', 'error'); return; }
    setSaving(true);
    if (service) {
      const { error } = await supabase.from('services').update(form).eq('id', service.id);
      if (error) showToast('Failed to update', 'error');
      else { showToast('Service updated', 'success'); onSave(); }
    } else {
      const { error } = await supabase.from('services').insert({ ...form, tenant_id: tenantId });
      if (error) showToast('Failed to create', 'error');
      else { showToast('Service created', 'success'); onSave(); }
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-md w-full" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">{service ? 'Edit Service' : 'Add Service'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <input placeholder="Service Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full border rounded-lg px-3 py-2" required />
          <textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full border rounded-lg px-3 py-2 h-20" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Price ($)</label>
              <input type="number" value={form.base_price} onChange={e => setForm(f => ({ ...f, base_price: parseFloat(e.target.value) || 0 }))} className="w-full border rounded-lg px-3 py-2" step="0.01" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Duration (min)</label>
              <input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: parseInt(e.target.value) || 60 }))} className="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TechniciansManager({ tenantId }: { tenantId: string }) {
  const { showToast } = useToast();
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTech, setEditingTech] = useState<Technician | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { fetchTechnicians(); }, [tenantId]);

  const fetchTechnicians = async () => {
    setLoading(true);
    const { data } = await supabase.from('technicians').select('*').eq('tenant_id', tenantId).order('first_name');
    setTechnicians(data || []);
    setLoading(false);
  };

  const deleteTechnician = async (id: string) => {
    if (!confirm('Delete this technician?')) return;
    const { error } = await supabase.from('technicians').delete().eq('id', id);
    if (error) showToast('Failed to delete', 'error');
    else { showToast('Technician deleted', 'success'); fetchTechnicians(); }
  };

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold">Technicians</h2>
        <button
          onClick={() => { setEditingTech(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 text-sm"
        >
          <Plus size={16} /> Add Technician
        </button>
      </div>
      {loading ? (
        <div className="p-4 text-gray-500">Loading...</div>
      ) : (
        <div className="divide-y">
          {technicians.length === 0 ? (
            <p className="p-4 text-gray-500 text-center">No technicians yet</p>
          ) : (
            technicians.map((tech, i) => (
              <div key={tech.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tech.color || colors[i % colors.length] }} />
                  <div>
                    <p className="font-medium text-gray-800">{tech.first_name} {tech.last_name}</p>
                    {tech.email && <p className="text-sm text-gray-500">{tech.email}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingTech(tech); setShowForm(true); }} className="p-1.5 hover:bg-gray-100 rounded">
                    <Edit2 size={16} className="text-gray-600" />
                  </button>
                  <button onClick={() => deleteTechnician(tech.id)} className="p-1.5 hover:bg-gray-100 rounded">
                    <Trash2 size={16} className="text-red-600" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showForm && (
        <TechnicianForm
          technician={editingTech}
          tenantId={tenantId}
          onClose={() => setShowForm(false)}
          onSave={() => { setShowForm(false); fetchTechnicians(); }}
        />
      )}
    </div>
  );
}

function TechnicianForm({ technician, tenantId, onClose, onSave }: {
  technician: Technician | null;
  tenantId: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    first_name: technician?.first_name || '',
    last_name: technician?.last_name || '',
    email: technician?.email || '',
    phone: technician?.phone || '',
    color: technician?.color || '#3B82F6',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name) { showToast('First name is required', 'error'); return; }
    setSaving(true);
    if (technician) {
      const { error } = await supabase.from('technicians').update(form).eq('id', technician.id);
      if (error) showToast('Failed to update', 'error');
      else { showToast('Technician updated', 'success'); onSave(); }
    } else {
      const { error } = await supabase.from('technicians').insert({ ...form, tenant_id: tenantId });
      if (error) showToast('Failed to create', 'error');
      else { showToast('Technician created', 'success'); onSave(); }
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-md w-full" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">{technician ? 'Edit Technician' : 'Add Technician'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="First Name *" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} className="border rounded-lg px-3 py-2" required />
            <input placeholder="Last Name" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} className="border rounded-lg px-3 py-2" />
          </div>
          <input placeholder="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full border rounded-lg px-3 py-2" />
          <input placeholder="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full border rounded-lg px-3 py-2" />
          <div>
            <label className="block text-sm text-gray-600 mb-1">Calendar Color</label>
            <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="w-full h-10 border rounded-lg cursor-pointer" />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SMSTemplates() {
  const [templates, setTemplates] = useState([
    { id: 1, name: 'Appointment Reminder', body: 'Hi {customer_name}, this is a reminder of your appointment tomorrow at {time}. Reply Y to confirm.' },
    { id: 2, name: 'Review Request', body: 'Hi {customer_name}, thank you for choosing us! We would love your feedback. Please leave a review: {review_link}' },
    { id: 3, name: 'Quote Follow-up', body: 'Hi {customer_name}, just checking in on the quote we sent. Let us know if you have any questions!' },
  ]);

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b">
        <h2 className="font-semibold">SMS Templates</h2>
        <p className="text-sm text-gray-500 mt-1">Customize automated messages sent to customers</p>
      </div>
      <div className="divide-y">
        {templates.map(template => (
          <div key={template.id} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-800">{template.name}</h3>
              <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
            </div>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{template.body}</p>
            <p className="text-xs text-gray-500 mt-2">
              Variables: {'{customer_name}'}, {'{time}'}, {'{review_link}'}, {'{quote_link}'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
