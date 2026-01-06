import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { format, startOfWeek, endOfWeek, subWeeks, startOfDay, endOfDay, subDays } from 'date-fns';
import { Calendar, TrendingUp, Users, AlertCircle, DollarSign, Star, CalendarCheck } from 'lucide-react';
import StatsCard from '../components/StatsCard';
import QuickActions from '../components/QuickActions';
import ActivityFeed from '../components/ActivityFeed';
import LoadingSkeleton from '../components/LoadingSkeleton';
import CollapsibleWidget from '../components/CollapsibleWidget';
import DataRefreshIndicator from '../components/DataRefreshIndicator';
import { Calendar as CalendarIcon, Activity as ActivityIcon } from 'lucide-react';

type Stats = {
  todayAppointments: number;
  weekAppointments: number;
  newLeads: number;
  revenueThisWeek: number;
  revenueLastWeek: number;
  pendingFollowups: number;
  pendingReviews: number;
  totalCustomers: number;
};

type Activity = {
  id: string;
  type: 'booking' | 'customer' | 'payment' | 'review' | 'quote';
  title: string;
  description: string;
  time: string;
};

export default function Dashboard({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { tenant } = useTenant();
  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [upcomingJobs, setUpcomingJobs] = useState<any[]>([]);

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 1000 / 60;
    if (diff < 60) return `${Math.floor(diff)}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return format(d, 'MMM d');
  };

  const fetchData = async () => {
    if (!tenant) return;
      setLoading(true);
      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
      const lastWeekStart = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
      const lastWeekEnd = endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
      const sevenDaysAgo = subDays(today, 7);

      const [todayAppts, weekAppts, newLeads, thisWeekPayments, lastWeekPayments, pendingFollowups, pendingReviews, totalCustomers, upcoming] = await Promise.all([
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id).gte('scheduled_start', startOfDay(today).toISOString()).lte('scheduled_start', endOfDay(today).toISOString()),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id).gte('scheduled_start', weekStart.toISOString()).lte('scheduled_start', weekEnd.toISOString()),
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id).gte('created_at', sevenDaysAgo.toISOString()),
        supabase.from('payments').select('amount').eq('tenant_id', tenant.id).eq('status', 'paid').gte('paid_at', weekStart.toISOString()).lte('paid_at', weekEnd.toISOString()),
        supabase.from('payments').select('amount').eq('tenant_id', tenant.id).eq('status', 'paid').gte('paid_at', lastWeekStart.toISOString()).lte('paid_at', lastWeekEnd.toISOString()),
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id).in('status', ['new', 'contacted']).lt('last_contacted_at', subDays(today, 3).toISOString()),
        supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id).eq('status', 'pending'),
        supabase.from('customers').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
        supabase.from('appointments').select('id, scheduled_start, status, customer:customers(name)').eq('tenant_id', tenant.id).gte('scheduled_start', today.toISOString()).order('scheduled_start').limit(5),
      ]);

      setStats({
        todayAppointments: todayAppts.count || 0,
        weekAppointments: weekAppts.count || 0,
        newLeads: newLeads.count || 0,
        revenueThisWeek: thisWeekPayments.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0,
        revenueLastWeek: lastWeekPayments.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0,
        pendingFollowups: pendingFollowups.count || 0,
        pendingReviews: pendingReviews.count || 0,
        totalCustomers: totalCustomers.count || 0,
      });

      setUpcomingJobs(upcoming.data || []);

      // Build activity feed
      const acts: Activity[] = [];
      const { data: recentAppts } = await supabase.from('appointments').select('id, created_at').eq('tenant_id', tenant.id).order('created_at', { ascending: false }).limit(3);
      recentAppts?.forEach(a => acts.push({ id: `b-${a.id}`, type: 'booking', title: 'New booking', description: 'Appointment scheduled', time: formatTime(a.created_at) }));
      
      const { data: recentLeads } = await supabase.from('leads').select('id, first_name, created_at').eq('tenant_id', tenant.id).order('created_at', { ascending: false }).limit(3);
      recentLeads?.forEach(l => acts.push({ id: `c-${l.id}`, type: 'customer', title: `New lead: ${l.first_name}`, description: 'Lead captured', time: formatTime(l.created_at) }));

      acts.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setActivities(acts.slice(0, 8));
    setLoading(false);
  };

  useEffect(() => {
    if (tenant) fetchData();
  }, [tenant]);

  if (!tenant) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Calendar size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Please select a business from the sidebar</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white dark:bg-gray-800 rounded-lg animate-pulse" />)}
        </div>
        <LoadingSkeleton type="list" count={5} />
      </div>
    );
  }

  const revenueChange = stats && stats.revenueLastWeek > 0
    ? Math.round((stats.revenueThisWeek - stats.revenueLastWeek) / stats.revenueLastWeek * 100)
    : 0;

  return (
    <div className="p-4 lg:p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-4">
          <DataRefreshIndicator onRefresh={async () => { setLoading(true); await fetchData(); }} />
          {onNavigate && <QuickActions onNavigate={onNavigate} />}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Today's Jobs" value={stats?.todayAppointments || 0} icon={CalendarCheck} color="blue" />
        <StatsCard title="New Leads (7d)" value={stats?.newLeads || 0} icon={Users} color="green" />
        <StatsCard 
          title="Revenue (Week)" 
          value={`$${(stats?.revenueThisWeek || 0).toLocaleString()}`} 
          icon={DollarSign} 
          color="purple"
          trend={revenueChange !== 0 ? { value: revenueChange, label: 'vs last week' } : undefined}
        />
        <StatsCard title="Total Customers" value={stats?.totalCustomers || 0} icon={Users} color="orange" />
      </div>

      {/* Alerts */}
      {stats && stats.pendingFollowups > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0" size={24} />
          <div>
            <p className="font-medium text-yellow-800 dark:text-yellow-200">Follow-up Required</p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              You have {stats.pendingFollowups} lead(s) that haven't been contacted in over 3 days
            </p>
          </div>
        </div>
      )}

      {/* Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming Jobs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">Upcoming Jobs</h2>
            {onNavigate && (
              <button onClick={() => onNavigate('schedule')} className="text-sm text-blue-600 hover:underline">View all</button>
            )}
          </div>
          <div className="p-4">
            {upcomingJobs.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">No upcoming jobs</p>
            ) : (
              <div className="space-y-3">
                {upcomingJobs.map(job => {
                  const customer = Array.isArray(job.customer) ? job.customer[0] : job.customer;
                  return (
                    <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{customer?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{format(new Date(job.scheduled_start), 'EEE, MMM d @ h:mm a')}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${job.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'}`}>
                        {job.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-4 border-b dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
          </div>
          <div className="p-4">
            <ActivityFeed activities={activities} />
          </div>
        </div>
      </div>
    </div>
  );
}
