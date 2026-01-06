import { useState, useEffect } from 'react';
import { Gauge, Users, MapPin, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';

type ResourceMetric = {
  provider_id: string;
  provider_name: string;
  utilization: number;
  idle_hours: number;
  travel_time: number;
  efficiency_score: number;
};

export default function ResourceOptimization() {
  const { tenant } = useTenant();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<ResourceMetric[]>([]);
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  useEffect(() => {
    if (tenant?.id) loadMetrics();
  }, [tenant?.id, period]);

  const loadMetrics = async () => {
    setLoading(true);
    
    const daysBack = period === 'week' ? 7 : 30;
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

    const [providersRes, bookingsRes] = await Promise.all([
      supabase.from('service_providers').select('id, name').eq('tenant_id', tenant!.id),
      supabase.from('bookings').select('provider_id, scheduled_at, duration, status')
        .eq('tenant_id', tenant!.id).gte('scheduled_at', startDate)
    ]);

    const resourceMetrics: ResourceMetric[] = (providersRes.data || []).map(provider => {
      const providerBookings = bookingsRes.data?.filter(b => b.provider_id === provider.id) || [];
      const completedBookings = providerBookings.filter(b => b.status === 'completed');
      
      const totalWorkHours = daysBack * 8; // 8 hours per day
      const bookedHours = completedBookings.reduce((sum, b) => sum + ((b.duration || 60) / 60), 0);
      const utilization = Math.min((bookedHours / totalWorkHours) * 100, 100);
      const idleHours = Math.max(totalWorkHours - bookedHours, 0);
      
      // Simulate travel time (in a real app, this would use actual location data)
      const travelTime = Math.round(completedBookings.length * (15 + Math.random() * 15));
      
      const efficiencyScore = Math.round(
        utilization * 0.4 +
        Math.max(0, 100 - (idleHours / totalWorkHours * 100)) * 0.3 +
        Math.max(0, 100 - (travelTime / (completedBookings.length * 30) * 100)) * 0.3
      );

      return {
        provider_id: provider.id,
        provider_name: provider.name,
        utilization: Math.round(utilization),
        idle_hours: Math.round(idleHours),
        travel_time: travelTime,
        efficiency_score: Math.min(efficiencyScore, 100)
      };
    }).sort((a, b) => b.efficiency_score - a.efficiency_score);

    setMetrics(resourceMetrics);
    setLoading(false);
  };

  const avgUtilization = metrics.length > 0
    ? Math.round(metrics.reduce((sum, m) => sum + m.utilization, 0) / metrics.length)
    : 0;
  
  const totalIdleHours = metrics.reduce((sum, m) => sum + m.idle_hours, 0);
  const underutilized = metrics.filter(m => m.utilization < 50).length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Gauge className="text-cyan-600" />
          Resource Optimization
        </h1>
        <div className="flex gap-2">
          {['week', 'month'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p as any)}
              className={`px-4 py-2 rounded-lg text-sm ${
                period === p 
                  ? 'bg-cyan-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {p === 'week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-1">
            <TrendingUp size={16} />
            Avg Utilization
          </div>
          <p className={`text-2xl font-bold ${avgUtilization >= 70 ? 'text-green-600' : avgUtilization >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
            {avgUtilization}%
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-1">
            <Clock size={16} />
            Total Idle Hours
          </div>
          <p className="text-2xl font-bold text-orange-600">{totalIdleHours}h</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-1">
            <AlertTriangle size={16} />
            Underutilized
          </div>
          <p className="text-2xl font-bold text-red-600">{underutilized}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-1">
            <Users size={16} />
            Total Staff
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.length}</p>
        </div>
      </div>

      {/* Metrics Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">Resource Efficiency by Provider</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto"></div>
          </div>
        ) : metrics.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No data available</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Provider</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Utilization</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Idle Hours</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Travel Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Efficiency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {metrics.map(metric => (
                <tr key={metric.provider_id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    {metric.provider_name}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-full rounded-full ${
                            metric.utilization >= 70 ? 'bg-green-500' : 
                            metric.utilization >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${metric.utilization}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{metric.utilization}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {metric.idle_hours}h
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {metric.travel_time}min
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      metric.efficiency_score >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      metric.efficiency_score >= 60 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {metric.efficiency_score}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Recommendations */}
      {underutilized > 0 && (
        <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h3 className="font-medium text-yellow-800 dark:text-yellow-400 flex items-center gap-2">
            <AlertTriangle size={18} />
            Optimization Recommendations
          </h3>
          <ul className="mt-2 text-sm text-yellow-700 dark:text-yellow-500 list-disc list-inside">
            <li>{underutilized} provider(s) have utilization below 50% - consider redistributing workload</li>
            <li>Total of {totalIdleHours} idle hours could be optimized with better scheduling</li>
            <li>Consider route optimization to reduce travel time between appointments</li>
          </ul>
        </div>
      )}
    </div>
  );
}
