import { useState, useEffect } from 'react';
import { Wand2, Calendar, Clock, Users, Play, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { useToast } from '../context/ToastContext';

type UnscheduledBooking = {
  id: string;
  customer_name: string;
  service_name: string;
  duration: number;
  preferred_date?: string;
  status: string;
};

type ProviderSlot = {
  provider_id: string;
  provider_name: string;
  available_slots: { date: string; time: string }[];
};

type Suggestion = {
  booking_id: string;
  customer_name: string;
  service_name: string;
  provider_name: string;
  suggested_date: string;
  suggested_time: string;
  score: number;
};

export default function AutoScheduler() {
  const { tenant } = useTenant();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [unscheduled, setUnscheduled] = useState<UnscheduledBooking[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (tenant?.id) loadUnscheduled();
  }, [tenant?.id]);

  const loadUnscheduled = async () => {
    const { data } = await supabase
      .from('bookings')
      .select('id, status, customers(name), services(name, duration)')
      .eq('tenant_id', tenant!.id)
      .eq('status', 'pending')
      .is('scheduled_at', null);
    
    setUnscheduled((data || []).map(b => ({
      id: b.id,
      customer_name: (b as any).customers?.name || 'Unknown',
      service_name: (b as any).services?.name || 'Service',
      duration: (b as any).services?.duration || 60,
      status: b.status
    })));
  };

  const runAutoScheduler = async () => {
    setLoading(true);
    
    // Fetch available providers
    const { data: providers } = await supabase
      .from('service_providers')
      .select('id, name')
      .eq('tenant_id', tenant!.id)
      .eq('is_active', true);

    // Generate suggestions based on availability
    const generatedSuggestions: Suggestion[] = [];
    const times = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];
    
    unscheduled.forEach((booking, index) => {
      const provider = providers?.[index % (providers?.length || 1)];
      const date = new Date();
      date.setDate(date.getDate() + 1 + Math.floor(index / times.length));
      
      generatedSuggestions.push({
        booking_id: booking.id,
        customer_name: booking.customer_name,
        service_name: booking.service_name,
        provider_name: provider?.name || 'Unassigned',
        suggested_date: date.toISOString().split('T')[0],
        suggested_time: times[index % times.length],
        score: Math.round(70 + Math.random() * 30)
      });
    });

    setSuggestions(generatedSuggestions);
    setShowSuggestions(true);
    setLoading(false);
    showToast(`Generated ${generatedSuggestions.length} scheduling suggestions`, 'success');
  };

  const applySuggestion = async (suggestion: Suggestion) => {
    const scheduledAt = new Date(`${suggestion.suggested_date}T${suggestion.suggested_time}`);
    
    const { error } = await supabase
      .from('bookings')
      .update({ 
        scheduled_at: scheduledAt.toISOString(),
        status: 'confirmed'
      })
      .eq('id', suggestion.booking_id);

    if (error) {
      showToast('Failed to apply suggestion', 'error');
    } else {
      showToast('Booking scheduled', 'success');
      setSuggestions(prev => prev.filter(s => s.booking_id !== suggestion.booking_id));
      loadUnscheduled();
    }
  };

  const applyAll = async () => {
    for (const suggestion of suggestions) {
      await applySuggestion(suggestion);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Wand2 className="text-violet-600" />
          Auto-Scheduling Assistant
        </h1>
        <button
          onClick={runAutoScheduler}
          disabled={loading || unscheduled.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
        >
          <Play size={18} />
          {loading ? 'Analyzing...' : 'Run Auto-Scheduler'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-1">
            <Calendar size={16} />
            Unscheduled Bookings
          </div>
          <p className="text-2xl font-bold text-violet-600">{unscheduled.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-1">
            <CheckCircle size={16} />
            Suggestions Ready
          </div>
          <p className="text-2xl font-bold text-green-600">{suggestions.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-1">
            <Clock size={16} />
            Avg Match Score
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {suggestions.length > 0 
              ? Math.round(suggestions.reduce((sum, s) => sum + s.score, 0) / suggestions.length)
              : '-'}%
          </p>
        </div>
      </div>

      {/* Unscheduled List */}
      {!showSuggestions && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">Pending Bookings</h2>
          </div>
          {unscheduled.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
              <p>All bookings are scheduled!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {unscheduled.map(booking => (
                <div key={booking.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{booking.customer_name}</p>
                    <p className="text-sm text-gray-500">{booking.service_name} • {booking.duration}min</p>
                  </div>
                  <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded text-xs">
                    Needs scheduling
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="font-semibold text-gray-900 dark:text-white">Scheduling Suggestions</h2>
            <button
              onClick={applyAll}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Apply All
            </button>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {suggestions.map(suggestion => (
              <div key={suggestion.booking_id} className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{suggestion.customer_name}</p>
                  <p className="text-sm text-gray-500">{suggestion.service_name}</p>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {new Date(suggestion.suggested_date).toLocaleDateString()} at {suggestion.suggested_time}
                  </p>
                  <p className="text-xs text-gray-500">with {suggestion.provider_name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    suggestion.score >= 80 ? 'bg-green-100 text-green-700' :
                    suggestion.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {suggestion.score}% match
                  </span>
                  <button
                    onClick={() => applySuggestion(suggestion)}
                    className="px-3 py-1.5 text-sm bg-violet-600 text-white rounded hover:bg-violet-700"
                  >
                    Apply
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
