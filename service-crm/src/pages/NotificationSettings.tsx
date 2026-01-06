import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { Bell, Mail, MessageSquare, Save, Loader2 } from 'lucide-react';

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  email: boolean;
  sms: boolean;
  push: boolean;
}

const defaultSettings: NotificationSetting[] = [
  { id: 'booking_created', label: 'New Booking', description: 'When a new booking is created', email: true, sms: true, push: true },
  { id: 'booking_reminder', label: 'Booking Reminder', description: 'Reminder before scheduled service', email: true, sms: true, push: false },
  { id: 'booking_completed', label: 'Booking Completed', description: 'When a job is marked complete', email: true, sms: false, push: true },
  { id: 'booking_cancelled', label: 'Booking Cancelled', description: 'When a booking is cancelled', email: true, sms: true, push: true },
  { id: 'payment_received', label: 'Payment Received', description: 'When payment is processed', email: true, sms: false, push: false },
  { id: 'review_received', label: 'New Review', description: 'When a customer leaves a review', email: true, sms: false, push: true },
  { id: 'lead_created', label: 'New Lead', description: 'When a new lead is captured', email: true, sms: false, push: true },
  { id: 'provider_assigned', label: 'Provider Assigned', description: 'When a provider is assigned to a job', email: true, sms: true, push: false },
];

export default function NotificationSettings() {
  const { tenant } = useTenant();
  const [settings, setSettings] = useState<NotificationSetting[]>(defaultSettings);
  const [emailSettings, setEmailSettings] = useState({ fromName: '', replyTo: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (tenant) fetchSettings();
  }, [tenant]);

  const fetchSettings = async () => {
    if (!tenant) return;
    setLoading(true);
    const { data } = await supabase
      .from('tenant_settings')
      .select('notification_settings')
      .eq('tenant_id', tenant.id)
      .single();
    
    if (data?.notification_settings) {
      const stored = data.notification_settings as any;
      if (stored.notifications) setSettings(stored.notifications);
      if (stored.email) setEmailSettings(stored.email);
    }
    setLoading(false);
  };

  const toggleSetting = (id: string, channel: 'email' | 'sms' | 'push') => {
    setSettings(settings.map(s => 
      s.id === id ? { ...s, [channel]: !s[channel] } : s
    ));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!tenant) return;
    setSaving(true);

    const payload = {
      notifications: settings,
      email: emailSettings
    };

    // Upsert settings
    const { data: existing } = await supabase
      .from('tenant_settings')
      .select('id')
      .eq('tenant_id', tenant.id)
      .single();

    if (existing) {
      await supabase
        .from('tenant_settings')
        .update({ notification_settings: payload, updated_at: new Date().toISOString() })
        .eq('tenant_id', tenant.id);
    } else {
      await supabase
        .from('tenant_settings')
        .insert({ tenant_id: tenant.id, notification_settings: payload });
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (!tenant) {
    return <div className="p-8 text-gray-500">Please select a business from the sidebar</div>;
  }

  if (loading) {
    return <div className="p-8 text-gray-500">Loading settings...</div>;
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>
          <p className="text-gray-600">Configure how you receive alerts and updates</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            saved ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
          } text-white disabled:opacity-50`}
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Channel Headers */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-[1fr,80px,80px,80px] gap-4 p-4 bg-gray-50 border-b font-medium text-sm text-gray-600">
          <div>Notification Type</div>
          <div className="text-center flex flex-col items-center">
            <Mail size={18} className="mb-1" />
            Email
          </div>
          <div className="text-center flex flex-col items-center">
            <MessageSquare size={18} className="mb-1" />
            SMS
          </div>
          <div className="text-center flex flex-col items-center">
            <Bell size={18} className="mb-1" />
            Push
          </div>
        </div>

        <div className="divide-y">
          {settings.map((setting) => (
            <div key={setting.id} className="grid grid-cols-[1fr,80px,80px,80px] gap-4 p-4 items-center hover:bg-gray-50">
              <div>
                <p className="font-medium text-gray-900">{setting.label}</p>
                <p className="text-sm text-gray-500">{setting.description}</p>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={() => toggleSetting(setting.id, 'email')}
                  className={`w-10 h-6 rounded-full transition-colors ${
                    setting.email ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    setting.email ? 'translate-x-4' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={() => toggleSetting(setting.id, 'sms')}
                  className={`w-10 h-6 rounded-full transition-colors ${
                    setting.sms ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    setting.sms ? 'translate-x-4' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={() => toggleSetting(setting.id, 'push')}
                  className={`w-10 h-6 rounded-full transition-colors ${
                    setting.push ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    setting.push ? 'translate-x-4' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Email Settings */}
      <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Email Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Name</label>
            <input 
              type="text" 
              value={emailSettings.fromName}
              onChange={(e) => { setEmailSettings({ ...emailSettings, fromName: e.target.value }); setSaved(false); }}
              placeholder="Your Business Name"
              className="w-full px-3 py-2 border rounded-lg" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reply-To Email</label>
            <input 
              type="email" 
              value={emailSettings.replyTo}
              onChange={(e) => { setEmailSettings({ ...emailSettings, replyTo: e.target.value }); setSaved(false); }}
              placeholder="support@yourbusiness.com"
              className="w-full px-3 py-2 border rounded-lg" 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
