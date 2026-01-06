import { useState, useEffect } from 'react';
import { Calendar, Users, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';

type DayCapacity = {
  date: string;
  dayName: string;
  totalSlots: number;
  bookedSlots: number;
  utilization: number;
};

export default function CapacityPlanning() {
  const { tenant } = useTenant();
  const [loading, setLoading] = useState(true);
  const [weekData, setWeekData] = useState<DayCapacity[]>([]);
  const [providerCount, setProviderCount] = useState(0);

  useEffect(() => {
    if (tenant?.id) loadCapacityData();
  }, [tenant?.id]);

  const loadCapacityData = async () => {
    setLoading(true);
    
    const [providersRes, bookingsRes] = await Promise.all([
      supabase.from('service_providers').select('id').eq('tenant_id', tenant!.id),
      supabase.from('bookings').select('scheduled_at').eq('tenant_id', tenant!.id)
        .gte('scheduled_at', new Date().toISOString())
        .lte('scheduled_at', new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString())
    ]);

    const providers = providersRes.data?.length || 1;
    setProviderCount(providers);
    const slotsPerDay = providers * 8; // 8 hours per provider

    const days: DayCapacity[] = [];
    for (let i = 0; i < 14; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayBookings = bookingsRes.data?.filter(b => 
        b.scheduled_at.startsWith(dateStr)
      ).length || 0;

      days.push({
        date: dateStr,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        totalSlots: slotsPerDay,
        bookedSlots: dayBookings,
        utilization: Math.round((dayBookings / slotsPerDay) * 100)
      });
    }

    setWeekData(days);
    setLoading(false);
  };

  const getUtilizationColor = (util: number) => {
    if (util >= 90) return 'bg-red-500';
    if (util >= 70) return 'bg-yellow-500';
    if (util >= 40) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const avgUtilization = weekData.length > 0 
    ? Math.round(weekData.reduce((sum, d) => sum + d.utilization, 0) / weekData.length)
    : 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Calendar className="text-blue-600" />
          Capacity Planning
        </h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-1">
            <Users size={16} />
            Service Providers
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{providerCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-1">
            <Clock size={16} />
            Avg Utilization
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgUtilization}%</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-1">
            <AlertTriangle size={16} />
            High Demand Days
          </div>
          <p className="text-2xl font-bold text-red-600">{weekData.filter(d => d.utilization >= 80).length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-1">
            <Calendar size={16} />
            Available Slots
          </div>
          <p className="text-2xl font-bold text-green-600">
            {weekData.reduce((sum, d) => sum + (d.totalSlots - d.bookedSlots), 0)}
          </p>
        </div>
      </div>

      {/* Capacity Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">14-Day Capacity View</h2>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {weekData.map(day => (
              <div key={day.date} className="flex items-center gap-4">
                <span className="w-32 text-sm text-gray-600 dark:text-gray-400">{day.dayName}</span>
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                  <div 
                    className={`h-full ${getUtilizationColor(day.utilization)} transition-all`}
                    style={{ width: `${Math.min(day.utilization, 100)}%` }}
                  />
                </div>
                <span className="w-16 text-right text-sm font-medium text-gray-900 dark:text-white">
                  {day.utilization}%
                </span>
                <span className="w-24 text-right text-xs text-gray-500">
                  {day.bookedSlots}/{day.totalSlots} slots
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-6 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Low (&lt;40%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Normal (40-70%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">High (70-90%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Critical (&gt;90%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
