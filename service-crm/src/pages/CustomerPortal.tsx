import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, Phone, Mail, CheckCircle, XCircle, Loader2, LogOut, User } from 'lucide-react';

const SUPABASE_URL = 'https://yglaxwekbyfjmbhcwqhi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnbGF4d2VrYnlmam1iaGN3cWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjM5OTYsImV4cCI6MjA4MzAzOTk5Nn0.2FqbdDfX_agNp5G13nF9jx10nH3JB0REoFWQYk9nwxc';

interface Appointment {
  id: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  notes: string;
  price: number;
  payment_status: string;
  service: { name: string; description: string };
  tenant: { name: string; phone: string; email: string };
}

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export default function CustomerPortal() {
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'email' | 'verify' | 'portal'>('email');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  // Check for existing session
  useEffect(() => {
    const storedCustomer = localStorage.getItem('customer_session');
    if (storedCustomer) {
      const parsed = JSON.parse(storedCustomer);
      setCustomer(parsed);
      setStep('portal');
      fetchAppointments(parsed.id);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchAppointments = async (customerId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('appointments')
      .select('*, service:services(name, description), tenant:tenants(name, phone, email)')
      .eq('customer_id', customerId)
      .order('scheduled_start', { ascending: false });
    setAppointments(data || []);
    setLoading(false);
  };

  const sendVerificationCode = async () => {
    setSending(true);
    setError('');
    
    // Find customer by email
    const { data: customers } = await supabase
      .from('customers')
      .select('*')
      .eq('email', email.toLowerCase().trim());

    if (!customers || customers.length === 0) {
      setError('No account found with this email. Please book a service first.');
      setSending(false);
      return;
    }

    // Generate a simple 6-digit code (in production, store this securely)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store code temporarily (in production, use a proper verification table)
    localStorage.setItem('verification_pending', JSON.stringify({ 
      email: email.toLowerCase().trim(), 
      code, 
      customerId: customers[0].id,
      expires: Date.now() + 10 * 60 * 1000 // 10 minutes
    }));

    // Send email with code
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
        body: JSON.stringify({
          tenantId: customers[0].tenant_id,
          to: email,
          subject: 'Your Verification Code',
          html: `<h2>Your verification code is: <strong>${code}</strong></h2><p>This code expires in 10 minutes.</p>`
        })
      });
    } catch (e) {
      // Continue even if email fails (for demo purposes)
      console.log('Email send failed, code:', code);
    }

    setStep('verify');
    setSending(false);
  };

  const verifyCode = async () => {
    const pending = localStorage.getItem('verification_pending');
    if (!pending) {
      setError('Verification expired. Please try again.');
      return;
    }

    const { code, customerId, expires } = JSON.parse(pending);
    
    if (Date.now() > expires) {
      setError('Verification code expired. Please try again.');
      localStorage.removeItem('verification_pending');
      setStep('email');
      return;
    }

    if (verificationCode !== code) {
      setError('Invalid verification code.');
      return;
    }

    // Fetch customer and log them in
    const { data: customerData } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (customerData) {
      setCustomer(customerData);
      localStorage.setItem('customer_session', JSON.stringify(customerData));
      localStorage.removeItem('verification_pending');
      setStep('portal');
      fetchAppointments(customerData.id);
    }
  };

  const logout = () => {
    localStorage.removeItem('customer_session');
    setCustomer(null);
    setAppointments([]);
    setStep('email');
    setEmail('');
    setVerificationCode('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  // Email input step
  if (step === 'email') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="text-blue-600" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Portal</h1>
            <p className="text-gray-600 mt-2">Enter your email to view your bookings</p>
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
          )}
          
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
          />
          
          <button
            onClick={sendVerificationCode}
            disabled={!email || sending}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {sending ? <Loader2 className="animate-spin" size={20} /> : null}
            {sending ? 'Sending...' : 'Continue'}
          </button>
        </div>
      </div>
    );
  }

  // Verification step
  if (step === 'verify') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="text-green-600" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Check Your Email</h1>
            <p className="text-gray-600 mt-2">We sent a verification code to {email}</p>
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
          )}
          
          <input
            type="text"
            placeholder="Enter 6-digit code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4 text-center text-2xl tracking-widest"
            maxLength={6}
          />
          
          <button
            onClick={verifyCode}
            disabled={verificationCode.length !== 6}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Verify
          </button>
          
          <button
            onClick={() => { setStep('email'); setError(''); }}
            className="w-full mt-3 text-gray-600 py-2 hover:text-gray-900"
          >
            Back to email
          </button>
        </div>
      </div>
    );
  }

  // Main portal
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Bookings</h1>
            <p className="text-sm text-gray-600">Welcome, {customer?.first_name}!</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {appointments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Bookings Yet</h2>
            <p className="text-gray-600">You haven't made any bookings yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appt) => (
              <div key={appt.id} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{appt.service?.name}</h3>
                    <p className="text-sm text-gray-600">{appt.tenant?.name}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(appt.status)}`}>
                    {appt.status.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={16} />
                    {format(new Date(appt.scheduled_start), 'MMM d, yyyy')}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock size={16} />
                    {format(new Date(appt.scheduled_start), 'h:mm a')}
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {appt.payment_status === 'paid' ? (
                      <span className="flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle size={16} /> Paid
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-yellow-600 text-sm">
                        <XCircle size={16} /> Payment Pending
                      </span>
                    )}
                  </div>
                  <span className="font-semibold text-gray-900">${appt.price?.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
