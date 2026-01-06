import { useEffect, useState } from 'react';
import { X, Phone, Mail, MapPin, Calendar, DollarSign, Clock, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

type Props = {
  customerId: string;
  onClose: () => void;
  onViewFull?: () => void;
};

export default function CustomerQuickView({ customerId, onClose, onViewFull }: Props) {
  const [customer, setCustomer] = useState<any>(null);
  const [stats, setStats] = useState({ jobs: 0, spent: 0, lastVisit: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: c } = await supabase.from('customers').select('*').eq('id', customerId).single();
      setCustomer(c);

      const { data: appts } = await supabase.from('appointments').select('scheduled_start').eq('customer_id', customerId).order('scheduled_start', { ascending: false });
      const { data: payments } = await supabase.from('payments').select('amount').eq('customer_id', customerId).eq('status', 'paid');

      setStats({
        jobs: appts?.length || 0,
        spent: payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0,
        lastVisit: appts?.[0]?.scheduled_start || '',
      });
      setLoading(false);
    };
    fetch();
  }, [customerId]);

  if (loading || !customer) {
    return (
      <div className="fixed inset-0 bg-black/30 z-50 flex items-start justify-center pt-20" onClick={onClose}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-80 p-4 animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-start justify-center pt-20" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-80" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">{customer.first_name} {customer.last_name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 space-y-3 text-sm">
          {customer.phone && (
            <a href={`tel:${customer.phone}`} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600">
              <Phone size={14} /> {customer.phone}
            </a>
          )}
          {customer.email && (
            <a href={`mailto:${customer.email}`} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600">
              <Mail size={14} /> {customer.email}
            </a>
          )}
          {customer.address_line1 && (
            <div className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
              <MapPin size={14} className="mt-0.5 flex-shrink-0" />
              <span>{customer.address_line1}{customer.city ? `, ${customer.city}` : ''}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t dark:border-gray-700">
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded p-2 text-center">
              <Calendar size={16} className="mx-auto text-blue-600 dark:text-blue-400 mb-1" />
              <p className="font-semibold text-gray-900 dark:text-white">{stats.jobs}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Jobs</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/30 rounded p-2 text-center">
              <DollarSign size={16} className="mx-auto text-green-600 dark:text-green-400 mb-1" />
              <p className="font-semibold text-gray-900 dark:text-white">${stats.spent.toLocaleString()}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Spent</p>
            </div>
          </div>
          {stats.lastVisit && (
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs">
              <Clock size={12} /> Last visit: {format(new Date(stats.lastVisit), 'MMM d, yyyy')}
            </div>
          )}
          {customer.tags && customer.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {customer.tags.map((tag: string) => (
                <span key={tag} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        {onViewFull && (
          <div className="p-3 border-t dark:border-gray-700">
            <button onClick={onViewFull} className="w-full py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded">
              View Full Profile →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
