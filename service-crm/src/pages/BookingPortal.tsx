import { useEffect, useState, useRef } from 'react';
import { supabase, Service, Tenant } from '../lib/supabase';
import { format, addDays, startOfDay, setHours, setMinutes } from 'date-fns';
import { Calendar, Clock, CheckCircle, ArrowLeft, ArrowRight, MapPin, User, Mail, Phone, Loader2, CreditCard } from 'lucide-react';

const SUPABASE_URL = 'https://yglaxwekbyfjmbhcwqhi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnbGF4d2VrYnlmam1iaGN3cWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjM5OTYsImV4cCI6MjA4MzAzOTk5Nn0.2FqbdDfX_agNp5G13nF9jx10nH3JB0REoFWQYk9nwxc';

type Step = 'services' | 'datetime' | 'details' | 'confirm' | 'payment' | 'success';

interface BookingData {
  service: Service | null;
  date: Date | null;
  time: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  recurring: 'none' | 'weekly' | 'biweekly' | 'monthly';
  recurringWeeks: number;
}

export default function BookingPortal() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<Step>('services');
  const [booking, setBooking] = useState<BookingData>({
    service: null,
    date: null,
    time: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    recurring: 'none',
    recurringWeeks: 4,
  });

  // Get tenant from URL or default to first one
  useEffect(() => {
    const fetchTenant = async () => {
      // In production, you'd get tenant from subdomain or URL param
      const { data: tenants } = await supabase.from('tenants').select('*, stripe_publishable_key').limit(1);
      if (tenants && tenants.length > 0) {
        setTenant(tenants[0]);
      }
    };
    fetchTenant();
  }, []);

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
      .eq('is_active', true)
      .order('name');
    setServices(data || []);
    setLoading(false);
  };

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  const nextDays = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i + 1));

  const [stripeLoaded, setStripeLoaded] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const cardElementRef = useRef<any>(null);
  const stripeRef = useRef<any>(null);

  // Load Stripe
  useEffect(() => {
    if (!(window as any).Stripe) {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.onload = () => setStripeLoaded(true);
      document.head.appendChild(script);
    } else {
      setStripeLoaded(true);
    }
  }, []);

  const initializePayment = async () => {
    if (!booking.service) return;
    setSubmitting(true);
    setPaymentError('');
    
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          amount: booking.service.base_price,
          currency: 'usd',
          tenantId: tenant?.id,
          customerEmail: booking.email,
          description: `${booking.service.name} - ${tenant?.name}`
        })
      });
      
      const result = await response.json();
      if (result.error) throw new Error(result.error.message);
      
      setClientSecret(result.data.clientSecret);
      setStep('payment');
      
      // Initialize Stripe Elements after transition
      setTimeout(() => {
        if ((window as any).Stripe && !stripeRef.current) {
          stripeRef.current = (window as any).Stripe((tenant as any)?.stripe_publishable_key);
          const elements = stripeRef.current.elements({ clientSecret: result.data.clientSecret });
          cardElementRef.current = elements.create('payment');
          cardElementRef.current.mount('#payment-element');
        }
      }, 100);
    } catch (err: any) {
      setPaymentError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayment = async () => {
    if (!stripeRef.current || !clientSecret) return;
    setSubmitting(true);
    setPaymentError('');

    try {
      const { error, paymentIntent } = await stripeRef.current.confirmPayment({
        elements: stripeRef.current.elements({ clientSecret }),
        confirmParams: {
          return_url: window.location.href,
          payment_method_data: {
            billing_details: {
              name: `${booking.firstName} ${booking.lastName}`,
              email: booking.email,
              phone: booking.phone
            }
          }
        },
        redirect: 'if_required'
      });

      if (error) throw new Error(error.message);
      
      if (paymentIntent?.status === 'succeeded') {
        await createBooking(paymentIntent.id);
      }
    } catch (err: any) {
      setPaymentError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const createBooking = async (paymentIntentId?: string) => {
    if (!tenant || !booking.service || !booking.date) return;

    // Create or find customer
    let customerId: string;
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('email', booking.email)
      .single();

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const { data: newCustomer } = await supabase
        .from('customers')
        .insert({
          tenant_id: tenant.id,
          first_name: booking.firstName,
          last_name: booking.lastName,
          email: booking.email,
          phone: booking.phone,
          address_line1: booking.address,
        })
        .select()
        .single();
      customerId = newCustomer?.id;
    }

    // Calculate recurrence dates
    const [hours, minutes] = booking.time.split(':').map(Number);
    const baseStart = setMinutes(setHours(startOfDay(booking.date), hours), minutes);
    const duration = booking.service.duration || 60;
    
    const getDaysBetween = () => {
      if (booking.recurring === 'weekly') return 7;
      if (booking.recurring === 'biweekly') return 14;
      if (booking.recurring === 'monthly') return 28;
      return 0;
    };
    
    const numAppointments = booking.recurring === 'none' ? 1 : Math.ceil(booking.recurringWeeks / (getDaysBetween() / 7));
    const daysBetween = getDaysBetween();
    
    let parentId: string | null = null;
    let firstApptId: string | null = null;
    
    for (let i = 0; i < numAppointments; i++) {
      const scheduledStart = new Date(baseStart.getTime() + i * daysBetween * 24 * 60 * 60 * 1000);
      const scheduledEnd = new Date(scheduledStart.getTime() + duration * 60000);
      
      const { data: newAppt } = await supabase.from('appointments').insert({
        tenant_id: tenant.id,
        customer_id: customerId,
        service_id: booking.service.id,
        scheduled_start: scheduledStart.toISOString(),
        scheduled_end: scheduledEnd.toISOString(),
        status: 'scheduled',
        notes: booking.notes,
        price: booking.service.base_price,
        payment_status: i === 0 && paymentIntentId ? 'paid' : 'pending',
        stripe_payment_intent_id: i === 0 ? paymentIntentId || null : null,
        is_recurring: booking.recurring !== 'none',
        recurring_pattern: booking.recurring !== 'none' ? booking.recurring : null,
        recurring_parent_id: parentId,
      }).select().single();
      
      if (i === 0 && newAppt?.id) {
        parentId = newAppt.id;
        firstApptId = newAppt.id;
      }
    }

    // Send confirmation SMS & Email (non-blocking)
    if (firstApptId) {
      const headers = { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY };
      const body = JSON.stringify({ appointmentId: firstApptId });
      fetch(`${SUPABASE_URL}/functions/v1/send-booking-notification`, { method: 'POST', headers, body }).catch(() => {});
      fetch(`${SUPABASE_URL}/functions/v1/send-booking-email`, { method: 'POST', headers, body }).catch(() => {});
    }

    setStep('success');
  };

  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs && mins) return `${hrs}h ${mins}m`;
    if (hrs) return `${hrs} hour${hrs > 1 ? 's' : ''}`;
    return `${mins} min`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">{tenant?.name || 'Book a Service'}</h1>
          <p className="text-gray-600">Schedule your appointment online</p>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          {['services', 'datetime', 'details', 'confirm', 'payment'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === s ? 'bg-blue-600 text-white' :
                ['services', 'datetime', 'details', 'confirm', 'payment'].indexOf(step) > i ? 'bg-green-500 text-white' :
                'bg-gray-200 text-gray-600'
              }`}>
                {['services', 'datetime', 'details', 'confirm', 'payment'].indexOf(step) > i ? <CheckCircle size={16} /> : i + 1}
              </div>
              {i < 4 && <div className={`w-12 sm:w-16 h-1 mx-1 ${
                ['services', 'datetime', 'details', 'confirm', 'payment'].indexOf(step) > i ? 'bg-green-500' : 'bg-gray-200'
              }`} />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          {step === 'services' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Select a Service</h2>
              {services.length === 0 ? (
                <p className="text-gray-500">No services available at this time.</p>
              ) : (
                <div className="grid gap-4">
                  {services.map(service => (
                    <button
                      key={service.id}
                      onClick={() => { setBooking({ ...booking, service }); setStep('datetime'); }}
                      className={`p-4 border-2 rounded-xl text-left transition-all hover:border-blue-500 ${
                        booking.service?.id === service.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">{service.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              {formatDuration(service.duration)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-green-600">${service.base_price}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 'datetime' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Choose Date & Time</h2>
              
              {/* Date Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {nextDays.map(day => (
                    <button
                      key={day.toISOString()}
                      onClick={() => setBooking({ ...booking, date: day })}
                      className={`p-3 rounded-lg text-center transition-all ${
                        booking.date?.toDateString() === day.toDateString()
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <p className="text-xs">{format(day, 'EEE')}</p>
                      <p className="text-lg font-semibold">{format(day, 'd')}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Selection */}
              {booking.date && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Time</label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {timeSlots.map(time => (
                      <button
                        key={time}
                        onClick={() => setBooking({ ...booking, time })}
                        className={`p-3 rounded-lg text-center transition-all ${
                          booking.time === time
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recurring Options */}
              {booking.date && booking.time && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Repeat Booking?</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { value: 'none', label: 'One-time' },
                      { value: 'weekly', label: 'Weekly' },
                      { value: 'biweekly', label: 'Every 2 weeks' },
                      { value: 'monthly', label: 'Monthly' }
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setBooking({ ...booking, recurring: opt.value as any })}
                        className={`p-2 rounded-lg text-sm transition-all ${
                          booking.recurring === opt.value
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border hover:bg-gray-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {booking.recurring !== 'none' && (
                    <div className="mt-3">
                      <label className="block text-sm text-gray-600 mb-1">For how many weeks?</label>
                      <select
                        value={booking.recurringWeeks}
                        onChange={e => setBooking({ ...booking, recurringWeeks: parseInt(e.target.value) })}
                        className="px-3 py-2 border rounded-lg"
                      >
                        {[4, 8, 12, 16, 24, 52].map(n => (
                          <option key={n} value={n}>{n} weeks</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between mt-8">
                <button onClick={() => setStep('services')} className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
                  <ArrowLeft size={18} /> Back
                </button>
                <button
                  onClick={() => setStep('details')}
                  disabled={!booking.date || !booking.time}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Continue <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {step === 'details' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Your Details</h2>
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <div className="relative">
                      <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={booking.firstName}
                        onChange={e => setBooking({ ...booking, firstName: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 border rounded-lg"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      value={booking.lastName}
                      onChange={e => setBooking({ ...booking, lastName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={booking.email}
                      onChange={e => setBooking({ ...booking, email: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      value={booking.phone}
                      onChange={e => setBooking({ ...booking, phone: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Address *</label>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-3 top-3 text-gray-400" />
                    <textarea
                      value={booking.address}
                      onChange={e => setBooking({ ...booking, address: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border rounded-lg"
                      rows={2}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                  <textarea
                    value={booking.notes}
                    onChange={e => setBooking({ ...booking, notes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={3}
                    placeholder="Any special requests or access instructions..."
                  />
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button onClick={() => setStep('datetime')} className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
                  <ArrowLeft size={18} /> Back
                </button>
                <button
                  onClick={() => setStep('confirm')}
                  disabled={!booking.firstName || !booking.lastName || !booking.email || !booking.phone || !booking.address}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Review Booking <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Confirm Your Booking</h2>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Service</span>
                  <span className="font-medium">{booking.service?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date</span>
                  <span className="font-medium">{booking.date && format(booking.date, 'EEEE, MMMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time</span>
                  <span className="font-medium">{booking.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-medium">{formatDuration(booking.service?.duration || 60)}</span>
                </div>
                <hr />
                <div className="flex justify-between">
                  <span className="text-gray-600">Name</span>
                  <span className="font-medium">{booking.firstName} {booking.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email</span>
                  <span className="font-medium">{booking.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone</span>
                  <span className="font-medium">{booking.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Address</span>
                  <span className="font-medium text-right max-w-[200px]">{booking.address}</span>
                </div>
                <hr />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-green-600">${booking.service?.base_price}</span>
                </div>
              </div>

              <div className="flex justify-between">
                <button onClick={() => setStep('details')} className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
                  <ArrowLeft size={18} /> Back
                </button>
                <button
                  onClick={initializePayment}
                  disabled={submitting || !stripeLoaded}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                  {submitting ? 'Processing...' : 'Proceed to Payment'}
                </button>
              </div>
            </div>
          )}

          {step === 'payment' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Payment</h2>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Due</span>
                  <span className="text-green-600">${booking.service?.base_price}</span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Card Details</label>
                <div id="payment-element" className="p-4 border rounded-lg bg-white min-h-[100px]"></div>
              </div>

              {paymentError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {paymentError}
                </div>
              )}

              <div className="flex justify-between">
                <button onClick={() => setStep('confirm')} className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
                  <ArrowLeft size={18} /> Back
                </button>
                <button
                  onClick={handlePayment}
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                  {submitting ? 'Processing...' : 'Pay & Book'}
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
              <p className="text-gray-600 mb-6">
                Thank you for booking with {tenant?.name}. We've sent a confirmation email to {booking.email}.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 max-w-sm mx-auto text-left">
                <p className="text-sm text-gray-600"><strong>Service:</strong> {booking.service?.name}</p>
                <p className="text-sm text-gray-600"><strong>Date:</strong> {booking.date && format(booking.date, 'MMMM d, yyyy')}</p>
                <p className="text-sm text-gray-600"><strong>Time:</strong> {booking.time}</p>
              </div>
              <button
                onClick={() => {
                  setBooking({ service: null, date: null, time: '', firstName: '', lastName: '', email: '', phone: '', address: '', notes: '', recurring: 'none', recurringWeeks: 4 });
                  setStep('services');
                }}
                className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Book Another Service
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
