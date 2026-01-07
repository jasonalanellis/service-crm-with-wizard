import { useState } from 'react';
import { Building2, Clock, Package, CheckCircle, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

type BusinessInfo = {
  name: string;
  email: string;
  phone: string;
  address: string;
  timezone: string;
};

type ServiceInfo = {
  name: string;
  duration: number;
  price: number;
};

type BusinessHours = {
  [key: string]: { enabled: boolean; open: string; close: string };
};

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney',
];

const DEFAULT_HOURS: BusinessHours = {
  monday: { enabled: true, open: '09:00', close: '17:00' },
  tuesday: { enabled: true, open: '09:00', close: '17:00' },
  wednesday: { enabled: true, open: '09:00', close: '17:00' },
  thursday: { enabled: true, open: '09:00', close: '17:00' },
  friday: { enabled: true, open: '09:00', close: '17:00' },
  saturday: { enabled: false, open: '09:00', close: '17:00' },
  sunday: { enabled: false, open: '09:00', close: '17:00' },
};

type Props = {
  onComplete: () => void;
};

export default function SetupWizard({ onComplete }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [business, setBusiness] = useState<BusinessInfo>({
    name: '',
    email: user?.email || '',
    phone: '',
    address: '',
    timezone: 'America/New_York',
  });

  const [service, setService] = useState<ServiceInfo>({
    name: '',
    duration: 60,
    price: 0,
  });

  const [hours, setHours] = useState<BusinessHours>(DEFAULT_HOURS);
  const [skipService, setSkipService] = useState(false);

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleComplete = async () => {
    if (!business.name.trim()) {
      setError('Business name is required');
      setStep(1);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Create the tenant
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: business.name,
          slug: generateSlug(business.name),
          email: business.email,
          phone: business.phone,
          timezone: business.timezone,
          settings: { business_hours: hours, address: business.address }
        })
        .select()
        .single();

      if (tenantError) throw tenantError;

      // 2. Link user profile to tenant
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ 
          tenant_id: tenantData.id,
          role: 'admin'
        })
        .eq('auth_id', user?.id);

      if (profileError) throw profileError;

      // 3. Create first service if provided
      if (!skipService && service.name.trim()) {
        await supabase.from('services').insert({
          tenant_id: tenantData.id,
          name: service.name,
          duration: service.duration,
          price: service.price,
          is_active: true
        });
      }

      // 4. Mark setup as complete in localStorage
      localStorage.setItem('setupComplete', 'true');
      localStorage.setItem('selectedTenantId', tenantData.id);
      localStorage.setItem('showWelcome', 'true');

      onComplete();
    } catch (err: any) {
      console.error('Setup error:', err);
      setError(err.message || 'Failed to complete setup');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !business.name.trim()) {
      setError('Business name is required');
      return;
    }
    setError('');
    setStep(step + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Progress Bar */}
        <div className="bg-gray-100 dark:bg-gray-700 px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Step {step} of 4</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{Math.round((step / 4) * 100)}% complete</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        <div className="p-8">
          {/* Step 1: Business Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="text-blue-600" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome! Let's set up your business</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Tell us about your business to get started</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Business Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={business.name}
                    onChange={(e) => setBusiness({ ...business, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Acme Cleaning Services"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    <input
                      type="email"
                      value={business.email}
                      onChange={(e) => setBusiness({ ...business, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="contact@business.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={business.phone}
                      onChange={(e) => setBusiness({ ...business, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                  <input
                    type="text"
                    value={business.address}
                    onChange={(e) => setBusiness({ ...business, address: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="123 Main St, City, State"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Timezone</label>
                  <select
                    value={business.timezone}
                    onChange={(e) => setBusiness({ ...business, timezone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {TIMEZONES.map(tz => (
                      <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: First Service */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="text-purple-600" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add your first service</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">What service does your business offer?</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Service Name</label>
                  <input
                    type="text"
                    value={service.name}
                    onChange={(e) => setService({ ...service, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., Standard Cleaning"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration (minutes)</label>
                    <select
                      value={service.duration}
                      onChange={(e) => setService({ ...service, duration: Number(e.target.value) })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {[15, 30, 45, 60, 90, 120, 180, 240].map(d => (
                        <option key={d} value={d}>{d} minutes</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price ($)</label>
                    <input
                      type="number"
                      value={service.price}
                      onChange={(e) => setService({ ...service, price: Number(e.target.value) })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 mt-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipService}
                    onChange={(e) => setSkipService(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Skip this step - I'll add services later</span>
                </label>
              </div>
            </div>
          )}

          {/* Step 3: Business Hours */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="text-green-600" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Set your business hours</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">When are you available for appointments?</p>
              </div>

              <div className="space-y-3">
                {Object.entries(hours).map(([day, schedule]) => (
                  <div key={day} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <label className="flex items-center gap-2 w-32">
                      <input
                        type="checkbox"
                        checked={schedule.enabled}
                        onChange={(e) => setHours({
                          ...hours,
                          [day]: { ...schedule, enabled: e.target.checked }
                        })}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{day}</span>
                    </label>
                    
                    {schedule.enabled ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="time"
                          value={schedule.open}
                          onChange={(e) => setHours({
                            ...hours,
                            [day]: { ...schedule, open: e.target.value }
                          })}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                          type="time"
                          value={schedule.close}
                          onChange={(e) => setHours({
                            ...hours,
                            [day]: { ...schedule, close: e.target.value }
                          })}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
                        />
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 italic">Closed</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Complete */}
          {step === 4 && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="text-green-600" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">You're all set!</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Your business <strong className="text-gray-900 dark:text-white">{business.name}</strong> is ready to go.
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-left mb-6">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">What's next?</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li className="flex items-center gap-2"><Sparkles size={14} className="text-blue-500" /> Add more services</li>
                  <li className="flex items-center gap-2"><Sparkles size={14} className="text-blue-500" /> Invite your team members</li>
                  <li className="flex items-center gap-2"><Sparkles size={14} className="text-blue-500" /> Create your first booking</li>
                </ul>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            {step > 1 ? (
              <button
                onClick={prevStep}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <ArrowLeft size={18} />
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Continue
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Setting up...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Complete Setup
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
