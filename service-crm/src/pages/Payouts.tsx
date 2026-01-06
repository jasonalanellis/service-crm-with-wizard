import { useEffect, useState } from 'react';
import { supabase, Technician, Appointment } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { format, startOfMonth, endOfMonth, subMonths, addMonths, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react';

type PayoutSummary = {
  technician: Technician;
  earned: number;
  due: number;
  paid: number;
  jobCount: number;
  hoursWorked: number;
  status: 'up_to_date' | 'due' | 'overdue';
};

export default function Payouts() {
  const { tenant } = useTenant();
  const [payouts, setPayouts] = useState<PayoutSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  useEffect(() => {
    if (!tenant) return;
    fetchPayouts();
  }, [tenant, currentMonth]);

  const fetchPayouts = async () => {
    if (!tenant) return;
    setLoading(true);

    const [techRes, apptRes] = await Promise.all([
      supabase.from('technicians').select('*').eq('tenant_id', tenant.id),
      supabase
        .from('appointments')
        .select('*')
        .eq('tenant_id', tenant.id)
        .gte('scheduled_start', monthStart.toISOString())
        .lte('scheduled_start', monthEnd.toISOString())
        .eq('status', 'completed'),
    ]);

    const technicians = techRes.data || [];
    const appointments = apptRes.data || [];

    // Calculate payouts per technician
    const summaries: PayoutSummary[] = technicians.map(tech => {
      const techAppts = appointments.filter(a => a.technician_id === tech.id);
      const hoursWorked = techAppts.reduce((sum, a) => {
        if (a.scheduled_start && a.scheduled_end) {
          const duration = (new Date(a.scheduled_end).getTime() - new Date(a.scheduled_start).getTime()) / 3600000;
          return sum + duration;
        }
        return sum + 1; // Default 1 hour if no end time
      }, 0);

      const hourlyRate = tech.hourly_rate || 25; // Default $25/hr
      const earned = hoursWorked * hourlyRate;
      
      // For demo, assume 80% has been paid
      const paid = earned * 0.8;
      const due = earned - paid;

      return {
        technician: tech,
        earned: Math.round(earned * 100) / 100,
        due: Math.round(due * 100) / 100,
        paid: Math.round(paid * 100) / 100,
        jobCount: techAppts.length,
        hoursWorked: Math.round(hoursWorked * 10) / 10,
        status: due <= 0 ? 'up_to_date' : due > 100 ? 'overdue' : 'due',
      };
    });

    setPayouts(summaries);
    setLoading(false);
  };

  const totalDue = payouts.reduce((sum, p) => sum + p.due, 0);
  const totalEarned = payouts.reduce((sum, p) => sum + p.earned, 0);
  const totalPaid = payouts.reduce((sum, p) => sum + p.paid, 0);

  const getStatusBadge = (status: PayoutSummary['status']) => {
    switch (status) {
      case 'up_to_date':
        return <span className="inline-flex items-center gap-1 text-green-600 text-sm"><CheckCircle size={14} /> Up to date</span>;
      case 'due':
        return <span className="inline-flex items-center gap-1 text-yellow-600 text-sm"><Clock size={14} /> Due</span>;
      case 'overdue':
        return <span className="inline-flex items-center gap-1 text-red-600 text-sm"><AlertCircle size={14} /> Overdue</span>;
    }
  };

  if (!tenant) {
    return <div className="p-8 text-gray-500">Please select a business from the sidebar</div>;
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Payouts</h1>
          <p className="text-gray-500 text-sm">View and manage your Service Provider's earnings</p>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center gap-4 mb-6">
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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-sm text-gray-500">Total Due</p>
          <p className="text-2xl font-bold text-red-600">${totalDue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-sm text-gray-500">Total Earned</p>
          <p className="text-2xl font-bold">${totalEarned.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-sm text-gray-500">Total Paid</p>
          <p className="text-2xl font-bold text-green-600">${totalPaid.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-sm text-gray-500">Providers</p>
          <p className="text-2xl font-bold">{payouts.length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : payouts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No service providers found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-left text-sm text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Service Provider</th>
                  <th className="px-4 py-3 font-medium text-right">Jobs</th>
                  <th className="px-4 py-3 font-medium text-right">Hours</th>
                  <th className="px-4 py-3 font-medium text-right">Earned</th>
                  <th className="px-4 py-3 font-medium text-right">Paid</th>
                  <th className="px-4 py-3 font-medium text-right">Due</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payouts.map(payout => (
                  <tr key={payout.technician.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                          {payout.technician.first_name?.[0]}{payout.technician.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-medium">{payout.technician.first_name} {payout.technician.last_name}</p>
                          <p className="text-xs text-gray-500">{payout.technician.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">{payout.jobCount}</td>
                    <td className="px-4 py-3 text-right">{payout.hoursWorked}h</td>
                    <td className="px-4 py-3 text-right font-medium">${payout.earned.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-green-600">${payout.paid.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-medium text-red-600">
                      {payout.due > 0 ? `$${payout.due.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(payout.status)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 font-medium">
                <tr>
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-right">{payouts.reduce((s, p) => s + p.jobCount, 0)}</td>
                  <td className="px-4 py-3 text-right">{payouts.reduce((s, p) => s + p.hoursWorked, 0).toFixed(1)}h</td>
                  <td className="px-4 py-3 text-right">${totalEarned.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-green-600">${totalPaid.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-red-600">${totalDue.toFixed(2)}</td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
