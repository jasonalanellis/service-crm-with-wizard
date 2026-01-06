import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { Clock, Calendar, Save, Plus, Trash2, Loader2 } from 'lucide-react';

interface BusinessHours {
  day: string;
  enabled: boolean;
  start: string;
  end: string;
}

interface BlockedDate {
  id: string;
  date: string;
  reason: string;
}

const defaultHours: BusinessHours[] = [
  { day: 'Monday', enabled: true, start: '08:00', end: '18:00' },
  { day: 'Tuesday', enabled: true, start: '08:00', end: '18:00' },
  { day: 'Wednesday', enabled: true, start: '08:00', end: '18:00' },
  { day: 'Thursday', enabled: true, start: '08:00', end: '18:00' },
  { day: 'Friday', enabled: true, start: '08:00', end: '18:00' },
  { day: 'Saturday', enabled: true, start: '09:00', end: '16:00' },
  { day: 'Sunday', enabled: false, start: '09:00', end: '14:00' },
];

export default function ScheduleSettings() {
  const { tenant } = useTenant();
  const [hours, setHours] = useState<BusinessHours[]>(defaultHours);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [bufferTime, setBufferTime] = useState(30);
  const [maxAdvanceBooking, setMaxAdvanceBooking] = useState(30);
  const [minNotice, setMinNotice] = useState(24);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newBlockedDate, setNewBlockedDate] = useState({ date: '', reason: '' });

  useEffect(() => {
    if (tenant) fetchSettings();
  }, [tenant]);

  const fetchSettings = async () => {
    if (!tenant) return;
    setLoading(true);
    const { data } = await supabase
      .from('tenant_settings')
      .select('schedule_settings')
      .eq('tenant_id', tenant.id)
      .single();
    
    if (data?.schedule_settings) {
      const stored = data.schedule_settings as any;
      if (stored.hours) setHours(stored.hours);
      if (stored.blockedDates) setBlockedDates(stored.blockedDates);
      if (stored.bufferTime) setBufferTime(stored.bufferTime);
      if (stored.maxAdvanceBooking) setMaxAdvanceBooking(stored.maxAdvanceBooking);
      if (stored.minNotice) setMinNotice(stored.minNotice);
    }
    setLoading(false);
  };

  const toggleDay = (day: string) => {
    setHours(hours.map(h => h.day === day ? { ...h, enabled: !h.enabled } : h));
    setSaved(false);
  };

  const updateHours = (day: string, field: 'start' | 'end', value: string) => {
    setHours(hours.map(h => h.day === day ? { ...h, [field]: value } : h));
    setSaved(false);
  };

  const addBlockedDate = () => {
    if (newBlockedDate.date && newBlockedDate.reason) {
      setBlockedDates([...blockedDates, { id: Date.now().toString(), ...newBlockedDate }]);
      setNewBlockedDate({ date: '', reason: '' });
      setSaved(false);
    }
  };

  const removeBlockedDate = (id: string) => {
    setBlockedDates(blockedDates.filter(d => d.id !== id));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!tenant) return;
    setSaving(true);

    const payload = {
      hours,
      blockedDates,
      bufferTime,
      maxAdvanceBooking,
      minNotice
    };

    const { data: existing } = await supabase
      .from('tenant_settings')
      .select('id')
      .eq('tenant_id', tenant.id)
      .single();

    if (existing) {
      await supabase
        .from('tenant_settings')
        .update({ schedule_settings: payload, updated_at: new Date().toISOString() })
        .eq('tenant_id', tenant.id);
    } else {
      await supabase
        .from('tenant_settings')
        .insert({ tenant_id: tenant.id, schedule_settings: payload });
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (!tenant) {
    return <div className="p-8 text-gray-500">Please select a business from the sidebar</div>;
  }

  if (loading) {
    return <div className="p-8 text-gray-500">Loading settings...</div>;
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule Settings</h1>
          <p className="text-gray-600">Configure business hours and availability</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            saved ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
          } text-white disabled:opacity-50`}
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Business Hours */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock size={20} />
          Business Hours
        </h3>
        <div className="space-y-3">
          {hours.map((h) => (
            <div key={h.day} className="flex items-center gap-4">
              <button
                onClick={() => toggleDay(h.day)}
                className={`w-10 h-6 rounded-full transition-colors ${
                  h.enabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                  h.enabled ? 'translate-x-4' : 'translate-x-0.5'
                }`} />
              </button>
              <span className={`w-24 ${h.enabled ? 'text-gray-900' : 'text-gray-400'}`}>{h.day}</span>
              {h.enabled ? (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={h.start}
                    onChange={(e) => updateHours(h.day, 'start', e.target.value)}
                    className="px-3 py-1.5 border rounded-lg"
                  />
                  <span className="text-gray-400">to</span>
                  <input
                    type="time"
                    value={h.end}
                    onChange={(e) => updateHours(h.day, 'end', e.target.value)}
                    className="px-3 py-1.5 border rounded-lg"
                  />
                </div>
              ) : (
                <span className="text-gray-400">Closed</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Booking Rules */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Booking Rules</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buffer Between Jobs</label>
            <select
              value={bufferTime}
              onChange={(e) => { setBufferTime(Number(e.target.value)); setSaved(false); }}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>1 hour</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Advance Booking</label>
            <select
              value={maxAdvanceBooking}
              onChange={(e) => { setMaxAdvanceBooking(Number(e.target.value)); setSaved(false); }}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value={7}>1 week</option>
              <option value={14}>2 weeks</option>
              <option value={30}>1 month</option>
              <option value={60}>2 months</option>
              <option value={90}>3 months</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Notice</label>
            <select
              value={minNotice}
              onChange={(e) => { setMinNotice(Number(e.target.value)); setSaved(false); }}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value={2}>2 hours</option>
              <option value={4}>4 hours</option>
              <option value={24}>24 hours</option>
              <option value={48}>48 hours</option>
            </select>
          </div>
        </div>
      </div>

      {/* Blocked Dates */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar size={20} />
          Blocked Dates (Holidays)
        </h3>
        <div className="space-y-3 mb-4">
          {blockedDates.length === 0 ? (
            <p className="text-gray-500 text-sm">No blocked dates configured</p>
          ) : (
            blockedDates.map((d) => (
              <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium">{new Date(d.date).toLocaleDateString()}</span>
                  <span className="text-gray-500 ml-3">{d.reason}</span>
                </div>
                <button onClick={() => removeBlockedDate(d.id)} className="p-2 text-gray-400 hover:text-red-600">
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>
        <div className="flex gap-3">
          <input
            type="date"
            value={newBlockedDate.date}
            onChange={(e) => setNewBlockedDate({ ...newBlockedDate, date: e.target.value })}
            className="px-3 py-2 border rounded-lg"
          />
          <input
            type="text"
            placeholder="Reason (e.g., Holiday)"
            value={newBlockedDate.reason}
            onChange={(e) => setNewBlockedDate({ ...newBlockedDate, reason: e.target.value })}
            className="flex-1 px-3 py-2 border rounded-lg"
          />
          <button
            onClick={addBlockedDate}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            <Plus size={18} />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
