import { useEffect, useState } from 'react';
import { supabase, Technician, Appointment, Customer, Service } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { format, parseISO, isToday, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, MapPin, User, CheckCircle, AlertCircle, Play } from 'lucide-react';

type ActivityItem = Appointment & {
  customer?: Customer;
  technician?: Technician;
  service?: Service;
};

export default function ProvidersActivity() {
  const { tenant } = useTenant();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');

  useEffect(() => {
    if (!tenant) return;
    fetchData();
  }, [tenant, selectedDate]);

  const fetchData = async () => {
    if (!tenant) return;
    setLoading(true);

    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);

    const [apptRes, techRes, custRes, svcRes] = await Promise.all([
      supabase
        .from('appointments')
        .select('*')
        .eq('tenant_id', tenant.id)
        .gte('scheduled_start', dayStart.toISOString())
        .lte('scheduled_start', dayEnd.toISOString())
        .order('scheduled_start'),
      supabase.from('technicians').select('*').eq('tenant_id', tenant.id),
      supabase.from('customers').select('*').eq('tenant_id', tenant.id),
      supabase.from('services').select('*').eq('tenant_id', tenant.id),
    ]);

    const techs = techRes.data || [];
    const custs = custRes.data || [];
    const svcs = svcRes.data || [];

    const items = (apptRes.data || []).map(a => ({
      ...a,
      customer: custs.find(c => c.id === a.customer_id),
      technician: techs.find(t => t.id === a.technician_id),
      service: svcs.find(s => s.id === a.service_id),
    }));

    setActivities(items);
    setTechnicians(techs);
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} className="text-green-500" />;
      case 'in_progress': return <Play size={16} className="text-blue-500" />;
      case 'cancelled': return <AlertCircle size={16} className="text-red-500" />;
      default: return <Clock size={16} className="text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'border-l-green-500 bg-green-50';
      case 'in_progress': return 'border-l-blue-500 bg-blue-50';
      case 'cancelled': return 'border-l-red-500 bg-red-50';
      default: return 'border-l-yellow-500 bg-yellow-50';
    }
  };

  const getActivitiesByTechnician = (techId: string) => {
    return activities.filter(a => a.technician_id === techId);
  };

  const unassignedActivities = activities.filter(a => !a.technician_id);

  if (!tenant) {
    return <div className="p-8 text-gray-500">Please select a business from the sidebar</div>;
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Providers Activity</h1>
          <p className="text-gray-500 text-sm">Monitor and manage today's bookings assigned to your service providers</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-sm ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode('board')}
            className={`px-3 py-1.5 rounded-lg text-sm ${viewMode === 'board' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            Board
          </button>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => setSelectedDate(subDays(selectedDate, 1))} className="p-2 hover:bg-gray-100 rounded">
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <span className="font-medium">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
          {isToday(selectedDate) && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Today</span>}
        </div>
        <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="p-2 hover:bg-gray-100 rounded">
          <ChevronRight size={20} />
        </button>
        {!isToday(selectedDate) && (
          <button onClick={() => setSelectedDate(new Date())} className="text-sm text-blue-600 hover:underline">
            Go to Today
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-sm text-gray-500">Total Jobs</p>
          <p className="text-2xl font-bold">{activities.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-green-600">{activities.filter(a => a.status === 'completed').length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-sm text-gray-500">In Progress</p>
          <p className="text-2xl font-bold text-blue-600">{activities.filter(a => a.status === 'in_progress').length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-sm text-gray-500">Scheduled</p>
          <p className="text-2xl font-bold text-yellow-600">{activities.filter(a => a.status === 'scheduled').length}</p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading...</div>
      ) : activities.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
          No bookings for {format(selectedDate, 'MMMM d, yyyy')}
        </div>
      ) : viewMode === 'list' ? (
        /* List View */
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 text-left text-sm text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Service Provider</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Address</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {activities.map(activity => (
                <tr key={activity.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{format(parseISO(activity.scheduled_start), 'h:mm a')}</p>
                    <p className="text-xs text-gray-500">{activity.service?.name}</p>
                  </td>
                  <td className="px-4 py-3">
                    {activity.technician ? (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-medium">
                          {activity.technician.first_name?.[0]}{activity.technician.last_name?.[0]}
                        </div>
                        <span>{activity.technician.first_name} {activity.technician.last_name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{activity.customer?.first_name} {activity.customer?.last_name}</p>
                    <p className="text-xs text-gray-500">{activity.customer?.phone}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-600">
                    {activity.customer?.address_line1 || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(activity.status)}
                      <span className="capitalize text-sm">{activity.status.replace('_', ' ')}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Board View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {technicians.map(tech => {
            const techActivities = getActivitiesByTechnician(tech.id);
            return (
              <div key={tech.id} className="bg-white rounded-lg border">
                <div className="p-4 border-b flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                    {tech.first_name?.[0]}{tech.last_name?.[0]}
                  </div>
                  <div>
                    <p className="font-medium">{tech.first_name} {tech.last_name}</p>
                    <p className="text-xs text-gray-500">{techActivities.length} jobs today</p>
                  </div>
                </div>
                <div className="p-2 space-y-2 max-h-80 overflow-y-auto">
                  {techActivities.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No jobs assigned</p>
                  ) : (
                    techActivities.map(activity => (
                      <div key={activity.id} className={`p-3 rounded-lg border-l-4 ${getStatusColor(activity.status)}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{format(parseISO(activity.scheduled_start), 'h:mm a')}</span>
                          {getStatusIcon(activity.status)}
                        </div>
                        <p className="text-sm">{activity.customer?.first_name} {activity.customer?.last_name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin size={12} /> {activity.customer?.address_line1 || 'No address'}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
          
          {unassignedActivities.length > 0 && (
            <div className="bg-white rounded-lg border border-dashed border-gray-300">
              <div className="p-4 border-b flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                  <User size={20} />
                </div>
                <div>
                  <p className="font-medium text-gray-500">Unassigned</p>
                  <p className="text-xs text-gray-400">{unassignedActivities.length} jobs</p>
                </div>
              </div>
              <div className="p-2 space-y-2 max-h-80 overflow-y-auto">
                {unassignedActivities.map(activity => (
                  <div key={activity.id} className="p-3 rounded-lg border-l-4 border-l-gray-300 bg-gray-50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{format(parseISO(activity.scheduled_start), 'h:mm a')}</span>
                      {getStatusIcon(activity.status)}
                    </div>
                    <p className="text-sm">{activity.customer?.first_name} {activity.customer?.last_name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
