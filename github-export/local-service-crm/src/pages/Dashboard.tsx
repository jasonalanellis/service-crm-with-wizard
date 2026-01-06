import { useEffect, useState } from 'react';
import { supabase, Appointment, Lead, Payment } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { format, startOfWeek, endOfWeek, subWeeks, startOfDay, endOfDay, subDays } from 'date-fns';
import { Calendar, TrendingUp, Users, AlertCircle, Clock } from 'lucide-react';

type Stats = {
  todayAppointments: number;
  newLeads: number;
  revenueThisWeek: number;
  revenueLastWeek: number;
  pendingFollowups: number;
  pendingReviews: number;
};

type Activity = {
  id: string;
  type: string;
  description: string;
  created_at: string;
};

export default function Dashboard() {
  const { tenant } = useTenant();
  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant) return;
    
    const fetchData = async () => {
      setLoading(true);
      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
      const lastWeekStart = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
      const lastWeekEnd = endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
      const sevenDaysAgo = subDays(today, 7);

      // Today's appointments
      const { count: todayAppts } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .gte('scheduled_start', startOfDay(today).toISOString())
        .lte('scheduled_start', endOfDay(today).toISOString());

      // New leads (last 7 days)
      const { count: newLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .gte('created_at', sevenDaysAgo.toISOString());

      // Revenue this week
      const { data: thisWeekPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('tenant_id', tenant.id)
        .eq('status', 'paid')
        .gte('paid_at', weekStart.toISOString())
        .lte('paid_at', weekEnd.toISOString());

      // Revenue last week
      const { data: lastWeekPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('tenant_id', tenant.id)
        .eq('status', 'paid')
        .gte('paid_at', lastWeekStart.toISOString())
        .lte('paid_at', lastWeekEnd.toISOString());

      // Pending follow-ups (leads contacted > 3 days ago without status change)
      const { count: pendingFollowups } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .in('status', ['new', 'contacted'])
        .lt('last_contacted_at', subDays(today, 3).toISOString());

      // Pending reviews
      const { count: pendingReviews } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .eq('status', 'pending');

      setStats({
        todayAppointments: todayAppts || 0,
        newLeads: newLeads || 0,
        revenueThisWeek: thisWeekPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0,
        revenueLastWeek: lastWeekPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0,
        pendingFollowups: pendingFollowups || 0,
        pendingReviews: pendingReviews || 0,
      });

      // Recent activity
      const recentActivities: Activity[] = [];
      
      const { data: recentAppts } = await supabase
        .from('appointments')
        .select('id, created_at, customer_id')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      // Fetch customer names separately if we have appointments
      let customerMap: Record<string, { first_name: string; last_name?: string }> = {};
      if (recentAppts && recentAppts.length > 0) {
        const customerIds = [...new Set(recentAppts.map(a => a.customer_id).filter(Boolean))];
        const { data: customers } = await supabase
          .from('customers')
          .select('id, first_name, last_name')
          .in('id', customerIds);
        customers?.forEach(c => { customerMap[c.id] = c; });
      }
      
      recentAppts?.forEach(a => {
        const c = customerMap[a.customer_id];
        recentActivities.push({
          id: `appt-${a.id}`,
          type: 'appointment',
          description: `New appointment scheduled for ${c?.first_name || 'Unknown'} ${c?.last_name || ''}`,
          created_at: a.created_at,
        });
      });

      const { data: recentLeads } = await supabase
        .from('leads')
        .select('id, first_name, last_name, created_at')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      recentLeads?.forEach(l => {
        recentActivities.push({
          id: `lead-${l.id}`,
          type: 'lead',
          description: `New lead: ${l.first_name} ${l.last_name || ''}`,
          created_at: l.created_at,
        });
      });

      recentActivities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setActivities(recentActivities.slice(0, 10));
      setLoading(false);
    };

    fetchData();
  }, [tenant]);

  if (!tenant) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Please select a business from the sidebar</p>
      </div>
    );
  }

  if (loading) {
    return <div className="p-8 text-gray-500">Loading dashboard...</div>;
  }

  const revenueChange = stats && stats.revenueLastWeek > 0
    ? ((stats.revenueThisWeek - stats.revenueLastWeek) / stats.revenueLastWeek * 100).toFixed(1)
    : '0';

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Calendar}
          label="Today's Jobs"
          value={stats?.todayAppointments || 0}
          color="blue"
        />
        <StatCard
          icon={Users}
          label="New Leads (7d)"
          value={stats?.newLeads || 0}
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          label="Revenue This Week"
          value={`$${(stats?.revenueThisWeek || 0).toLocaleString()}`}
          subtext={`${Number(revenueChange) >= 0 ? '+' : ''}${revenueChange}% vs last week`}
          color="purple"
        />
        <StatCard
          icon={AlertCircle}
          label="Pending Reviews"
          value={stats?.pendingReviews || 0}
          color="orange"
        />
      </div>

      {/* Alerts */}
      {stats && stats.pendingFollowups > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-yellow-600" size={24} />
          <div>
            <p className="font-medium text-yellow-800">Follow-up Required</p>
            <p className="text-sm text-yellow-700">
              You have {stats.pendingFollowups} lead(s) that haven't been contacted in over 3 days
            </p>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-800">Recent Activity</h2>
        </div>
        <div className="divide-y">
          {activities.length === 0 ? (
            <p className="p-4 text-gray-500 text-sm">No recent activity</p>
          ) : (
            activities.map(activity => (
              <div key={activity.id} className="p-4 flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'appointment' ? 'bg-blue-500' : 'bg-green-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{activity.description}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <Clock size={12} />
                    {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subtext, color }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-800">{value}</p>
          {subtext && <p className="text-xs text-gray-500">{subtext}</p>}
        </div>
      </div>
    </div>
  );
}
