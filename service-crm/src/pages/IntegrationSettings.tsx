import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { useToast } from '../context/ToastContext';
import { CreditCard, MessageSquare, Mail, Save, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

export default function IntegrationSettings() {
  const { tenant } = useTenant();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const [stripe, setStripe] = useState({
    publishable_key: '',
    secret_key: ''
  });

  const [twilio, setTwilio] = useState({
    account_sid: '',
    auth_token: '',
    phone_number: ''
  });

  const [resend, setResend] = useState({ api_key: '' });

  useEffect(() => {
    if (tenant) fetchSettings();
  }, [tenant]);

  const fetchSettings = async () => {
    if (!tenant) return;
    const { data } = await supabase
      .from('tenants')
      .select('stripe_publishable_key, stripe_secret_key, twilio_account_sid, twilio_auth_token, twilio_phone_number, resend_api_key')
      .eq('id', tenant.id)
      .single();

    if (data) {
      setStripe({
        publishable_key: data.stripe_publishable_key || '',
        secret_key: data.stripe_secret_key || ''
      });
      setTwilio({
        account_sid: data.twilio_account_sid || '',
        auth_token: data.twilio_auth_token || '',
        phone_number: data.twilio_phone_number || ''
      });
      setResend({ api_key: data.resend_api_key || '' });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!tenant) return;
    setSaving(true);

    const { error } = await supabase
      .from('tenants')
      .update({
        stripe_publishable_key: stripe.publishable_key || null,
        stripe_secret_key: stripe.secret_key || null,
        twilio_account_sid: twilio.account_sid || null,
        twilio_auth_token: twilio.auth_token || null,
        twilio_phone_number: twilio.phone_number || null,
        resend_api_key: resend.api_key || null,
      })
      .eq('id', tenant.id);

    setSaving(false);
    if (error) {
      showToast('Failed to save settings', 'error');
    } else {
      showToast('Integration settings saved', 'success');
    }
  };

  const toggleSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const maskValue = (value: string) => {
    if (!value) return '';
    if (value.length <= 8) return '••••••••';
    return value.slice(0, 4) + '••••••••' + value.slice(-4);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Integration Settings</h1>
        <p className="text-gray-600">Configure payment processing and SMS notifications</p>
      </div>

      {/* Stripe Section */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <CreditCard className="text-purple-600" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Stripe</h2>
            <p className="text-sm text-gray-500">Accept credit card payments</p>
          </div>
          {stripe.secret_key ? (
            <span className="ml-auto flex items-center gap-1 text-green-600 text-sm">
              <CheckCircle size={16} /> Connected
            </span>
          ) : (
            <span className="ml-auto flex items-center gap-1 text-gray-400 text-sm">
              <AlertCircle size={16} /> Not configured
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Publishable Key</label>
            <input
              type="text"
              value={stripe.publishable_key}
              onChange={e => setStripe({ ...stripe, publishable_key: e.target.value })}
              placeholder="pk_live_..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
            <div className="relative">
              <input
                type={showSecrets.stripeSecret ? 'text' : 'password'}
                value={stripe.secret_key}
                onChange={e => setStripe({ ...stripe, secret_key: e.target.value })}
                placeholder="sk_live_..."
                className="w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <button
                type="button"
                onClick={() => toggleSecret('stripeSecret')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showSecrets.stripeSecret ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Twilio Section */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <MessageSquare className="text-red-600" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Twilio</h2>
            <p className="text-sm text-gray-500">Send SMS notifications to customers</p>
          </div>
          {twilio.account_sid ? (
            <span className="ml-auto flex items-center gap-1 text-green-600 text-sm">
              <CheckCircle size={16} /> Connected
            </span>
          ) : (
            <span className="ml-auto flex items-center gap-1 text-gray-400 text-sm">
              <AlertCircle size={16} /> Not configured
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account SID</label>
            <input
              type="text"
              value={twilio.account_sid}
              onChange={e => setTwilio({ ...twilio, account_sid: e.target.value })}
              placeholder="ACxxxxxxxxxxxxxxx"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Auth Token</label>
            <div className="relative">
              <input
                type={showSecrets.twilioToken ? 'text' : 'password'}
                value={twilio.auth_token}
                onChange={e => setTwilio({ ...twilio, auth_token: e.target.value })}
                placeholder="Your auth token"
                className="w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              <button
                type="button"
                onClick={() => toggleSecret('twilioToken')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showSecrets.twilioToken ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              value={twilio.phone_number}
              onChange={e => setTwilio({ ...twilio, phone_number: e.target.value })}
              placeholder="+1234567890"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
        </div>
      </div>

      {/* Resend Section */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Mail className="text-blue-600" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Resend</h2>
            <p className="text-sm text-gray-500">Send email notifications to customers</p>
          </div>
          {resend.api_key ? (
            <span className="ml-auto flex items-center gap-1 text-green-600 text-sm">
              <CheckCircle size={16} /> Connected
            </span>
          ) : (
            <span className="ml-auto flex items-center gap-1 text-gray-400 text-sm">
              <AlertCircle size={16} /> Not configured
            </span>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
          <div className="relative">
            <input
              type={showSecrets.resendKey ? 'text' : 'password'}
              value={resend.api_key}
              onChange={e => setResend({ api_key: e.target.value })}
              placeholder="re_xxxxxxxx"
              className="w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={() => toggleSecret('resendKey')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showSecrets.resendKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
