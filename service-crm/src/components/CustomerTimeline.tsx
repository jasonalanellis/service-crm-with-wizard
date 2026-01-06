import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Calendar, DollarSign, Star, MessageSquare, FileText, Phone, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

type TimelineEvent = {
  id: string;
  type: 'appointment' | 'payment' | 'review' | 'note' | 'created';
  title: string;
  description: string;
  date: Date;
  status?: string;
  amount?: number;
};

type Props = {
  customerId: string;
};

export default function CustomerTimeline({ customerId }: Props) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimeline = async () => {
      const timeline: TimelineEvent[] = [];

      // Fetch appointments
      const { data: appointments } = await supabase
        .from('appointments')
        .select('id, scheduled_start, status, service:services(name)')
        .eq('customer_id', customerId)
        .order('scheduled_start', { ascending: false });

      appointments?.forEach(a => {
        const service = Array.isArray(a.service) ? a.service[0] : a.service;
        timeline.push({
          id: `appt-${a.id}`,
          type: 'appointment',
          title: service?.name || 'Appointment',
          description: `Status: ${a.status}`,
          date: new Date(a.scheduled_start),
          status: a.status,
        });
      });

      // Fetch payments
      const { data: payments } = await supabase
        .from('payments')
        .select('id, amount, status, paid_at, created_at')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      payments?.forEach(p => {
        timeline.push({
          id: `pay-${p.id}`,
          type: 'payment',
          title: `Payment ${p.status === 'paid' ? 'Received' : p.status}`,
          description: `$${Number(p.amount).toLocaleString()}`,
          date: new Date(p.paid_at || p.created_at),
          status: p.status,
          amount: Number(p.amount),
        });
      });

      // Fetch reviews
      const { data: reviews } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at')
        .eq('customer_id', customerId);

      reviews?.forEach(r => {
        timeline.push({
          id: `rev-${r.id}`,
          type: 'review',
          title: `Review: ${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}`,
          description: r.comment || 'No comment',
          date: new Date(r.created_at),
        });
      });

      // Fetch customer creation
      const { data: customer } = await supabase
        .from('customers')
        .select('created_at')
        .eq('id', customerId)
        .single();

      if (customer) {
        timeline.push({
          id: 'created',
          type: 'created',
          title: 'Customer Created',
          description: 'Record added to system',
          date: new Date(customer.created_at),
        });
      }

      // Sort by date descending
      timeline.sort((a, b) => b.date.getTime() - a.date.getTime());
      setEvents(timeline);
      setLoading(false);
    };

    fetchTimeline();
  }, [customerId]);

  const getIcon = (type: string, status?: string) => {
    switch (type) {
      case 'appointment':
        return status === 'completed' ? CheckCircle : status === 'cancelled' ? XCircle : Calendar;
      case 'payment':
        return DollarSign;
      case 'review':
        return Star;
      case 'note':
        return MessageSquare;
      default:
        return FileText;
    }
  };

  const getColor = (type: string, status?: string) => {
    if (type === 'appointment') {
      if (status === 'completed') return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      if (status === 'cancelled') return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
    }
    if (type === 'payment') return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30';
    if (type === 'review') return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
    return 'text-gray-600 bg-gray-100 dark:bg-gray-700';
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Clock size={32} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
      
      <div className="space-y-4">
        {events.map((event, idx) => {
          const Icon = getIcon(event.type, event.status);
          const colorClass = getColor(event.type, event.status);
          
          return (
            <div key={event.id} className="relative flex gap-4 pl-2">
              {/* Icon */}
              <div className={`relative z-10 p-1.5 rounded-full ${colorClass}`}>
                <Icon size={14} />
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-gray-800 dark:text-white text-sm">{event.title}</p>
                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {format(event.date, 'MMM d, yyyy')}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{event.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
