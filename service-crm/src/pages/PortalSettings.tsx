import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { Globe, Palette, Link, Save, Eye, Copy, Check, Loader2 } from 'lucide-react';

const defaultSettings = {
  businessName: '',
  tagline: 'Professional Services',
  primaryColor: '#2563eb',
  logoUrl: '',
  allowOnlineBooking: true,
  showPricing: true,
  showReviews: true,
  requireLogin: false,
  metaTitle: '',
  metaDescription: '',
  customDomain: '',
  sslEnabled: true,
};

export default function PortalSettings() {
  const { tenant } = useTenant();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);

  const portalUrl = tenant ? `https://${tenant.name.toLowerCase().replace(/\s+/g, '')}.servicecrm.app` : '';

  useEffect(() => {
    if (tenant) fetchSettings();
  }, [tenant]);

  const fetchSettings = async () => {
    if (!tenant) return;
    setLoading(true);
    const { data } = await supabase
      .from('tenant_settings')
      .select('portal_settings')
      .eq('tenant_id', tenant.id)
      .single();
    
    const baseSettings = {
      ...defaultSettings,
      businessName: tenant.name,
      metaTitle: `${tenant.name} - Professional Services`,
    };
    
    if (data?.portal_settings) {
      setSettings({ ...baseSettings, ...data.portal_settings as any });
    } else {
      setSettings(baseSettings);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!tenant) return;
    setSaving(true);

    const { data: existing } = await supabase
      .from('tenant_settings')
      .select('id')
      .eq('tenant_id', tenant.id)
      .single();

    if (existing) {
      await supabase
        .from('tenant_settings')
        .update({ portal_settings: settings, updated_at: new Date().toISOString() })
        .eq('tenant_id', tenant.id);
    } else {
      await supabase
        .from('tenant_settings')
        .insert({ tenant_id: tenant.id, portal_settings: settings });
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          <h1 className="text-2xl font-bold text-gray-900">Booking Portal Settings</h1>
          <p className="text-gray-600">Customize your customer-facing booking portal</p>
        </div>
        <div className="flex gap-2">
          <a
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <Eye size={18} />
            Preview
          </a>
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
      </div>

      {/* Portal URL */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe size={24} className="text-blue-600" />
            <div>
              <p className="font-medium text-gray-900">Your Booking Portal</p>
              <p className="text-blue-600">{portalUrl}</p>
            </div>
          </div>
          <button
            onClick={copyUrl}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border rounded-lg hover:bg-gray-50"
          >
            {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      {/* Branding */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Palette size={20} />
          Branding
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
            <input
              type="text"
              value={settings.businessName}
              onChange={(e) => { setSettings({ ...settings, businessName: e.target.value }); setSaved(false); }}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
            <input
              type="text"
              value={settings.tagline}
              onChange={(e) => { setSettings({ ...settings, tagline: e.target.value }); setSaved(false); }}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={settings.primaryColor}
                onChange={(e) => { setSettings({ ...settings, primaryColor: e.target.value }); setSaved(false); }}
                className="w-12 h-10 border rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={settings.primaryColor}
                onChange={(e) => { setSettings({ ...settings, primaryColor: e.target.value }); setSaved(false); }}
                className="flex-1 px-3 py-2 border rounded-lg font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
            <input
              type="url"
              value={settings.logoUrl}
              onChange={(e) => { setSettings({ ...settings, logoUrl: e.target.value }); setSaved(false); }}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      {/* Portal Options */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Portal Options</h3>
        <div className="space-y-4">
          {[
            { key: 'allowOnlineBooking', label: 'Allow Online Booking', desc: 'Customers can book directly from portal' },
            { key: 'showPricing', label: 'Show Pricing', desc: 'Display service prices on portal' },
            { key: 'showReviews', label: 'Show Reviews', desc: 'Display customer reviews and ratings' },
            { key: 'requireLogin', label: 'Require Login', desc: 'Customers must create account to book' },
          ].map((option) => (
            <div key={option.key} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{option.label}</p>
                <p className="text-sm text-gray-500">{option.desc}</p>
              </div>
              <button
                onClick={() => { setSettings({ ...settings, [option.key]: !settings[option.key as keyof typeof settings] }); setSaved(false); }}
                className={`w-12 h-7 rounded-full transition-colors ${
                  settings[option.key as keyof typeof settings] ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
                  settings[option.key as keyof typeof settings] ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SEO */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">SEO Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
            <input
              type="text"
              value={settings.metaTitle}
              onChange={(e) => { setSettings({ ...settings, metaTitle: e.target.value }); setSaved(false); }}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">{settings.metaTitle.length}/60 characters</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
            <textarea
              value={settings.metaDescription}
              onChange={(e) => { setSettings({ ...settings, metaDescription: e.target.value }); setSaved(false); }}
              className="w-full px-3 py-2 border rounded-lg"
              rows={2}
            />
            <p className="text-xs text-gray-500 mt-1">{settings.metaDescription.length}/160 characters</p>
          </div>
        </div>
      </div>

      {/* Custom Domain */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Link size={20} />
          Custom Domain
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Custom Domain</label>
            <input
              type="text"
              value={settings.customDomain}
              onChange={(e) => { setSettings({ ...settings, customDomain: e.target.value }); setSaved(false); }}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="book.yourdomain.com"
            />
          </div>
          {settings.customDomain && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
              <p className="font-medium text-yellow-800">DNS Configuration Required</p>
              <p className="text-yellow-700 mt-1">
                Add a CNAME record pointing <code className="bg-yellow-100 px-1 rounded">{settings.customDomain}</code> to{' '}
                <code className="bg-yellow-100 px-1 rounded">portal.servicecrm.app</code>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
