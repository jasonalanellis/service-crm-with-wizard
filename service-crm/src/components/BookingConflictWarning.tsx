import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format, parseISO, addMinutes } from 'date-fns';

type Props = {
  tenantId: string;
  technicianId?: string;
  startTime: string;
  duration: number; // in minutes
  excludeAppointmentId?: string;
};

type Conflict = {
  id: string;
  customer_name: string;
  scheduled_start: string;
  scheduled_end: string;
};

export default function BookingConflictWarning({ tenantId, technicianId, startTime, duration, excludeAppointmentId }: Props) {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!startTime || !duration) {
      setConflicts([]);
      return;
    }

    const checkConflicts = async () => {
      setChecking(true);
      const start = parseISO(startTime);
      const end = addMinutes(start, duration);

      let query = supabase
        .from('appointments')
        .select('id, scheduled_start, scheduled_end, customer:customers(first_name, last_name)')
        .eq('tenant_id', tenantId)
        .neq('status', 'cancelled')
        .or(`scheduled_start.lt.${end.toISOString()},scheduled_end.gt.${start.toISOString()}`);

      if (technicianId) {
        query = query.eq('assigned_technician_id', technicianId);
      }

      if (excludeAppointmentId) {
        query = query.neq('id', excludeAppointmentId);
      }

      const { data } = await query;

      const overlapping = (data || []).filter(appt => {
        const apptStart = new Date(appt.scheduled_start);
        const apptEnd = appt.scheduled_end ? new Date(appt.scheduled_end) : addMinutes(apptStart, 60);
        return apptStart < end && apptEnd > start;
      }).map(appt => {
        const customer = Array.isArray(appt.customer) ? appt.customer[0] : appt.customer;
        return {
          id: appt.id,
          customer_name: customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown',
          scheduled_start: appt.scheduled_start,
          scheduled_end: appt.scheduled_end,
        };
      });

      setConflicts(overlapping);
      setChecking(false);
    };

    const debounce = setTimeout(checkConflicts, 300);
    return () => clearTimeout(debounce);
  }, [tenantId, technicianId, startTime, duration, excludeAppointmentId]);

  if (checking) {
    return (
      <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
        <Clock size={16} className="animate-pulse" />
        Checking availability...
      </div>
    );
  }

  if (conflicts.length === 0) return null;

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" size={18} />
        <div className="flex-1">
          <p className="font-medium text-yellow-800 dark:text-yellow-200 text-sm">
            Scheduling Conflict Detected
          </p>
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
            {conflicts.length} overlapping appointment{conflicts.length > 1 ? 's' : ''} found:
          </p>
          <ul className="mt-2 space-y-1">
            {conflicts.slice(0, 3).map(c => (
              <li key={c.id} className="flex items-center gap-2 text-xs text-yellow-700 dark:text-yellow-300">
                <User size={12} />
                <span>{c.customer_name}</span>
                <span className="text-yellow-600">
                  {format(new Date(c.scheduled_start), 'h:mm a')}
                </span>
              </li>
            ))}
            {conflicts.length > 3 && (
              <li className="text-xs text-yellow-600 dark:text-yellow-400">
                + {conflicts.length - 3} more
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

// Hook for getting service duration
export function useServiceDuration(serviceId: string | undefined): number {
  const [duration, setDuration] = useState(60); // default 60 minutes

  useEffect(() => {
    if (!serviceId) return;
    
    const fetch = async () => {
      const { data } = await supabase
        .from('services')
        .select('duration_minutes')
        .eq('id', serviceId)
        .single();
      
      if (data?.duration_minutes) {
        setDuration(data.duration_minutes);
      }
    };
    
    fetch();
  }, [serviceId]);

  return duration;
}
