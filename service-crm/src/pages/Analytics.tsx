import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { TrendingUp, DollarSign, Users, Calendar, BarChart2 } from 'lucide-react';

export default function Analytics() {
  const { tenant } = useTenant();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [stats, setStats] = useState({
    revenue: 0, bookings: 0, newCustomers: 0, avgTicket: 0,
    topServices: [] as { name: string; count: number }[],
    revenueByDay: [] as { date: string; amount: number }[]
  });

  useEffect(() => {
    if (tenant) fetchAnalytics();
  }, [tenant, period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const [appointmentsRes, customersRes] = await Promise.all([
      supabase.from('appointments').select('*, service:services(name)').eq('tenant_id', tenant!.id).gte('created_at', since),
      supabase.from('customers').select('id').eq('tenant_id', tenant!.id).gte('created_at', since)
    ]);

    const appointments = appointmentsRes.data || [];
    const revenue = appointments.reduce((sum, a) => sum + (a.price || 0), 0);
    const bookings = appointments.length;

    const serviceCounts: Record<string, number> = {};
    appointments.forEach(a => {
      const svc = Array.isArray(a.service) ? a.service[0] : a.service;
      const name = svc?.name || 'Unknown';
      serviceCounts[name] = (serviceCounts[name] || 0) + 1;
    });
    const topServices = Object.entries(serviceCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    setStats({
      revenue,
      bookings,
      newCustomers: customersRes.data?.length || 0,
      avgTicket: bookings > 0 ? revenue / bookings : 0,
      topServices,
      revenueByDay: []
    });
    setLoading(false);
  };

  if (!tenant) return <div className="p-8 text-center text-gray-500">Select a business first</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 rounded-lg text-sm ${period === p ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <DollarSign size={16} /> Revenue
              </div>
              <p className="text-2xl font-bold text-gray-900">${stats.revenue.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Calendar size={16} /> Bookings
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.bookings}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Users size={16} /> New Customers
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.newCustomers}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <TrendingUp size={16} /> Avg Ticket
              </div>
              <p className="text-2xl font-bold text-gray-900">${stats.avgTicket.toFixed(2)}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Services</h2>
            {stats.topServices.length === 0 ? (
              <p className="text-gray-500">No service data</p>
            ) : (
              <div className="space-y-3">
                {stats.topServices.map((svc, i) => (
                  <div key={svc.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500 w-6">{i + 1}.</span>
                      <span className="font-medium">{svc.name}</span>
                    </div>
                    <span className="text-gray-600">{svc.count} bookings</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
