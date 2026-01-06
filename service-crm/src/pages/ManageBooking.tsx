import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { format, addDays } from 'date-fns';
import { Calendar, Clock, Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function ManageBooking() {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [appointment, setAppointment] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [action, setAction] = useState<'view' | 'reschedule' | 'cancel'>('view');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  const token = new URLSearchParams(window.location.search).get('token');

  useEffect(() => {
    if (token) {
      fetchAppointment();
    } else {
      setError('Invalid booking link');
      setLoading(false);
    }
  }, []);

  const fetchAppointment = async () => {
    const { data, error } = await supabase
      .from('appointments')
      .select('*, service:services(name, duration), tenant:tenants(name, phone, email), customer:customers(first_name, last_name, email)')
      .eq('review_token', token)
      .single();

    if (error || !data) {
      setError('Booking not found');
    } else {
      setAppointment(data);
      setNewDate(data.scheduled_start.split('T')[0]);
      setNewTime(format(new Date(data.scheduled_start), 'HH:mm'));
    }
    setLoading(false);
  };

  const handleReschedule = async () => {
    if (!newDate || !newTime) {
      setError('Please select a new date and time');
      return;
    }

    setProcessing(true);
    setError('');

    const scheduledStart = new Date(`${newDate}T${newTime}`);
    const duration = appointment.service?.duration || 60;
    const scheduledEnd = new Date(scheduledStart.getTime() + duration * 60000);

    const { error } = await supabase
      .from('appointments')
      .update({
        scheduled_start: scheduledStart.toISOString(),
        scheduled_end: scheduledEnd.toISOString(),
        notes: (appointment.notes || '') + `\n[Rescheduled by customer on ${new Date().toLocaleDateString()}]`,
      })
      .eq('id', appointment.id);

    if (error) {
      setError('Failed to reschedule. Please try again.');
    } else {
      setSuccess('Your appointment has been rescheduled successfully!');
      setAppointment({ ...appointment, scheduled_start: scheduledStart.toISOString() });
      setAction('view');
    }
    setProcessing(false);
  };

  const handleCancel = async () => {
    setProcessing(true);
    setError('');

    const { error } = await supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        notes: (appointment.notes || '') + `\n[Cancelled by customer: ${cancelReason || 'No reason provided'}]`,
      })
      .eq('id', appointment.id);

    if (error) {
      setError('Failed to cancel. Please try again.');
    } else {
      setSuccess('Your appointment has been cancelled.');
      setAppointment({ ...appointment, status: 'cancelled' });
      setAction('view');
    }
    setProcessing(false);
  };

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  const availableDates = Array.from({ length: 14 }, (_, i) => {
    const date = addDays(new Date(), i + 1);
    return date.toISOString().split('T')[0];
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  if (error && !appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <AlertTriangle className="text-yellow-500 mx-auto mb-4" size={48} />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Oops!</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Manage Your Booking</h1>
          <p className="text-gray-600">{appointment?.tenant?.name}</p>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex items-center gap-3">
            <CheckCircle className="text-green-600" size={24} />
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Appointment Details */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">{appointment?.service?.name}</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
              appointment?.status === 'cancelled' ? 'bg-red-100 text-red-700' :
              appointment?.status === 'completed' ? 'bg-green-100 text-green-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {appointment?.status}
            </span>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 text-gray-600">
              <Calendar size={18} />
              <span>{format(new Date(appointment?.scheduled_start), 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Clock size={18} />
              <span>{format(new Date(appointment?.scheduled_start), 'h:mm a')}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {appointment?.status === 'scheduled' && action === 'view' && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Need to make changes?</h3>
            <div className="space-y-3">
              <button
                onClick={() => setAction('reschedule')}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Calendar size={20} />
                Reschedule Appointment
              </button>
              <button
                onClick={() => setAction('cancel')}
                className="w-full py-3 px-4 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 flex items-center justify-center gap-2"
              >
                <XCircle size={20} />
                Cancel Appointment
              </button>
            </div>
          </div>
        )}

        {/* Reschedule Form */}
        {action === 'reschedule' && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Select New Date & Time</h3>
            
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <select
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              className="w-full border rounded-lg px-4 py-3 mb-4"
            >
              {availableDates.map(date => (
                <option key={date} value={date}>
                  {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                </option>
              ))}
            </select>

            <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
            <select
              value={newTime}
              onChange={e => setNewTime(e.target.value)}
              className="w-full border rounded-lg px-4 py-3 mb-4"
            >
              {timeSlots.map(time => (
                <option key={time} value={time}>
                  {format(new Date(`2000-01-01T${time}`), 'h:mm a')}
                </option>
              ))}
            </select>

            <div className="flex gap-3">
              <button
                onClick={handleReschedule}
                disabled={processing}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                Confirm Reschedule
              </button>
              <button
                onClick={() => setAction('view')}
                className="px-4 py-3 border rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Cancel Form */}
        {action === 'cancel' && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Cancel Appointment</h3>
            <p className="text-gray-600 text-sm mb-4">Are you sure you want to cancel this appointment?</p>
            
            <textarea
              placeholder="Reason for cancellation (optional)"
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              className="w-full border rounded-lg px-4 py-3 mb-4 h-24 resize-none"
            />

            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={processing}
                className="flex-1 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? <Loader2 className="animate-spin" size={20} /> : <XCircle size={20} />}
                Confirm Cancellation
              </button>
              <button
                onClick={() => setAction('view')}
                className="px-4 py-3 border rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
