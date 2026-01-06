import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { useToast } from '../context/ToastContext';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { DollarSign, Users, Clock, Check, Calendar } from 'lucide-react';

interface PayrollEntry {
  technician_id: string;
  technician_name: string;
  total_jobs: number;
  total_hours: number;
  total_earnings: number;
  pending_amount: number;
  paid_amount: number;
}

export default function Payroll() {
  const { tenant } = useTenant();
  const { showToast } = useToast();
  const [payrollData, setPayrollData] = useState<PayrollEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('week');
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    if (tenant) fetchPayrollData();
  }, [tenant, dateRange]);

  const fetchPayrollData = async () => {
    if (!tenant) return;
    setLoading(true);

    let startDate: Date, endDate: Date;
    const now = new Date();

    if (dateRange === 'week') {
      startDate = startOfWeek(now, { weekStartsOn: 1 });
      endDate = endOfWeek(now, { weekStartsOn: 1 });
    } else {
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
    }

    // Fetch appointments with technician assignments
    const { data: appts } = await supabase
      .from('appointments')
      .select('*, technician:technician_id(*)')
      .eq('tenant_id', tenant.id)
      .gte('scheduled_start', startDate.toISOString())
      .lte('scheduled_start', endDate.toISOString())
      .eq('status', 'completed')
      .not('technician_id', 'is', null);

    setAppointments(appts || []);

    // Group by technician
    const techMap = new Map<string, PayrollEntry>();

    (appts || []).forEach(appt => {
      const techId = appt.technician_id;
      const techName = appt.technician?.user_name || 'Unknown';
      
      if (!techMap.has(techId)) {
        techMap.set(techId, {
          technician_id: techId,
          technician_name: techName,
          total_jobs: 0,
          total_hours: 0,
          total_earnings: 0,
          pending_amount: 0,
          paid_amount: 0,
        });
      }

      const entry = techMap.get(techId)!;
      entry.total_jobs++;
      entry.total_hours += (appt.actual_duration_minutes || appt.duration_minutes || 60) / 60;
      
      const pay = appt.technician_pay || (appt.price * 0.5); // Default 50% if not set
      entry.total_earnings += pay;
      
      if (appt.pay_status === 'paid') {
        entry.paid_amount += pay;
      } else {
        entry.pending_amount += pay;
      }
    });

    setPayrollData(Array.from(techMap.values()));
    setLoading(false);
  };

  const markAsPaid = async (technicianId: string) => {
    // Update all unpaid appointments for this technician
    const pendingAppts = appointments.filter(
      a => a.technician_id === technicianId && a.pay_status !== 'paid'
    );

    for (const appt of pendingAppts) {
      await supabase
        .from('appointments')
        .update({ pay_status: 'paid' })
        .eq('id', appt.id);
    }

    showToast('Marked as paid', 'success');
    fetchPayrollData();
  };

  const totalEarnings = payrollData.reduce((sum, e) => sum + e.total_earnings, 0);
  const totalPending = payrollData.reduce((sum, e) => sum + e.pending_amount, 0);
  const totalPaid = payrollData.reduce((sum, e) => sum + e.paid_amount, 0);

  if (!tenant) return <div className="p-8 text-gray-500">Please select a business</div>;

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Payroll</h1>
          <p className="text-gray-500 text-sm">Track technician earnings and payments</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setDateRange('week')}
            className={`px-4 py-2 rounded-lg ${dateRange === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            This Week
          </button>
          <button
            onClick={() => setDateRange('month')}
            className={`px-4 py-2 rounded-lg ${dateRange === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            This Month
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-2 mb-1">
            <Users className="text-blue-500" size={20} />
            <span className="text-sm text-gray-500">Technicians</span>
          </div>
          <p className="text-2xl font-bold">{payrollData.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="text-green-500" size={20} />
            <span className="text-sm text-gray-500">Total Earnings</span>
          </div>
          <p className="text-2xl font-bold">${totalEarnings.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="text-yellow-500" size={20} />
            <span className="text-sm text-gray-500">Pending</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600">${totalPending.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-2 mb-1">
            <Check className="text-green-500" size={20} />
            <span className="text-sm text-gray-500">Paid</span>
          </div>
          <p className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</p>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-lg border">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : payrollData.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-600">No Payroll Data</h3>
            <p className="text-gray-400 text-sm">Completed jobs with assigned technicians will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-left text-sm text-gray-500">
                <tr>
                  <th className="px-4 py-3">Technician</th>
                  <th className="px-4 py-3 text-right">Jobs</th>
                  <th className="px-4 py-3 text-right">Hours</th>
                  <th className="px-4 py-3 text-right">Earnings</th>
                  <th className="px-4 py-3 text-right">Pending</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payrollData.map(entry => (
                  <tr key={entry.technician_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{entry.technician_name}</td>
                    <td className="px-4 py-3 text-right">{entry.total_jobs}</td>
                    <td className="px-4 py-3 text-right">{entry.total_hours.toFixed(1)}h</td>
                    <td className="px-4 py-3 text-right font-semibold">${entry.total_earnings.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-yellow-600">${entry.pending_amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-green-600">${entry.paid_amount.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      {entry.pending_amount > 0 && (
                        <button
                          onClick={() => markAsPaid(entry.technician_id)}
                          className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200"
                        >
                          <Check size={14} /> Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 font-semibold">
                <tr>
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-right">{payrollData.reduce((s, e) => s + e.total_jobs, 0)}</td>
                  <td className="px-4 py-3 text-right">{payrollData.reduce((s, e) => s + e.total_hours, 0).toFixed(1)}h</td>
                  <td className="px-4 py-3 text-right">${totalEarnings.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-yellow-600">${totalPending.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-green-600">${totalPaid.toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
