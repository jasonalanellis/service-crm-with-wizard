import { useEffect, useState } from 'react';
/* eslint-disable react-hooks/exhaustive-deps */
import { supabase, Appointment, Technician, Customer, Service } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { useToast } from '../context/ToastContext';
import { format, startOfWeek, endOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, X, Clock, Trash2 } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import BookingConflictWarning, { useServiceDuration } from '../components/BookingConflictWarning';
import { addRecentActivity } from '../components/RecentActivitySidebar';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 7); // 7 AM to 6 PM
const DEFAULT_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Schedule() {
  const { tenant } = useTenant();
  const { showToast } = useToast();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filterTech, setFilterTech] = useState<string>('');

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    if (!tenant) return;
    fetchData();
  }, [tenant, currentWeek]);

  const fetchData = async () => {
    if (!tenant) return;
    setLoading(true);

    const [apptRes, techRes, custRes, svcRes] = await Promise.all([
      supabase
        .from('appointments')
        .select('*')
        .eq('tenant_id', tenant.id)
        .gte('scheduled_start', weekStart.toISOString())
        .lte('scheduled_start', weekEnd.toISOString()),
      supabase.from('technicians').select('*').eq('tenant_id', tenant.id),
      supabase.from('customers').select('*').eq('tenant_id', tenant.id),
      supabase.from('services').select('*').eq('tenant_id', tenant.id),
    ]);

    const techs = techRes.data?.map((t, i) => ({ ...t, color: t.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length] })) || [];
    const custs = custRes.data || [];
    const svcs = svcRes.data || [];

    // Manually attach related data
    const appts = (apptRes.data || []).map(a => ({
      ...a,
      customer: custs.find(c => c.id === a.customer_id),
      technician: techs.find(t => t.id === a.technician_id),
      service: svcs.find(s => s.id === a.service_id),
    }));

    setAppointments(appts);
    setTechnicians(techs);
    setCustomers(custs);
    setServices(svcs);
    setLoading(false);
  };

  const getAppointmentsForDay = (day: Date) => {
    return appointments
      .filter(a => isSameDay(parseISO(a.scheduled_start), day))
      .filter(a => !filterTech || a.technician_id === filterTech);
  };

  const getAppointmentPosition = (appt: Appointment) => {
    const time = parseISO(appt.scheduled_start);
    const hour = time.getHours();
    const minutes = time.getMinutes();
    const top = ((hour - 7) * 60 + minutes) * (60 / 60); // 60px per hour
    const duration = appt.scheduled_end 
      ? (new Date(appt.scheduled_end).getTime() - new Date(appt.scheduled_start).getTime()) / 60000 
      : 60;
    const height = duration * (60 / 60);
    return { top, height };
  };

  const getTechColor = (techId?: string) => {
    const tech = technicians.find(t => t.id === techId);
    return tech?.color || '#6B7280';
  };

  const handleDragStart = (e: React.DragEvent, appt: Appointment) => {
    e.dataTransfer.setData('appointmentId', appt.id);
  };

  const handleDrop = async (e: React.DragEvent, day: Date, hour: number) => {
    e.preventDefault();
    const appointmentId = e.dataTransfer.getData('appointmentId');
    if (!appointmentId) return;

    const newDate = new Date(day);
    newDate.setHours(hour, 0, 0, 0);

    const { error } = await supabase
      .from('appointments')
      .update({ scheduled_start: newDate.toISOString() })
      .eq('id', appointmentId);

    if (error) {
      showToast('Failed to reschedule', 'error');
    } else {
      showToast('Appointment rescheduled', 'success');
      fetchData();
    }
  };

  if (!tenant) {
    return <div className="p-8 text-gray-500 dark:text-gray-400">Please select a business from the sidebar</div>;
  }

  return (
    <div className="p-4 lg:p-8 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Schedule</h1>
        <div className="flex items-center gap-3">
          <select
            value={filterTech}
            onChange={e => setFilterTech(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Technicians</option>
            {technicians.map(t => (
              <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
            ))}
          </select>
          <button
            onClick={() => { setSelectedAppointment(null); setShowForm(true); }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} /> Add
          </button>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
          <ChevronLeft size={24} />
        </button>
        <span className="font-semibold text-gray-700">
          {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
        </span>
        <button onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Technician Legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {technicians.map(tech => (
          <div key={tech.id} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tech.color }} />
            <span>{tech.first_name}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      ) : (
        <div className="flex-1 overflow-auto bg-white dark:bg-gray-800 rounded-lg border">
          <div className="grid grid-cols-8 min-w-[800px]">
            {/* Time column */}
            <div className="border-r">
              <div className="h-12 border-b" />
              {HOURS.map(hour => (
                <div key={hour} className="h-[60px] border-b px-2 text-xs text-gray-500 dark:text-gray-400 flex items-start pt-1">
                  {format(new Date().setHours(hour, 0), 'h a')}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map(day => (
              <div key={day.toISOString()} className="border-r last:border-r-0">
                <div className={`h-12 border-b flex flex-col items-center justify-center ${
                  isSameDay(day, new Date()) ? 'bg-blue-50' : ''
                }`}>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{format(day, 'EEE')}</span>
                  <span className={`font-semibold ${isSameDay(day, new Date()) ? 'text-blue-600' : 'text-gray-700'}`}>
                    {format(day, 'd')}
                  </span>
                </div>
                <div className="relative">
                  {HOURS.map(hour => (
                    <div
                      key={hour}
                      className="h-[60px] border-b hover:bg-gray-50 dark:bg-gray-900 cursor-pointer"
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => handleDrop(e, day, hour)}
                      onClick={() => {
                        const newDate = new Date(day);
                        newDate.setHours(hour, 0, 0, 0);
                        setSelectedAppointment({ scheduled_start: newDate.toISOString() } as Appointment);
                        setShowForm(true);
                      }}
                    />
                  ))}
                  {getAppointmentsForDay(day).map(appt => {
                    const { top, height } = getAppointmentPosition(appt);
                    const cust = appt.customer as Customer;
                    return (
                      <div
                        key={appt.id}
                        className="absolute left-1 right-1 rounded px-2 py-1 text-xs text-white cursor-pointer overflow-hidden"
                        style={{
                          top: `${top}px`,
                          height: `${Math.max(height, 30)}px`,
                          backgroundColor: getTechColor(appt.technician_id),
                        }}
                        draggable
                        onDragStart={e => handleDragStart(e, appt)}
                        onClick={e => { e.stopPropagation(); setSelectedAppointment(appt); }}
                      >
                        <p className="font-medium truncate">{cust?.first_name || 'Customer'}</p>
                        <p className="opacity-80 truncate">{format(parseISO(appt.scheduled_start), 'h:mm a')}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <AppointmentForm
          appointment={selectedAppointment}
          tenantId={tenant.id}
          customers={customers}
          technicians={technicians}
          services={services}
          onClose={() => { setShowForm(false); setSelectedAppointment(null); }}
          onSave={() => { setShowForm(false); setSelectedAppointment(null); fetchData(); }}
        />
      )}

      {selectedAppointment && !showForm && selectedAppointment.id && (
        <AppointmentDetail
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onEdit={() => setShowForm(true)}
          onDelete={async () => {
            await supabase.from('appointments').delete().eq('id', selectedAppointment.id);
            showToast('Appointment deleted', 'success');
            setSelectedAppointment(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

function AppointmentDetail({ appointment, onClose, onEdit, onDelete }: {
  appointment: Appointment;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const cust = appointment.customer as Customer;
  const tech = appointment.technician as Technician;
  const svc = appointment.service as Service;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full" onClick={e => e.stopPropagation()}>
          <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Appointment Details</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-300"><X size={24} /></button>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500 dark:text-gray-400">Customer:</span> <p className="font-medium text-gray-900 dark:text-white">{cust?.first_name} {cust?.last_name}</p></div>
              <div><span className="text-gray-500 dark:text-gray-400">Technician:</span> <p className="font-medium text-gray-900 dark:text-white">{tech?.first_name || 'Unassigned'}</p></div>
              <div><span className="text-gray-500 dark:text-gray-400">Service:</span> <p className="font-medium text-gray-900 dark:text-white">{svc?.name || '-'}</p></div>
              <div><span className="text-gray-500 dark:text-gray-400">Status:</span> <p className="font-medium capitalize text-gray-900 dark:text-white">{appointment.status}</p></div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <Clock size={16} className="text-gray-400" />
              <span>{format(parseISO(appointment.scheduled_start), 'EEEE, MMMM d, yyyy h:mm a')}</span>
            </div>
            {appointment.notes && (
              <div className="text-sm"><span className="text-gray-500 dark:text-gray-400">Notes:</span> <p className="text-gray-700 dark:text-gray-300">{appointment.notes}</p></div>
            )}
            <div className="flex gap-2 pt-4 border-t dark:border-gray-700">
              <button onClick={onEdit} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">Edit</button>
              <button onClick={() => setShowDeleteConfirm(true)} className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 flex items-center gap-2">
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        </div>
      </div>
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Appointment"
        message="Are you sure you want to delete this appointment? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => { setShowDeleteConfirm(false); onDelete(); }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}

function AppointmentForm({ appointment, tenantId, customers, technicians, services, onClose, onSave }: {
  appointment: Appointment | null;
  tenantId: string;
  customers: Customer[];
  technicians: Technician[];
  services: Service[];
  onClose: () => void;
  onSave: () => void;
}) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    customer_id: appointment?.customer_id || '',
    technician_id: appointment?.technician_id || '',
    service_id: appointment?.service_id || '',
    scheduled_start: appointment?.scheduled_start ? format(parseISO(appointment.scheduled_start), "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    duration_minutes: 60,
    status: appointment?.status || 'scheduled',
    notes: appointment?.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const serviceDuration = useServiceDuration(form.service_id);

  // Auto-update duration when service changes
  useEffect(() => {
    if (form.service_id && serviceDuration !== 60) {
      setForm(f => ({ ...f, duration_minutes: serviceDuration }));
    }
  }, [serviceDuration, form.service_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_id) {
      showToast('Please select a customer', 'error');
      return;
    }
    setSaving(true);
    const data = {
      customer_id: form.customer_id,
      technician_id: form.technician_id || null,
      service_id: form.service_id || null,
      tenant_id: tenantId,
      scheduled_start: new Date(form.scheduled_start).toISOString(),
      scheduled_end: new Date(new Date(form.scheduled_start).getTime() + form.duration_minutes * 60000).toISOString(),
      status: form.status,
      notes: form.notes,
    };
    if (appointment?.id) {
      const { error } = await supabase.from('appointments').update(data).eq('id', appointment.id);
      if (error) showToast('Failed to update', 'error');
      else { showToast('Appointment updated', 'success'); onSave(); }
    } else {
      const { error } = await supabase.from('appointments').insert(data);
      if (error) showToast('Failed to create', 'error');
      else {
        showToast('Appointment created', 'success');
        addRecentActivity({ type: 'booking', title: 'New Appointment', description: 'Appointment scheduled' });
        onSave();
      }
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">{appointment?.id ? 'Edit Appointment' : 'New Appointment'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-300"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <select value={form.customer_id} onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))} className="w-full border rounded-lg px-3 py-2" required>
            <option value="">Select Customer *</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
          </select>
          <select value={form.technician_id} onChange={e => setForm(f => ({ ...f, technician_id: e.target.value }))} className="w-full border rounded-lg px-3 py-2">
            <option value="">Select Technician</option>
            {technicians.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
          </select>
          <select value={form.service_id} onChange={e => setForm(f => ({ ...f, service_id: e.target.value }))} className="w-full border rounded-lg px-3 py-2">
            <option value="">Select Service</option>
            {services.map(s => <option key={s.id} value={s.id}>{s.name} - ${s.base_price}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-4">
            <input type="datetime-local" value={form.scheduled_start} onChange={e => setForm(f => ({ ...f, scheduled_start: e.target.value }))} className="border rounded-lg px-3 py-2" />
            <input type="number" placeholder="Duration (min)" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) || 60 }))} className="border rounded-lg px-3 py-2" />
          </div>
          <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full border rounded-lg px-3 py-2">
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <textarea placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 h-20 dark:bg-gray-700 dark:text-white" />
          
          {/* Conflict Warning */}
          <BookingConflictWarning
            tenantId={tenantId}
            technicianId={form.technician_id}
            startTime={form.scheduled_start ? new Date(form.scheduled_start).toISOString() : ''}
            duration={form.duration_minutes}
            excludeAppointmentId={appointment?.id}
          />
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:bg-gray-900">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
