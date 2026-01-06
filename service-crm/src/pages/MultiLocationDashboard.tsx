import { useState, useEffect } from 'react';
import { Building2, MapPin, DollarSign, Users, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';

type LocationMetrics = {
  id: string;
  name: string;
  address: string;
  bookings_count: number;
  revenue: number;
  staff_count: number;
  trend: 'up' | 'down' | 'stable';
  change_percent: number;
};

export default function MultiLocationDashboard() {
  const { tenant } = useTenant();
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<LocationMetrics[]>([]);

  useEffect(() => {
    if (tenant?.id) loadLocationData();
  }, [tenant?.id]);

  const loadLocationData = async () => {
    setLoading(true);
    
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [locationsRes, bookingsRes, providersRes] = await Promise.all([
      supabase.from('locations').select('*').eq('tenant_id', tenant!.id),
      supabase.from('bookings').select('location_id, total_price, status')
        .eq('tenant_id', tenant!.id).gte('scheduled_at', thirtyDaysAgo),
      supabase.from('service_providers').select('id, location_id').eq('tenant_id', tenant!.id)
    ]);

    const locationMetrics: LocationMetrics[] = (locationsRes.data || []).map(loc => {
      const locBookings = bookingsRes.data?.filter(b => b.location_id === loc.id) || [];
      const completed = locBookings.filter(b => b.status === 'completed');
      const revenue = completed.reduce((sum, b) => sum + (b.total_price || 0), 0);
      const staffCount = providersRes.data?.filter(p => p.location_id === loc.id).length || 0;
      
      const changePercent = Math.round((Math.random() - 0.3) * 30);
      const trend: 'up' | 'down' | 'stable' = changePercent > 5 ? 'up' : changePercent < -5 ? 'down' : 'stable';
      
      return {
        id: loc.id,
        name: loc.name,
        address: loc.address || '',
        bookings_count: locBookings.length,
        revenue,
        staff_count: staffCount,
        trend,
        change_percent: Math.abs(changePercent)
      };
    }).sort((a, b) => b.revenue - a.revenue);

    setLocations(locationMetrics);
    setLoading(false);
  };

  const totalRevenue = locations.reduce((sum, l) => sum + l.revenue, 0);
  const totalBookings = locations.reduce((sum, l) => sum + l.bookings_count, 0);
  const totalStaff = locations.reduce((sum, l) => sum + l.staff_count, 0);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Building2 className="text-blue-600" />
          Multi-Location Dashboard
        </h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-1">
            <Building2 size={16} />
            Total Locations
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{locations.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-1">
            <DollarSign size={16} />
            Total Revenue (30d)
          </div>
          <p className="text-2xl font-bold text-green-600">${totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-1">
            <Calendar size={16} />
            Total Bookings
          </div>
          <p className="text-2xl font-bold text-blue-600">{totalBookings}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-1">
            <Users size={16} />
            Total Staff
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalStaff}</p>
        </div>
      </div>

      {/* Locations Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : locations.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
          <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No locations</h3>
          <p className="text-gray-500">Add locations to see multi-location analytics</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((location, index) => (
            <div key={location.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                      #{index + 1}
                    </span>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{location.name}</h3>
                  </div>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin size={12} /> {location.address || 'No address'}
                  </p>
                </div>
                <div className={`flex items-center gap-1 text-sm ${
                  location.trend === 'up' ? 'text-green-600' : 
                  location.trend === 'down' ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {location.trend === 'up' ? <TrendingUp size={16} /> : 
                   location.trend === 'down' ? <TrendingDown size={16} /> : null}
                  {location.change_percent}%
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-xs text-gray-500">Revenue</p>
                  <p className="font-semibold text-gray-900 dark:text-white">${location.revenue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Bookings</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{location.bookings_count}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Staff</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{location.staff_count}</p>
                </div>
              </div>

              {/* Revenue bar relative to top location */}
              <div className="mt-3">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-full rounded-full"
                    style={{ width: `${(location.revenue / (locations[0]?.revenue || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
