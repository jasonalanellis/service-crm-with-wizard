import { CheckCircle, Calendar, Clock, Phone } from 'lucide-react';
import { Service, TimeSlot } from '../types';

interface Props {
  service: Service;
  date: string;
  slot: TimeSlot;
  appointmentId: string;
  tenantPhone: string;
}

export function Confirmation({ service, date, slot, appointmentId, tenantPhone }: Props) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-10 h-10 text-green-500" />
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed</h2>
      <p className="text-gray-500 mb-6">Your appointment has been scheduled</p>

      <div className="bg-white border rounded-xl p-6 text-left mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">{service.name}</h3>
        
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span>{formatDate(date)}</span>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-gray-400" />
            <span>{slot.time} ({service.duration_minutes} min)</span>
          </div>
        </div>

        <div className="border-t mt-4 pt-4">
          <p className="text-xs text-gray-400">Confirmation ID</p>
          <p className="font-mono text-sm text-gray-600">{appointmentId}</p>
        </div>
      </div>

      {tenantPhone && (
        <a
          href={`tel:${tenantPhone}`}
          className="inline-flex items-center gap-2 text-blue-500 hover:underline"
        >
          <Phone className="w-4 h-4" />
          Need to change? Call {tenantPhone}
        </a>
      )}

      <button
        onClick={() => window.location.reload()}
        className="block w-full mt-6 py-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
      >
        Book Another Appointment
      </button>
    </div>
  );
}
