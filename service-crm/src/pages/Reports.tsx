import { useEffect, useState } from 'react';
import { supabase, Technician } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Calendar, Users, Briefcase, Download } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, subDays } from 'date-fns';

interface ReportData {
  revenue: { current: number; previous: number; change: number };
  bookings: { current: number; previous: number; change: number };
  customers: { current: number; previous: number; change: number };
  avgTicket: { current: number; previous: number; change: number };
}

interface ServiceStats {
  name: string;
  bookings: number;
  revenue: number;
}

interface ProviderStats {
  name: string;
  jobs: number;
  revenue: number;
  rating: number;
}

export default function Reports() {
  const { tenant } = useTenant();
  const [dateRange, setDateRange] = useState('month');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData>({
    revenue: { current: 0, previous: 0, change: 0 },
    bookings: { current: 0, previous: 0, change: 0 },
    customers: { current: 0, previous: 0, change: 0 },
    avgTicket: { current: 0, previous: 0, change: 0 }
  });
  const [monthlyRevenue, setMonthlyRevenue] = useState<{ month: string; value: number }[]>([]);
  const [bookingsByStatus, setBookingsByStatus] = useState<{ label: string; value: number; percent: number }[]>([]);
  const [topServices, setTopServices] = useState<ServiceStats[]>([]);
  const [topProviders, setTopProviders] = useState<ProviderStats[]>([]);

  useEffect(() => {
    if (tenant) fetchReportData();
  }, [tenant, dateRange]);

  const fetchReportData = async () => {
    if (!tenant) return;
    setLoading(true);

    const now = new Date();
    let currentStart: Date, currentEnd: Date, prevStart: Date, prevEnd: Date;

    if (dateRange === 'week') {
      currentEnd = now;
      currentStart = subDays(now, 7);
      prevEnd = subDays(now, 7);
      prevStart = subDays(now, 14);
    } else if (dateRange === 'month') {
      currentStart = startOfMonth(now);
      currentEnd = endOfMonth(now);
      const prevMonth = subMonths(now, 1);
      prevStart = startOfMonth(prevMonth);
      prevEnd = endOfMonth(prevMonth);
    } else if (dateRange === 'quarter') {
      currentStart = subMonths(now, 3);
      currentEnd = now;
      prevStart = subMonths(now, 6);
      prevEnd = subMonths(now, 3);
    } else {
      currentStart = subMonths(now, 12);
      currentEnd = now;
      prevStart = subMonths(now, 24);
      prevEnd = subMonths(now, 12);
    }

    // Fetch appointments for current and previous periods
    const [currentAppts, prevAppts, allCustomers, technicians, invoices] = await Promise.all([
      supabase.from('appointments').select('*, customer:customers(*), technician:technicians(*), service:services(*)')
        .eq('tenant_id', tenant.id)
        .gte('scheduled_start', currentStart.toISOString())
        .lte('scheduled_start', currentEnd.toISOString()),
      supabase.from('appointments').select('*')
        .eq('tenant_id', tenant.id)
        .gte('scheduled_start', prevStart.toISOString())
        .lte('scheduled_start', prevEnd.toISOString()),
      supabase.from('customers').select('id, created_at').eq('tenant_id', tenant.id),
      supabase.from('technicians').select('*').eq('tenant_id', tenant.id),
      supabase.from('invoices').select('*').eq('tenant_id', tenant.id)
        .gte('created_at', currentStart.toISOString())
    ]);

    const curAppts = currentAppts.data || [];
    const prvAppts = prevAppts.data || [];
    const customers = allCustomers.data || [];
    const techs = technicians.data || [];
    const invoiceData = invoices.data || [];

    // Calculate revenue from completed appointments
    const curRevenue = curAppts.filter(a => a.status === 'completed').reduce((sum, a) => sum + (a.price || 0), 0);
    const prvRevenue = prvAppts.filter(a => a.status === 'completed').reduce((sum, a) => sum + (a.price || 0), 0);

    // Calculate new customers
    const curNewCustomers = customers.filter(c => new Date(c.created_at!) >= currentStart).length;
    const prvNewCustomers = customers.filter(c => {
      const d = new Date(c.created_at!);
      return d >= prevStart && d <= prevEnd;
    }).length;

    const calcChange = (cur: number, prev: number) => prev === 0 ? 0 : Math.round(((cur - prev) / prev) * 1000) / 10;

    const curAvgTicket = curAppts.length > 0 ? curRevenue / curAppts.filter(a => a.status === 'completed').length : 0;
    const prvAvgTicket = prvAppts.length > 0 ? prvRevenue / prvAppts.filter(a => a.status === 'completed').length : 0;

    setReportData({
      revenue: { current: curRevenue, previous: prvRevenue, change: calcChange(curRevenue, prvRevenue) },
      bookings: { current: curAppts.length, previous: prvAppts.length, change: calcChange(curAppts.length, prvAppts.length) },
      customers: { current: curNewCustomers, previous: prvNewCustomers, change: calcChange(curNewCustomers, prvNewCustomers) },
      avgTicket: { current: Math.round(curAvgTicket), previous: Math.round(prvAvgTicket), change: calcChange(curAvgTicket, prvAvgTicket) }
    });

    // Monthly revenue for last 6 months
    const months: { month: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const m = subMonths(now, i);
      const mStart = startOfMonth(m);
      const mEnd = endOfMonth(m);
      const { data: mAppts } = await supabase.from('appointments')
        .select('price')
        .eq('tenant_id', tenant.id)
        .eq('status', 'completed')
        .gte('scheduled_start', mStart.toISOString())
        .lte('scheduled_start', mEnd.toISOString());
      const rev = (mAppts || []).reduce((s, a) => s + (a.price || 0), 0);
      months.push({ month: format(m, 'MMM'), value: rev });
    }
    setMonthlyRevenue(months);

    // Bookings by status
    const completed = curAppts.filter(a => a.status === 'completed').length;
    const scheduled = curAppts.filter(a => a.status === 'scheduled').length;
    const cancelled = curAppts.filter(a => a.status === 'cancelled').length;
    const total = curAppts.length || 1;
    setBookingsByStatus([
      { label: 'Completed', value: completed, percent: Math.round((completed / total) * 100) },
      { label: 'Scheduled', value: scheduled, percent: Math.round((scheduled / total) * 100) },
      { label: 'Cancelled', value: cancelled, percent: Math.round((cancelled / total) * 100) }
    ]);

    // Top services
    const serviceMap: Record<string, ServiceStats> = {};
    curAppts.forEach(a => {
      const svcName = a.service?.name || 'Unknown';
      if (!serviceMap[svcName]) serviceMap[svcName] = { name: svcName, bookings: 0, revenue: 0 };
      serviceMap[svcName].bookings++;
      serviceMap[svcName].revenue += a.price || 0;
    });
    setTopServices(Object.values(serviceMap).sort((a, b) => b.revenue - a.revenue).slice(0, 4));

    // Top providers
    const providerMap: Record<string, ProviderStats> = {};
    curAppts.filter(a => a.technician).forEach(a => {
      const tech = a.technician as Technician;
      const name = `${tech.first_name} ${tech.last_name?.[0] || ''}.`;
      if (!providerMap[tech.id]) {
        providerMap[tech.id] = { name, jobs: 0, revenue: 0, rating: tech.rating || 0 };
      }
      providerMap[tech.id].jobs++;
      providerMap[tech.id].revenue += a.price || 0;
    });
    setTopProviders(Object.values(providerMap).sort((a, b) => b.revenue - a.revenue).slice(0, 4));

    setLoading(false);
  };

  const StatCard = ({ title, icon: Icon, current, previous, change, prefix = '' }: {
    title: string;
    icon: React.ElementType;
    current: number;
    previous: number;
    change: number;
    prefix?: string;
  }) => (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 bg-gray-100 rounded-lg">
          <Icon size={20} className="text-gray-600" />
        </div>
        <span className={`flex items-center text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change >= 0 ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
          {Math.abs(change)}%
        </span>
      </div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{prefix}{current.toLocaleString()}</p>
      <p className="text-xs text-gray-400 mt-1">vs {prefix}{previous.toLocaleString()} last period</p>
    </div>
  );

  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.value), 1);

  if (!tenant) {
    return <div className="p-8 text-gray-500">Please select a business from the sidebar</div>;
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Business performance insights</p>
        </div>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-white border rounded-lg"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading report data...</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard title="Revenue" icon={DollarSign} {...reportData.revenue} prefix="$" />
            <StatCard title="Bookings" icon={Calendar} {...reportData.bookings} />
            <StatCard title="New Customers" icon={Users} {...reportData.customers} />
            <StatCard title="Avg. Ticket" icon={Briefcase} {...reportData.avgTicket} prefix="$" />
          </div>

          {/* Charts Row */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Revenue Chart */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Revenue Trend</h3>
              <div className="h-48 flex items-end gap-2">
                {monthlyRevenue.map((item) => (
                  <div key={item.month} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                      style={{ height: `${(item.value / maxRevenue) * 160}px`, minHeight: item.value > 0 ? '4px' : '0' }}
                      title={`$${item.value.toLocaleString()}`}
                    />
                    <span className="text-xs text-gray-500 mt-2">{item.month}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bookings by Status */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Booking Status</h3>
              <div className="space-y-4">
                {bookingsByStatus.map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{item.label}</span>
                      <span className="font-medium">{item.value} ({item.percent}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          item.label === 'Completed' ? 'bg-green-500' : 
                          item.label === 'Scheduled' ? 'bg-blue-500' : 'bg-red-500'
                        }`} 
                        style={{ width: `${item.percent}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tables Row */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top Services */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-900">Top Services</h3>
              </div>
              {topServices.length === 0 ? (
                <div className="p-4 text-gray-500 text-center">No service data yet</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">Service</th>
                      <th className="text-right p-3 text-sm font-medium text-gray-600">Bookings</th>
                      <th className="text-right p-3 text-sm font-medium text-gray-600">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {topServices.map((service, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="p-3 text-gray-900">{service.name}</td>
                        <td className="p-3 text-right text-gray-600">{service.bookings}</td>
                        <td className="p-3 text-right font-medium text-green-600">${service.revenue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Top Providers */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-900">Top Providers</h3>
              </div>
              {topProviders.length === 0 ? (
                <div className="p-4 text-gray-500 text-center">No provider data yet</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">Provider</th>
                      <th className="text-right p-3 text-sm font-medium text-gray-600">Jobs</th>
                      <th className="text-right p-3 text-sm font-medium text-gray-600">Rating</th>
                      <th className="text-right p-3 text-sm font-medium text-gray-600">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {topProviders.map((provider, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="p-3 text-gray-900">{provider.name}</td>
                        <td className="p-3 text-right text-gray-600">{provider.jobs}</td>
                        <td className="p-3 text-right">
                          {provider.rating > 0 ? <><span className="text-yellow-500">★</span> {provider.rating}</> : '-'}
                        </td>
                        <td className="p-3 text-right font-medium text-green-600">${provider.revenue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
