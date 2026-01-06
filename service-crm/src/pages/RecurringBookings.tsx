import { useState, useEffect } from 'react';
import { Repeat, Plus, Edit2, Trash2, X, Calendar, Clock, Pause, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { useToast } from '../context/ToastContext';
import { format, addDays, addWeeks, addMonths } from 'date-fns';

type RecurringBooking = {
  id: string;
  customer_id: string;
  customer_name?: string;
  service_id: string;
  service_name?: string;
  technician_id?: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  day_of_week?: number;
  day_of_month?: number;
  time: string;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  next_occurrence?: string;
};

export default function RecurringBookings() {
  const { tenant } = useTenant();
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<RecurringBooking[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState<RecurringBooking | null>(null);

  useEffect(() => {
    if (!tenant) return;
    fetchData();
  }, [tenant]);

  const fetchData = async () => {
    if (!tenant) return;
    setLoading(true);
    
    const [custRes, svcRes, techRes] = await Promise.all([
      supabase.from('customers').select('id, first_name, last_name').eq('tenant_id', tenant.id),
      supabase.from('services').select('id, name').eq('tenant_id', tenant.id),
      supabase.from('technicians').select('id, first_name, last_name').eq('tenant_id', tenant.id),
    ]);

    setCustomers(custRes.data || []);
    setServices(svcRes.data || []);
    setTechnicians(techRes.data || []);

    // Load from localStorage for now (would be DB in production)
    const saved = localStorage.getItem(`recurring_bookings_${tenant.id}`);
    const recurring = saved ? JSON.parse(saved) : [];
    
    // Enrich with names
    const enriched = recurring.map((b: RecurringBooking) => ({
      ...b,
      customer_name: custRes.data?.find(c => c.id === b.customer_id)?.first_name + ' ' + custRes.data?.find(c => c.id === b.customer_id)?.last_name,
      service_name: svcRes.data?.find(s => s.id === b.service_id)?.name,
      next_occurrence: calculateNextOccurrence(b),
    }));

    setBookings(enriched);
    setLoading(false);
  };

  const calculateNextOccurrence = (booking: RecurringBooking): string => {
    const now = new Date();
    let next = new Date(booking.start_date);
    next.setHours(parseInt(booking.time.split(':')[0]), parseInt(booking.time.split(':')[1]));

    while (next <= now) {
      switch (booking.frequency) {
        case 'daily': next = addDays(next, 1); break;
        case 'weekly': next = addWeeks(next, 1); break;
        case 'biweekly': next = addWeeks(next, 2); break;
        case 'monthly': next = addMonths(next, 1); break;
      }
    }

    if (booking.end_date && next > new Date(booking.end_date)) {
      return 'Ended';
    }

    return format(next, 'MMM d, yyyy h:mm a');
  };

  const saveBookings = (b: RecurringBooking[]) => {
    localStorage.setItem(`recurring_bookings_${tenant?.id}`, JSON.stringify(b));
    fetchData();
  };

  const handleSave = (booking: RecurringBooking) => {
    if (booking.id) {
      saveBookings(bookings.map(b => b.id === booking.id ? booking : b));
    } else {
      saveBookings([...bookings, { ...booking, id: Date.now().toString() }]);
    }
    showToast('Recurring booking saved', 'success');
    setShowForm(false);
    setEditingBooking(null);
  };

  const handleDelete = (id: string) => {
    saveBookings(bookings.filter(b => b.id !== id));
    showToast('Recurring booking deleted', 'success');
  };

  const toggleActive = (id: string) => {
    saveBookings(bookings.map(b => b.id === id ? { ...b, is_active: !b.is_active } : b));
  };

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'biweekly': return 'Every 2 weeks';
      case 'monthly': return 'Monthly';
      default: return freq;
    }
  };

  if (!tenant) return <div className="p-8 text-gray-500">Please select a business</div>;

  return (
    <div className="p-4 lg:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Repeat size={28} /> Recurring Bookings
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Set up automatic repeat appointments</p>
        </div>
        <button
          onClick={() => { setEditingBooking(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} /> New Recurring
        </button>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : bookings.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-8 text-center">
          <Repeat size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No recurring bookings</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Set up repeat appointments for regular customers</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create First Recurring Booking
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookings.map(booking => (
            <div key={booking.id} className={`bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4 ${!booking.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{booking.customer_name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{booking.service_name}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => toggleActive(booking.id)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                    {booking.is_active ? <Pause size={14} className="text-yellow-500" /> : <Play size={14} className="text-green-500" />}
                  </button>
                  <button onClick={() => { setEditingBooking(booking); setShowForm(true); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                    <Edit2 size={14} className="text-gray-500" />
                  </button>
                  <button onClick={() => handleDelete(booking.id)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Repeat size={14} />
                  <span>{getFrequencyLabel(booking.frequency)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Clock size={14} />
                  <span>{booking.time}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Calendar size={14} />
                  <span>Next: {booking.next_occurrence}</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t dark:border-gray-700">
                <span className={`text-xs px-2 py-0.5 rounded ${booking.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                  {booking.is_active ? 'Active' : 'Paused'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <RecurringBookingForm
          booking={editingBooking}
          customers={customers}
          services={services}
          technicians={technicians}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingBooking(null); }}
        />
      )}
    </div>
  );
}

function RecurringBookingForm({ booking, customers, services, technicians, onSave, onClose }: {
  booking: RecurringBooking | null;
  customers: any[];
  services: any[];
  technicians: any[];
  onSave: (b: RecurringBooking) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<RecurringBooking>(booking || {
    id: '',
    customer_id: '',
    service_id: '',
    technician_id: '',
    frequency: 'weekly',
    time: '09:00',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    is_active: true,
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {booking ? 'Edit Recurring Booking' : 'New Recurring Booking'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer</label>
            <select
              value={form.customer_id}
              onChange={e => setForm({ ...form, customer_id: e.target.value })}
              className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
              required
            >
              <option value="">Select customer</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Service</label>
            <select
              value={form.service_id}
              onChange={e => setForm({ ...form, service_id: e.target.value })}
              className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
              required
            >
              <option value="">Select service</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Technician (optional)</label>
            <select
              value={form.technician_id}
              onChange={e => setForm({ ...form, technician_id: e.target.value })}
              className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Auto-assign</option>
              {technicians.map(t => (
                <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Frequency</label>
              <select
                value={form.frequency}
                onChange={e => setForm({ ...form, frequency: e.target.value as any })}
                className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Every 2 Weeks</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time</label>
              <input
                type="time"
                value={form.time}
                onChange={e => setForm({ ...form, time: e.target.value })}
                className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
              <input
                type="date"
                value={form.start_date}
                onChange={e => setForm({ ...form, start_date: e.target.value })}
                className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date (optional)</label>
              <input
                type="date"
                value={form.end_date || ''}
                onChange={e => setForm({ ...form, end_date: e.target.value })}
                className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button onClick={onClose} className="px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              Cancel
            </button>
            <button
              onClick={() => onSave(form)}
              disabled={!form.customer_id || !form.service_id}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
