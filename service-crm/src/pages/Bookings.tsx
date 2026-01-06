import { useEffect, useState } from 'react';
import { supabase, Appointment, Technician, Customer, Service } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { format, parseISO, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { Plus, ChevronLeft, ChevronRight, Search, Edit, Trash2, CheckSquare } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ExportButton from '../components/ExportButton';
import ConfirmDialog from '../components/ConfirmDialog';
import { usePinnedItems, PinButton } from '../hooks/usePinnedItems';
import { useToast } from '../context/ToastContext';

type BookingWithRelations = Appointment & {
  customer?: Customer;
  technician?: Technician;
  service?: Service;
};

export default function Bookings() {
  const { tenant } = useTenant();
  const [bookings, setBookings] = useState<BookingWithRelations[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchUpdate, setShowBatchUpdate] = useState(false);
  const [batchStatus, setBatchStatus] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const { isPinned, togglePin, sortWithPinned } = usePinnedItems('bookings');
  const { showToast, showUndoToast } = useToast();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  useEffect(() => {
    if (!tenant) return;
    fetchData();
  }, [tenant, currentMonth]);

  const fetchData = async () => {
    if (!tenant) return;
    setLoading(true);

    const [apptRes, techRes, custRes, svcRes] = await Promise.all([
      supabase
        .from('appointments')
        .select('*')
        .eq('tenant_id', tenant.id)
        .gte('scheduled_start', monthStart.toISOString())
        .lte('scheduled_start', monthEnd.toISOString())
        .order('scheduled_start', { ascending: false }),
      supabase.from('technicians').select('*').eq('tenant_id', tenant.id),
      supabase.from('customers').select('*').eq('tenant_id', tenant.id),
      supabase.from('services').select('*').eq('tenant_id', tenant.id),
    ]);

    const techs = techRes.data || [];
    const custs = custRes.data || [];
    const svcs = svcRes.data || [];

    const appts = (apptRes.data || []).map(a => ({
      ...a,
      customer: custs.find(c => c.id === a.customer_id),
      technician: techs.find(t => t.id === a.technician_id),
      service: svcs.find(s => s.id === a.service_id),
    }));

    setBookings(appts);
    setTechnicians(techs);
    setCustomers(custs);
    setServices(svcs);
    setLoading(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredBookings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredBookings.map(b => b.id)));
    }
  };

  const handleBatchStatusUpdate = async () => {
    if (!batchStatus || selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from('appointments').update({ status: batchStatus }).in('id', ids);
    if (error) {
      showToast('Failed to update', 'error');
    } else {
      showToast(`Updated ${ids.length} booking(s)`, 'success');
      setSelectedIds(new Set());
      setShowBatchUpdate(false);
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;
    
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) {
      showToast('Failed to delete', 'error');
    } else {
      showUndoToast('Booking deleted', async () => {
        await supabase.from('appointments').insert(booking);
        fetchData();
      });
      fetchData();
    }
    setDeleteConfirmId(null);
  };

  const filteredBookings = sortWithPinned(bookings.filter(b => {
    const matchSearch = search === '' || 
      b.customer?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.customer?.last_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.customer?.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === '' || b.status === filterStatus;
    return matchSearch && matchStatus;
  }));

  const totalRevenue = filteredBookings.reduce((sum, b) => sum + (b.service?.base_price || 0), 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'scheduled': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPaymentStatus = (booking: BookingWithRelations) => {
    // For now, assume completed = paid, others = pending
    if (booking.status === 'completed') return { label: 'Paid', color: 'text-green-600' };
    if (booking.status === 'cancelled') return { label: 'Refunded', color: 'text-gray-500' };
    return { label: 'Upcoming', color: 'text-yellow-600' };
  };

  if (!tenant) {
    return <div className="p-8 text-gray-500">Please select a business from the sidebar</div>;
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Bookings</h1>
          <p className="text-gray-500 text-sm">View and manage your bookings</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={20} /> New Booking
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-sm text-gray-500">Total Bookings</p>
          <p className="text-2xl font-bold">{filteredBookings.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-sm text-gray-500">Revenue</p>
          <p className="text-2xl font-bold text-green-600">${totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold">{filteredBookings.filter(b => b.status === 'completed').length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-sm text-gray-500">Upcoming</p>
          <p className="text-2xl font-bold">{filteredBookings.filter(b => b.status === 'scheduled').length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border mb-6">
        <div className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between border-b">
          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded">
              <ChevronLeft size={20} />
            </button>
            <span className="font-medium min-w-[140px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded">
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search client..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg w-full sm:w-48"
              />
            </div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="border rounded-lg px-3 py-2"
            >
              <option value="">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No bookings found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-left text-sm text-gray-500">
                <tr>
                  <th className="px-4 py-3 w-8">
                          <input
                            type="checkbox"
                            checked={selectedIds.size === filteredBookings.length && filteredBookings.length > 0}
                            onChange={selectAll}
                            className="rounded"
                          />
                        </th>
                        <th className="w-10"></th>
                        <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Address</th>
                  <th className="px-4 py-3 font-medium">Service Provider</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium text-right">Revenue</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredBookings.map(booking => {
                  const payment = getPaymentStatus(booking);
                  return (
                    <tr key={booking.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${selectedIds.has(booking.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                      <td className="px-4 py-3 w-8">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(booking.id)}
                              onChange={() => toggleSelect(booking.id)}
                              className="rounded"
                            />
                          </td>
                          <td className="px-2">
                            <PinButton isPinned={isPinned(booking.id)} onToggle={() => togglePin(booking.id)} />
                          </td>
                          <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex flex-col items-center justify-center text-blue-600 dark:text-blue-400">
                            <span className="text-xs font-medium">{format(parseISO(booking.scheduled_start), 'dd')}</span>
                            <span className="text-[10px]">{format(parseISO(booking.scheduled_start), 'MMM')}</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{booking.service?.name || 'Service'}</p>
                            <p className="text-xs text-gray-500">{format(parseISO(booking.scheduled_start), 'h:mm a')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{booking.customer?.first_name} {booking.customer?.last_name}</p>
                        <p className="text-xs text-gray-500">{booking.customer?.email}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-600">
                        {booking.customer?.address_line1 ? `${booking.customer.address_line1}${booking.customer.city ? `, ${booking.customer.city}` : ''}` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {booking.technician ? (
                          <span className="text-sm">{booking.technician.first_name} {booking.technician.last_name}</span>
                        ) : (
                          <span className="text-sm text-gray-400">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${payment.color}`}>{payment.label}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        ${booking.service?.base_price?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => setDeleteConfirmId(booking.id)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-red-600">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination placeholder */}
        <div className="p-4 border-t text-sm text-gray-500 dark:text-gray-400 flex items-center justify-between">
          <span>Showing {filteredBookings.length} of {bookings.length} bookings</span>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-blue-600 dark:text-blue-400 font-medium">{selectedIds.size} selected</span>
              <select
                value={batchStatus}
                onChange={e => setBatchStatus(e.target.value)}
                className="border dark:border-gray-600 rounded px-2 py-1 text-sm dark:bg-gray-700 dark:text-white"
              >
                <option value="">Change status to...</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button
                onClick={handleBatchStatusUpdate}
                disabled={!batchStatus}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                Update
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        title="Delete Booking"
        message="Are you sure you want to delete this booking? This action can be undone within 5 seconds."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}
