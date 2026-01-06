import { useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Calendar, Users, Briefcase, Download, Filter } from 'lucide-react';

interface ReportData {
  revenue: { current: number; previous: number; change: number };
  bookings: { current: number; previous: number; change: number };
  customers: { current: number; previous: number; change: number };
  avgTicket: { current: number; previous: number; change: number };
}

const mockData: ReportData = {
  revenue: { current: 45280, previous: 38540, change: 17.5 },
  bookings: { current: 312, previous: 285, change: 9.5 },
  customers: { current: 89, previous: 72, change: 23.6 },
  avgTicket: { current: 145, previous: 135, change: 7.4 }
};

const monthlyRevenue = [
  { month: 'Jul', value: 32000 },
  { month: 'Aug', value: 35000 },
  { month: 'Sep', value: 38000 },
  { month: 'Oct', value: 41000 },
  { month: 'Nov', value: 38500 },
  { month: 'Dec', value: 45280 }
];

const topServices = [
  { name: 'Standard Cleaning', bookings: 145, revenue: 17400 },
  { name: 'Deep Cleaning', bookings: 89, revenue: 19580 },
  { name: 'Move In/Out', bookings: 45, revenue: 12600 },
  { name: 'Office Cleaning', bookings: 33, revenue: 4950 }
];

const topProviders = [
  { name: 'Maria G.', jobs: 45, revenue: 8100, rating: 4.9 },
  { name: 'John D.', jobs: 38, revenue: 6840, rating: 4.7 },
  { name: 'Sarah L.', jobs: 35, revenue: 6300, rating: 4.8 },
  { name: 'Mike R.', jobs: 32, revenue: 5760, rating: 4.6 }
];

export default function Reports() {
  const [dateRange, setDateRange] = useState('month');

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

  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.value));

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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Revenue" icon={DollarSign} {...mockData.revenue} prefix="$" />
        <StatCard title="Bookings" icon={Calendar} {...mockData.bookings} />
        <StatCard title="New Customers" icon={Users} {...mockData.customers} />
        <StatCard title="Avg. Ticket" icon={Briefcase} {...mockData.avgTicket} prefix="$" />
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
                  style={{ height: `${(item.value / maxRevenue) * 160}px` }}
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
            {[
              { label: 'Completed', value: 245, color: 'bg-green-500', percent: 78 },
              { label: 'Scheduled', value: 45, color: 'bg-blue-500', percent: 14 },
              { label: 'Cancelled', value: 22, color: 'bg-red-500', percent: 7 }
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-medium">{item.value} ({item.percent}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.percent}%` }} />
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
        </div>

        {/* Top Providers */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900">Top Providers</h3>
          </div>
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
                    <span className="text-yellow-500">★</span> {provider.rating}
                  </td>
                  <td className="p-3 text-right font-medium text-green-600">${provider.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
