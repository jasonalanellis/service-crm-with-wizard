import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, TrendingDown, Star, Clock, DollarSign, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';

type ProviderScore = {
  id: string;
  name: string;
  completedJobs: number;
  rating: number;
  onTimeRate: number;
  revenue: number;
  score: number;
};

export default function PerformanceScorecard() {
  const { tenant } = useTenant();
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<ProviderScore[]>([]);
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');

  useEffect(() => {
    if (tenant?.id) loadScores();
  }, [tenant?.id, period]);

  const loadScores = async () => {
    setLoading(true);
    
    const daysBack = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

    const [providersRes, bookingsRes, reviewsRes] = await Promise.all([
      supabase.from('service_providers').select('id, name').eq('tenant_id', tenant!.id),
      supabase.from('bookings').select('provider_id, status, total_price, scheduled_at, completed_at')
        .eq('tenant_id', tenant!.id).gte('scheduled_at', startDate),
      supabase.from('reviews').select('provider_id, rating').eq('tenant_id', tenant!.id).gte('created_at', startDate)
    ]);

    const providerScores: ProviderScore[] = (providersRes.data || []).map(provider => {
      const providerBookings = bookingsRes.data?.filter(b => b.provider_id === provider.id) || [];
      const completed = providerBookings.filter(b => b.status === 'completed');
      const reviews = reviewsRes.data?.filter(r => r.provider_id === provider.id) || [];
      
      const avgRating = reviews.length > 0 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
        : 0;
      
      const onTime = completed.filter(b => {
        if (!b.completed_at || !b.scheduled_at) return true;
        const scheduled = new Date(b.scheduled_at);
        const completedAt = new Date(b.completed_at);
        const diff = (completedAt.getTime() - scheduled.getTime()) / (1000 * 60);
        return diff <= 30; // Within 30 minutes
      }).length;
      
      const onTimeRate = completed.length > 0 ? (onTime / completed.length) * 100 : 100;
      const revenue = completed.reduce((sum, b) => sum + (b.total_price || 0), 0);
      
      // Calculate overall score (weighted)
      const score = Math.round(
        (avgRating / 5) * 30 + 
        (onTimeRate / 100) * 30 + 
        Math.min(completed.length / 20, 1) * 20 +
        Math.min(revenue / 5000, 1) * 20
      );

      return {
        id: provider.id,
        name: provider.name,
        completedJobs: completed.length,
        rating: avgRating,
        onTimeRate,
        revenue,
        score
      };
    }).sort((a, b) => b.score - a.score);

    setScores(providerScores);
    setLoading(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Trophy className="text-amber-500" />
          Performance Scorecard
        </h1>
        <div className="flex gap-2">
          {['week', 'month', 'quarter'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p as any)}
              className={`px-4 py-2 rounded-lg text-sm ${
                period === p 
                  ? 'bg-amber-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
        </div>
      ) : scores.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
          <Trophy size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No data yet</h3>
          <p className="text-gray-500">Performance scores will appear as bookings are completed</p>
        </div>
      ) : (
        <div className="space-y-4">
          {scores.map((provider, index) => (
            <div key={provider.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-bold text-lg">
                {index + 1}
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">{provider.name}</h3>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Star size={14} className="text-yellow-500" />
                    {provider.rating.toFixed(1)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {provider.onTimeRate.toFixed(0)}% on-time
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={14} />
                    {provider.completedJobs} jobs
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign size={14} />
                    ${provider.revenue.toFixed(0)}
                  </span>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`text-3xl font-bold ${getScoreColor(provider.score)}`}>
                  {provider.score}
                </div>
                <div className="text-xs text-gray-500">Score</div>
              </div>
              
              <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div 
                  className={`h-full rounded-full ${
                    provider.score >= 80 ? 'bg-green-500' : 
                    provider.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${provider.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scoring Legend */}
      <div className="mt-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Score Calculation</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div>Rating: 30%</div>
          <div>On-Time Rate: 30%</div>
          <div>Job Volume: 20%</div>
          <div>Revenue: 20%</div>
        </div>
      </div>
    </div>
  );
}
