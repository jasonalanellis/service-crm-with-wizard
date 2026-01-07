import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ArrowRight, ArrowLeft, Check, Upload, X, 
  Sparkles, Home, Leaf, Droplet, MoreHorizontal,
  Briefcase, Car, Wrench, Building, Scissors, Camera, Zap,
  Phone, MessageSquare, ExternalLink, HelpCircle, Copy,
  Share2, QrCode as QrCodeIcon, Send, Gift, Users
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import Confetti from 'react-confetti';
import { QRCodeSVG } from 'qrcode.react';
import { FacebookShareButton, TwitterShareButton, LinkedinShareButton, WhatsappShareButton, FacebookIcon, TwitterIcon, LinkedinIcon, WhatsappIcon } from 'react-share';
import { toast, Toaster } from 'sonner';

const STORAGE_KEY = 'magic_setup_progress';

// Industry configurations with pre-set services
const INDUSTRIES = {
  'residential-cleaning': {
    name: 'Residential Cleaning',
    icon: Home,
    color: '#37c170',
    services: [
      { name: 'Standard Cleaning', duration: 120, price: 150 },
      { name: 'Deep Cleaning', duration: 240, price: 300 },
      { name: 'Move-In/Move-Out Cleaning', duration: 300, price: 400 },
    ]
  },
  'lawn-care': {
    name: 'Lawn Care',
    icon: Leaf,
    color: '#22c55e',
    services: [
      { name: 'Lawn Mowing', duration: 60, price: 50 },
      { name: 'Lawn Treatment', duration: 90, price: 80 },
      { name: 'Full Yard Service', duration: 180, price: 150 },
    ]
  },
  'pool-service': {
    name: 'Pool Service',
    icon: Droplet,
    color: '#0ea5e9',
    services: [
      { name: 'Weekly Pool Cleaning', duration: 60, price: 75 },
      { name: 'Chemical Balance', duration: 30, price: 50 },
      { name: 'Pool Opening/Closing', duration: 180, price: 250 },
    ]
  },
  'hvac': {
    name: 'HVAC',
    icon: Zap,
    color: '#f59e0b',
    services: [
      { name: 'AC Tune-Up', duration: 60, price: 99 },
      { name: 'Furnace Inspection', duration: 60, price: 89 },
      { name: 'Full System Check', duration: 120, price: 149 },
    ]
  },
  'plumbing': {
    name: 'Plumbing',
    icon: Wrench,
    color: '#6366f1',
    services: [
      { name: 'Drain Cleaning', duration: 60, price: 125 },
      { name: 'Leak Repair', duration: 90, price: 175 },
      { name: 'Water Heater Service', duration: 120, price: 200 },
    ]
  },
  'auto-detailing': {
    name: 'Auto Detailing',
    icon: Car,
    color: '#ef4444',
    services: [
      { name: 'Basic Wash', duration: 60, price: 50 },
      { name: 'Full Detail', duration: 180, price: 200 },
      { name: 'Interior Deep Clean', duration: 120, price: 150 },
    ]
  },
  'handyman': {
    name: 'Handyman',
    icon: Briefcase,
    color: '#8b5cf6',
    services: [
      { name: 'Small Repairs', duration: 60, price: 75 },
      { name: 'Furniture Assembly', duration: 120, price: 100 },
      { name: 'General Maintenance', duration: 180, price: 150 },
    ]
  },
  'commercial-cleaning': {
    name: 'Commercial Cleaning',
    icon: Building,
    color: '#14b8a6',
    services: [
      { name: 'Office Cleaning', duration: 120, price: 200 },
      { name: 'Floor Maintenance', duration: 180, price: 350 },
      { name: 'Post-Construction Cleanup', duration: 480, price: 800 },
    ]
  },
  'salon': {
    name: 'Salon/Spa',
    icon: Scissors,
    color: '#ec4899',
    services: [
      { name: 'Haircut', duration: 45, price: 45 },
      { name: 'Color Treatment', duration: 120, price: 120 },
      { name: 'Full Styling', duration: 90, price: 85 },
    ]
  },
  'photography': {
    name: 'Photography',
    icon: Camera,
    color: '#f97316',
    services: [
      { name: 'Portrait Session', duration: 60, price: 150 },
      { name: 'Event Coverage', duration: 240, price: 500 },
      { name: 'Product Photography', duration: 120, price: 300 },
    ]
  },
};

const BRAND_COLORS = [
  '#37c170', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', 
  '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#d946ef', '#ec4899', '#f43f5e', '#ef4444', '#f97316',
  '#f59e0b', '#eab308', '#84cc16', '#64748b', '#1f2937'
];

type SetupData = {
  industry: string;
  businessName: string;
  address: string;
  phone: string;
  brandColor: string;
  logoUrl: string | null;
  services: Array<{ name: string; duration: number; price: number; enabled: boolean }>;
  contactPhone: string;
  email: string;
  password: string;
  foundingMember: boolean;
};

type Props = {
  onComplete: () => void;
};

export default function MagicSetup({ onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOtherIndustries, setShowOtherIndustries] = useState(false);
  const [gbpUrl, setGbpUrl] = useState('');
  const [gbpLoading, setGbpLoading] = useState(false);
  const [showMigrateUpsell, setShowMigrateUpsell] = useState(false);
  const [smsSent, setSmsSent] = useState(false);
  const [bookingUrl, setBookingUrl] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteSent, setInviteSent] = useState(false);
  const [tenantId, setTenantId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Initialize state from localStorage or defaults
  const [data, setData] = useState<SetupData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...parsed.data };
      }
    } catch (e) { /* ignore */ }
    return {
      industry: '',
      businessName: '',
      address: '',
      phone: '',
      brandColor: '#37c170',
      logoUrl: null,
      services: [],
      contactPhone: '',
      email: '',
      password: '',
      foundingMember: false,
    };
  });

  // Restore step from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.step && parsed.step < 7) setStep(parsed.step);
      }
    } catch (e) { /* ignore */ }
  }, []);

  // Auto-save progress to localStorage
  useEffect(() => {
    if (step < 7) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, data }));
    }
  }, [step, data]);

  const TOTAL_STEPS = 7;
  const mainIndustries = ['residential-cleaning', 'lawn-care', 'pool-service'];
  const otherIndustries = Object.keys(INDUSTRIES).filter(k => !mainIndustries.includes(k));

  // Copy to clipboard
  const copyToClipboard = useCallback(async () => {
    await navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [bookingUrl]);

  // Share via WhatsApp
  const shareWhatsApp = useCallback(() => {
    const text = encodeURIComponent(`Book with us online: ${bookingUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }, [bookingUrl]);

  // Share via SMS
  const shareSms = useCallback(() => {
    const text = encodeURIComponent(`Book with us online: ${bookingUrl}`);
    window.open(`sms:?body=${text}`, '_blank');
  }, [bookingUrl]);

  // Invite a customer
  const sendInvite = async () => {
    if (!invitePhone) return;
    try {
      await supabase.functions.invoke('send-sms', {
        body: {
          phone: invitePhone,
          message: `${data.businessName} is now accepting online bookings! Book now: ${bookingUrl}`,
          bookingUrl
        }
      });
      setInviteSent(true);
    } catch (e) {
      console.error('Invite error:', e);
    }
  };

  // Generate QR code URL (using QR code API)
  const qrCodeUrl = bookingUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(bookingUrl)}` : '';

  // Parse GBP URL to extract business info using Google Places API
  const parseGbpUrl = async (url: string) => {
    setGbpLoading(true);
    try {
      // Call edge function to lookup GBP data
      const { data: result, error } = await supabase.functions.invoke('lookup-gbp', {
        body: { gbpUrl: url }
      });

      if (error) throw error;

      if (result?.success && result?.data) {
        const gbpData = result.data;
        setData(prev => ({
          ...prev,
          businessName: gbpData.businessName || prev.businessName,
          address: gbpData.address || prev.address,
          phone: gbpData.phone || prev.phone,
        }));
      }
    } catch (err) {
      console.error('GBP parse error:', err);
      // Fallback: try to extract name from URL
      const placeMatch = url.match(/place\/([^/@]+)/);
      if (placeMatch) {
        const businessName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
        setData(prev => ({ ...prev, businessName }));
      }
    } finally {
      setGbpLoading(false);
    }
  };

  // When GBP URL changes
  useEffect(() => {
    if (gbpUrl && (gbpUrl.includes('google.com/maps') || gbpUrl.includes('maps.app.goo.gl'))) {
      parseGbpUrl(gbpUrl);
    }
  }, [gbpUrl]);

  // When industry changes, populate services
  useEffect(() => {
    if (data.industry === 'other') {
      // Generic services for "other" industry
      setData(prev => ({
        ...prev,
        services: [
          { name: 'Basic Service', duration: 60, price: 75, enabled: true },
          { name: 'Standard Service', duration: 90, price: 125, enabled: true },
          { name: 'Premium Service', duration: 120, price: 200, enabled: true },
        ],
      }));
    } else if (data.industry && INDUSTRIES[data.industry as keyof typeof INDUSTRIES]) {
      const ind = INDUSTRIES[data.industry as keyof typeof INDUSTRIES];
      setData(prev => ({
        ...prev,
        brandColor: ind.color,
        services: ind.services.map(s => ({ ...s, enabled: true })),
      }));
    }
  }, [data.industry]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setData(prev => ({ ...prev, logoUrl: localPreview }));
    
    // Upload to storage via edge function
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        
        const { data: result, error } = await supabase.functions.invoke('upload-logo', {
          body: {
            imageData: base64Data,
            fileName: file.name
          }
        });

        if (error) {
          console.error('Logo upload error:', error);
          return;
        }

        if (result?.success && result?.data?.publicUrl) {
          // Update with permanent URL from storage
          setData(prev => ({ ...prev, logoUrl: result.data.publicUrl }));
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Logo upload error:', err);
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleComplete = async () => {
    if (!data.businessName.trim()) {
      setError('Business name is required');
      return;
    }
    if (!data.email.trim()) {
      setError('Email is required');
      return;
    }
    if (!data.password || data.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create account');

      // 2. Create tenant
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: data.businessName,
          slug: generateSlug(data.businessName),
          phone: data.phone,
          email: data.email,
          settings: {
            industry: data.industry,
            brand_color: data.brandColor,
            logo_url: data.logoUrl,
            address: data.address,
            founding_member: data.foundingMember,
            trial_days: data.foundingMember ? 90 : 30,
            business_hours: {
              monday: { enabled: true, open: '09:00', close: '17:00' },
              tuesday: { enabled: true, open: '09:00', close: '17:00' },
              wednesday: { enabled: true, open: '09:00', close: '17:00' },
              thursday: { enabled: true, open: '09:00', close: '17:00' },
              friday: { enabled: true, open: '09:00', close: '17:00' },
              saturday: { enabled: false, open: '09:00', close: '17:00' },
              sunday: { enabled: false, open: '09:00', close: '17:00' },
            }
          }
        })
        .select()
        .single();

      if (tenantError) throw tenantError;

      // 3. Create services
      const enabledServices = data.services.filter(s => s.enabled);
      if (enabledServices.length > 0) {
        await supabase.from('services').insert(
          enabledServices.map(s => ({
            tenant_id: tenantData.id,
            name: s.name,
            duration: s.duration,
            base_price: s.price,
            is_active: true,
            category: data.industry,
          }))
        );
      }

      // 4. Link user profile to tenant
      await supabase
        .from('user_profiles')
        .update({ tenant_id: tenantData.id, role: 'admin' })
        .eq('auth_id', authData.user.id);

      // 5. Insert into welcome_sequence for onboarding automation
      await supabase.from('welcome_sequence').insert({
        tenant_id: tenantData.id,
        email: data.email,
        phone: data.contactPhone || data.phone,
        sequence_step: 0,
      });

      // Set booking URL
      const url = `${window.location.origin}/book?tenant=${tenantData.id}`;
      setBookingUrl(url);
      setTenantId(tenantData.id);

      // Clear setup progress from localStorage
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem('setupComplete', 'true');
      localStorage.setItem('selectedTenantId', tenantData.id);
      
      // Trigger confetti!
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
      
      setStep(7); // Go to final step with booking link
    } catch (err: any) {
      console.error('Setup error:', err);
      setError(err.message || 'Failed to complete setup');
    } finally {
      setLoading(false);
    }
  };

  const sendSmsLink = async () => {
    if (!data.contactPhone) {
      toast.error('Please enter your phone number');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const message = `Your booking page is live! Share this link with customers: ${bookingUrl}`;
      
      const { data: result, error } = await supabase.functions.invoke('send-sms', {
        body: {
          phone: data.contactPhone,
          message: message,
          bookingUrl: bookingUrl
        }
      });

      if (error) throw error;

      if (result?.success) {
        setSmsSent(true);
        toast.success('SMS sent! Check your phone 📱');
      } else {
        throw new Error(result?.error?.message || 'Failed to send SMS');
      }
    } catch (err: any) {
      console.error('SMS send error:', err);
      toast.error(err.message || 'Failed to send SMS. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !data.industry) {
      setError('Please select your industry');
      return;
    }
    if (step === 2 && showManualEntry && !data.businessName.trim()) {
      setError('Please enter your business name');
      return;
    }
    if (step === 2 && !showManualEntry && !data.businessName.trim()) {
      // User didn't enter GBP URL or it failed - switch to manual entry
      setShowManualEntry(true);
      setError('Please enter your business name');
      return;
    }
    if (step === 3 && !data.email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (step === 6) {
      handleComplete();
      return;
    }
    setError('');
    setStep(step + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(step - 1);
  };

  // Preview component
  const BookingPreview = () => (
    <div 
      className="h-full rounded-2xl overflow-hidden shadow-2xl border border-gray-200"
      style={{ backgroundColor: '#f9fafb' }}
    >
      {/* Preview Header */}
      <div 
        className="p-4 text-white"
        style={{ backgroundColor: data.brandColor }}
      >
        <div className="flex items-center gap-3">
          {data.logoUrl ? (
            <img src={data.logoUrl} alt="Logo" className="w-10 h-10 rounded-lg object-cover bg-white" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center text-lg font-bold">
              {data.businessName?.charAt(0) || 'B'}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-sm">{data.businessName || 'Your Business'}</h3>
            <p className="text-xs opacity-80">Book Online</p>
          </div>
        </div>
      </div>
      
      {/* Preview Content */}
      <div className="p-4 space-y-3">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Services</div>
        {data.services.filter(s => s.enabled).slice(0, 3).map((service, i) => (
          <div 
            key={i} 
            className="bg-white p-3 rounded-lg border border-gray-100 flex justify-between items-center"
          >
            <div>
              <div className="font-medium text-sm text-gray-900">{service.name}</div>
              <div className="text-xs text-gray-500">{service.duration} min</div>
            </div>
            <div className="font-semibold" style={{ color: data.brandColor }}>${service.price}</div>
          </div>
        ))}
        {data.services.filter(s => s.enabled).length === 0 && (
          <div className="bg-white p-3 rounded-lg border border-gray-100 text-center text-sm text-gray-400">
            Services will appear here
          </div>
        )}
        
        <button 
          className="w-full py-2.5 rounded-lg text-white text-sm font-medium mt-4"
          style={{ backgroundColor: data.brandColor }}
        >
          Book Now
        </button>
      </div>
    </div>
  );

  // Industry card component
  const IndustryCard = ({ id, selected }: { id: string; selected: boolean }) => {
    const ind = INDUSTRIES[id as keyof typeof INDUSTRIES];
    const Icon = ind.icon;
    return (
      <button
        onClick={() => {
          setData(prev => ({ ...prev, industry: id }));
          setError('');
          setStep(2);
        }}
        className={`p-5 rounded-xl border-2 transition-all text-left ${
          selected 
            ? 'border-green-500 bg-green-50 shadow-lg scale-[1.02]' 
            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow'
        }`}
      >
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
          style={{ backgroundColor: `${ind.color}15` }}
        >
          <Icon size={24} style={{ color: ind.color }} />
        </div>
        <div className="font-semibold text-gray-900">{ind.name}</div>
        {selected && <Check size={18} className="text-green-500 mt-2" />}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Toaster position="top-center" richColors />
      {/* Header with Avatar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* AI Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg">
              <Sparkles className="text-white" size={20} />
            </div>
            <div>
              <div className="font-semibold text-gray-900">Magic Setup</div>
              <div className="text-xs text-gray-500">Get your booking link in 5 minutes</div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-green-600 font-medium">
            <Sparkles size={16} />
            No credit card required - 30 days free
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-100 sticky top-[61px] z-40">
        <div className="max-w-6xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Step {step} of {TOTAL_STEPS}</span>
            <span>{Math.round((step / TOTAL_STEPS) * 100)}% complete</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${(step / TOTAL_STEPS) * 100}%`,
                backgroundColor: data.brandColor 
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Form Panel */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:p-8">
            {/* Step 1: Industry Selection */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">What type of business do you run?</h2>
                  <p className="text-gray-500 mt-1">We'll customize your booking page based on your industry</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {mainIndustries.map(id => (
                    <IndustryCard key={id} id={id} selected={data.industry === id} />
                  ))}
                  
                  {/* Other option */}
                  <button
                    onClick={() => {
                      if (!showOtherIndustries) {
                        setShowOtherIndustries(true);
                      } else {
                        // If expanded and clicking again, select "other" as generic
                        setData(prev => ({ ...prev, industry: 'other' }));
                        setError('');
                        setStep(2);
                      }
                    }}
                    className={`p-5 rounded-xl border-2 transition-all text-left ${
                      data.industry === 'other' || otherIndustries.includes(data.industry)
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                      <MoreHorizontal size={24} className="text-gray-600" />
                    </div>
                    <div className="font-semibold text-gray-900">Other</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {showOtherIndustries ? 'Select a category or click again for generic' : 'Show more options'}
                    </div>
                    {data.industry === 'other' && <Check size={18} className="text-green-500 mt-2" />}
                  </button>
                </div>

                {/* Expanded other industries */}
                {showOtherIndustries && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                    {otherIndustries.map(id => (
                      <IndustryCard key={id} id={id} selected={data.industry === id} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: GBP Link */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {showManualEntry ? 'Tell us about your business' : 'Got a Google Business Profile?'}
                  </h2>
                  <p className="text-gray-500 mt-1">
                    {showManualEntry ? 'Enter your business details manually' : 'Paste your link and we\'ll auto-fill your details'}
                  </p>
                </div>

                {!showManualEntry ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Google Business Profile URL
                      </label>
                      <div className="relative">
                        <input
                          type="url"
                          value={gbpUrl}
                          onChange={(e) => setGbpUrl(e.target.value)}
                          placeholder="https://www.google.com/maps/place/..."
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent"
                          style={{ '--tw-ring-color': data.brandColor } as React.CSSProperties}
                        />
                        {gbpLoading && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="animate-spin h-5 w-5 border-2 border-t-transparent rounded-full" style={{ borderColor: data.brandColor }} />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        <ExternalLink size={12} className="inline mr-1" />
                        Find your profile on Google Maps and copy the URL
                      </p>
                    </div>

                    <button
                      onClick={() => setShowManualEntry(true)}
                      className="text-sm hover:underline"
                      style={{ color: data.brandColor }}
                    >
                      I don't have a Google page yet
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Business Name *</label>
                      <input
                        type="text"
                        value={data.businessName}
                        onChange={(e) => setData(prev => ({ ...prev, businessName: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent"
                        style={{ '--tw-ring-color': data.brandColor } as React.CSSProperties}
                        placeholder="Your Business Name"
                        autoFocus
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                        <input
                          type="tel"
                          value={data.phone}
                          onChange={(e) => setData(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent"
                          style={{ '--tw-ring-color': data.brandColor } as React.CSSProperties}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                        <input
                          type="text"
                          value={data.address}
                          onChange={(e) => setData(prev => ({ ...prev, address: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent"
                          style={{ '--tw-ring-color': data.brandColor } as React.CSSProperties}
                          placeholder="123 Main St, City"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => setShowManualEntry(false)}
                      className="text-sm text-gray-500 hover:underline"
                    >
                      I have a Google Business Profile
                    </button>
                  </div>
                )}

                {/* Show autofilled data if GBP worked */}
                {!showManualEntry && data.businessName && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <Check size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-green-900">Found: {data.businessName}</div>
                        {data.address && <p className="text-sm text-green-700 mt-1">{data.address}</p>}
                        {data.phone && <p className="text-sm text-green-700">{data.phone}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Show business name field if GBP lookup didn't populate it */}
                {!showManualEntry && !data.businessName && gbpUrl && !gbpLoading && (
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-amber-600">We couldn't find your business details. Please enter manually:</p>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Business Name *</label>
                      <input
                        type="text"
                        value={data.businessName}
                        onChange={(e) => setData(prev => ({ ...prev, businessName: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent"
                        style={{ '--tw-ring-color': data.brandColor } as React.CSSProperties}
                        placeholder="Your Business Name"
                      />
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* Step 3: Where to send your link (Email) */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Where should we send your link?</h2>
                  <p className="text-gray-500 mt-1">We'll email you your live booking page when it's ready</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your email</label>
                    <input
                      type="email"
                      value={data.email}
                      onChange={(e) => setData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': data.brandColor } as React.CSSProperties}
                      placeholder="you@yourbusiness.com"
                      autoFocus
                    />
                  </div>
                </div>

                <label 
                  className={`block rounded-xl p-4 cursor-pointer transition-all border-2 ${
                    data.foundingMember 
                      ? 'border-amber-400 bg-amber-50' 
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={data.foundingMember}
                      onChange={(e) => setData(prev => ({ ...prev, foundingMember: e.target.checked }))}
                      className="mt-1 w-5 h-5 rounded border-gray-300"
                      style={{ accentColor: '#f59e0b' }}
                    />
                    <div>
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        🏆 Join the Founding Member Circle
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-semibold text-amber-600">90 days free</span> + shape the future of home service software.
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Your feedback builds what we create next. Be part of an exclusive tribe of home service pros.
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            )}

            {/* Step 4: Brand Color */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Pick your brand color</h2>
                  <p className="text-gray-500 mt-1">Choose a color that represents your business</p>
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
                  {BRAND_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setData(prev => ({ ...prev, brandColor: color }))}
                      className={`w-10 h-10 rounded-xl transition-all ${
                        data.brandColor === color 
                          ? 'ring-4 ring-offset-2 scale-110' 
                          : 'hover:scale-105'
                      }`}
                      style={{ 
                        backgroundColor: color
                      }}
                    >
                      {data.brandColor === color && (
                        <Check size={16} className="text-white mx-auto" />
                      )}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Or enter a custom color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={data.brandColor}
                      onChange={(e) => setData(prev => ({ ...prev, brandColor: e.target.value }))}
                      className="w-12 h-12 rounded-lg cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={data.brandColor}
                      onChange={(e) => setData(prev => ({ ...prev, brandColor: e.target.value }))}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-mono"
                      placeholder="#37c170"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Services */}
            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Your services</h2>
                  <p className="text-gray-500 mt-1">We've pre-filled based on your industry. Customize as needed.</p>
                </div>

                <div className="space-y-3">
                  {data.services.map((service, index) => (
                    <div 
                      key={index}
                      className={`p-4 rounded-xl border transition-all ${
                        service.enabled ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={service.enabled}
                          onChange={(e) => {
                            const newServices = [...data.services];
                            newServices[index].enabled = e.target.checked;
                            setData(prev => ({ ...prev, services: newServices }));
                          }}
                          className="mt-1 w-5 h-5 rounded border-gray-300"
                          style={{ accentColor: data.brandColor }}
                        />
                        <div className="flex-1">
                          <input
                            type="text"
                            value={service.name}
                            onChange={(e) => {
                              const newServices = [...data.services];
                              newServices[index].name = e.target.value;
                              setData(prev => ({ ...prev, services: newServices }));
                            }}
                            className="font-medium text-gray-900 bg-transparent border-0 p-0 focus:ring-0 w-full"
                          />
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">Duration:</span>
                              <select
                                value={service.duration}
                                onChange={(e) => {
                                  const newServices = [...data.services];
                                  newServices[index].duration = Number(e.target.value);
                                  setData(prev => ({ ...prev, services: newServices }));
                                }}
                                className="border-0 bg-gray-100 rounded px-2 py-1 text-sm"
                              >
                                {[30, 60, 90, 120, 180, 240, 300, 480].map(d => (
                                  <option key={d} value={d}>{d} min</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">Price: $</span>
                              <input
                                type="number"
                                value={service.price}
                                onChange={(e) => {
                                  const newServices = [...data.services];
                                  newServices[index].price = Number(e.target.value);
                                  setData(prev => ({ ...prev, services: newServices }));
                                }}
                                className="w-20 border-0 bg-gray-100 rounded px-2 py-1 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setData(prev => ({
                      ...prev,
                      services: [
                        ...prev.services,
                        { name: 'New Service', duration: 60, price: 0, enabled: true }
                      ]
                    }));
                  }}
                  className="text-sm font-medium hover:underline"
                  style={{ color: data.brandColor }}
                >
                  + Add another service
                </button>
              </div>
            )}

            {/* Step 6: Preview */}
            {step === 6 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Looking good!</h2>
                  <p className="text-gray-500 mt-1">Here's a preview of your booking page</p>
                </div>

                {/* Mobile preview */}
                <div className="lg:hidden">
                  <div className="bg-gray-100 rounded-2xl p-4 mb-4">
                    <BookingPreview />
                  </div>
                </div>

                {/* Password to secure account */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Create a password to secure your account</label>
                    <input
                      type="password"
                      value={data.password}
                      onChange={(e) => setData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': data.brandColor } as React.CSSProperties}
                      placeholder="At least 6 characters"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone number (we'll text you your link)</label>
                    <input
                      type="tel"
                      value={data.contactPhone}
                      onChange={(e) => setData(prev => ({ ...prev, contactPhone: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': data.brandColor } as React.CSSProperties}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                <div className="rounded-xl p-4 border" style={{ backgroundColor: `${data.brandColor}10`, borderColor: `${data.brandColor}30` }}>
                  <div className="flex items-start gap-3">
                    <Check size={20} style={{ color: data.brandColor }} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">Ready to go live!</div>
                      <p className="text-sm text-gray-600 mt-1">
                        Click below to create your booking page and get your link.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 7: Get Your Link */}
            {step === 7 && (
              <div className="space-y-6">
                {/* Confetti celebration */}
                {showConfetti && (
                  <Confetti
                    width={window.innerWidth}
                    height={window.innerHeight}
                    recycle={false}
                    numberOfPieces={300}
                    colors={[data.brandColor, '#22c55e', '#3b82f6', '#f59e0b', '#ec4899']}
                  />
                )}

                <div className="text-center">
                  <div 
                    className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{ backgroundColor: `${data.brandColor}15` }}
                  >
                    <Sparkles size={36} style={{ color: data.brandColor }} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">🎉 Your booking page is live!</h2>
                  <p className="text-gray-500 mt-1">Share your link and start accepting bookings</p>
                </div>

                {/* Booking Link with prominent Copy button */}
                <div className="rounded-xl p-5 border-2" style={{ borderColor: data.brandColor, backgroundColor: `${data.brandColor}08` }}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your booking link</label>
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="text"
                      value={bookingUrl}
                      readOnly
                      className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm font-mono"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(bookingUrl);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="px-6 py-3 rounded-lg text-white font-medium flex items-center gap-2 transition-all"
                      style={{ backgroundColor: copied ? '#22c55e' : data.brandColor }}
                    >
                      {copied ? <Check size={18} /> : <Copy size={18} />}
                      {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>

                  {/* QR Code */}
                  <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      <QRCodeSVG value={bookingUrl} size={80} fgColor={data.brandColor} />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        <QrCodeIcon size={16} /> QR Code
                      </div>
                      <p className="text-sm text-gray-500">Customers can scan to book instantly</p>
                    </div>
                  </div>
                </div>

                {/* Share Buttons */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Share2 size={16} /> Share on social
                  </label>
                  <div className="flex items-center gap-3">
                    <FacebookShareButton url={bookingUrl} hashtag="#BookNow">
                      <FacebookIcon size={40} round />
                    </FacebookShareButton>
                    <TwitterShareButton url={bookingUrl} title={`Book with ${data.businessName}!`}>
                      <TwitterIcon size={40} round />
                    </TwitterShareButton>
                    <LinkedinShareButton url={bookingUrl} title={`Book with ${data.businessName}`}>
                      <LinkedinIcon size={40} round />
                    </LinkedinShareButton>
                    <WhatsappShareButton url={bookingUrl} title={`Book with ${data.businessName}!`}>
                      <WhatsappIcon size={40} round />
                    </WhatsappShareButton>
                  </div>
                </div>

                {/* Invite First Customer */}
                <div className="rounded-xl p-4 border border-green-200 bg-green-50">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Users size={20} className="text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-green-900">Invite your first customer!</div>
                      <p className="text-sm text-green-700 mt-1 mb-3">
                        Send your booking link to a customer and watch the magic happen.
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="tel"
                          value={invitePhone}
                          onChange={(e) => setInvitePhone(e.target.value)}
                          placeholder="Customer's phone number"
                          className="flex-1 px-3 py-2 border border-green-300 rounded-lg text-sm bg-white"
                        />
                        <button
                          onClick={async () => {
                            if (!invitePhone) {
                              toast.error('Please enter a phone number');
                              return;
                            }
                            setLoading(true);
                            try {
                              const { data: result, error } = await supabase.functions.invoke('send-sms', {
                                body: { phone: invitePhone, message: `Book your appointment with ${data.businessName}: ${bookingUrl}` }
                              });
                              if (error) throw error;
                              if (result?.success) {
                                setInviteSent(true);
                                toast.success('Invite sent to your customer! 🎉');
                              } else {
                                throw new Error('Failed to send');
                              }
                            } catch (err) {
                              toast.error('Failed to send invite. Please try again.');
                            } finally {
                              setLoading(false);
                            }
                          }}
                          disabled={loading || inviteSent || !invitePhone}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                        >
                          {inviteSent ? <><Check size={16} /> Sent!</> : <><Send size={16} /> Send Invite</>}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Text Me My Link */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    <Phone size={16} className="inline mr-2" />
                    Text me my link
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="tel"
                      value={data.contactPhone}
                      onChange={(e) => setData(prev => ({ ...prev, contactPhone: e.target.value }))}
                      placeholder="(555) 123-4567"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg"
                    />
                    <button
                      onClick={sendSmsLink}
                      disabled={loading || smsSent}
                      className="px-6 py-3 rounded-lg text-white font-medium flex items-center gap-2 disabled:opacity-50"
                      style={{ backgroundColor: data.brandColor }}
                    >
                      {smsSent ? (
                        <>
                          <Check size={18} />
                          Sent!
                        </>
                      ) : (
                        <>
                          <MessageSquare size={18} />
                          Send
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Migration Upsell */}
                <div className="border border-gray-200 rounded-xl p-4 mt-6">
                  <button
                    onClick={() => setShowMigrateUpsell(!showMigrateUpsell)}
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <HelpCircle size={20} className="text-purple-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-gray-900">Need help migrating?</div>
                        <div className="text-sm text-gray-500">We'll transfer your existing data</div>
                      </div>
                    </div>
                    <ArrowRight size={20} className="text-gray-400" />
                  </button>
                  
                  {showMigrateUpsell && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-600 mb-3">
                        Our team can help migrate your customers, bookings, and data from your existing system. 
                        Starting at $99 for full white-glove migration.
                      </p>
                      <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
                        Schedule a call
                      </button>
                    </div>
                  )}
                </div>

                {/* Continue to Dashboard */}
                <button
                  onClick={onComplete}
                  className="w-full py-4 rounded-xl text-white font-medium text-lg"
                  style={{ backgroundColor: data.brandColor }}
                >
                  Go to Dashboard
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Navigation Buttons */}
            {step < 7 && (
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                {step > 1 ? (
                  <button
                    onClick={prevStep}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
                  >
                    <ArrowLeft size={18} />
                    Back
                  </button>
                ) : (
                  <div />
                )}

                <button
                  onClick={nextStep}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium disabled:opacity-50"
                  style={{ backgroundColor: data.brandColor }}
                >
                  {loading ? (
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>
                      {step === 6 ? 'Get My Booking Link' : 'Continue'}
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Preview Panel - Desktop only */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-[110px]">
              <div className="text-sm font-medium text-gray-500 mb-3">Live Preview</div>
              <BookingPreview />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile CTA */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="flex items-center gap-2 text-sm text-green-600 font-medium justify-center">
          <Sparkles size={16} />
          No credit card required - 30 days free
        </div>
      </div>
    </div>
  );
}
