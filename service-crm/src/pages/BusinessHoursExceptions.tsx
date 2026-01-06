import { useState, useEffect } from 'react';
import { Clock, Plus, Calendar, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { useToast } from '../context/ToastContext';

type HoursException = {
  id: string;
  date: string;
  type: 'closed' | 'modified';
  name: string;
  open_time?: string;
  close_time?: string;
  reason?: string;
};

export default function BusinessHoursExceptions() {
  const { tenant } = useTenant();
  const { showToast } = useToast();
  const [exceptions, setExceptions] = useState<HoursException[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    type: 'closed' as 'closed' | 'modified',
    name: '',
    open_time: '09:00',
    close_time: '17:00',
    reason: ''
  });

  useEffect(() => {
    if (tenant?.id) loadExceptions();
  }, [tenant?.id]);

  const loadExceptions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('business_hours_exceptions')
      .select('*')
      .eq('tenant_id', tenant!.id)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date');
    setExceptions(data || []);
    setLoading(false);
  };

  const saveException = async () => {
    if (!formData.date || !formData.name) {
      showToast('Date and name are required', 'error');
      return;
    }

    const payload = {
      tenant_id: tenant!.id,
      date: formData.date,
      type: formData.type,
      name: formData.name,
      reason: formData.reason || null,
      open_time: formData.type === 'modified' ? formData.open_time : null,
      close_time: formData.type === 'modified' ? formData.close_time : null
    };

    const { error } = await supabase.from('business_hours_exceptions').insert(payload);

    if (error) {
      showToast('Failed to save exception', 'error');
    } else {
      showToast('Exception added', 'success');
      setShowModal(false);
      setFormData({ date: '', type: 'closed', name: '', open_time: '09:00', close_time: '17:00', reason: '' });
      loadExceptions();
    }
  };

  const deleteException = async (id: string) => {
    await supabase.from('business_hours_exceptions').delete().eq('id', id);
    showToast('Exception removed', 'success');
    loadExceptions();
  };

  const addHoliday = (name: string, date: string) => {
    setFormData({ ...formData, name, date, type: 'closed' });
    setShowModal(true);
  };

  // Common US holidays for quick add
  const upcomingHolidays = [
    { name: "New Year's Day", getDate: (year: number) => `${year}-01-01` },
    { name: "Memorial Day", getDate: (year: number) => `${year}-05-26` },
    { name: "Independence Day", getDate: (year: number) => `${year}-07-04` },
    { name: "Labor Day", getDate: (year: number) => `${year}-09-01` },
    { name: "Thanksgiving", getDate: (year: number) => `${year}-11-27` },
    { name: "Christmas Day", getDate: (year: number) => `${year}-12-25` },
  ];

  const currentYear = new Date().getFullYear();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Clock className="text-orange-600" />
          Business Hours Exceptions
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
        >
          <Plus size={18} />
          Add Exception
        </button>
      </div>

      {/* Quick Add Holidays */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 shadow">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">Quick Add Common Holidays</h3>
        <div className="flex flex-wrap gap-2">
          {upcomingHolidays.map(h => (
            <button
              key={h.name}
              onClick={() => addHoliday(h.name, h.getDate(currentYear))}
              className="px-3 py-1.5 text-sm border border-orange-200 dark:border-orange-800 rounded-lg text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20"
            >
              {h.name}
            </button>
          ))}
        </div>
      </div>

      {/* Exceptions List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          </div>
        ) : exceptions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <p>No upcoming exceptions scheduled</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {exceptions.map(exc => (
              <div key={exc.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {new Date(exc.date).getDate()}
                    </div>
                    <div className="text-xs text-gray-500 uppercase">
                      {new Date(exc.date).toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{exc.name}</h4>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        exc.type === 'closed' 
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {exc.type === 'closed' ? 'Closed' : `${exc.open_time} - ${exc.close_time}`}
                      </span>
                      {exc.reason && <span className="text-gray-500">{exc.reason}</span>}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deleteException(exc.id)}
                  className="p-2 text-gray-400 hover:text-red-600"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Exception</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  placeholder="e.g., Christmas Day"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={formData.type === 'closed'}
                      onChange={() => setFormData({...formData, type: 'closed'})}
                    />
                    <span className="text-gray-700 dark:text-gray-300">Closed</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={formData.type === 'modified'}
                      onChange={() => setFormData({...formData, type: 'modified'})}
                    />
                    <span className="text-gray-700 dark:text-gray-300">Modified Hours</span>
                  </label>
                </div>
              </div>

              {formData.type === 'modified' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Open</label>
                    <input
                      type="time"
                      value={formData.open_time}
                      onChange={(e) => setFormData({...formData, open_time: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Close</label>
                    <input
                      type="time"
                      value={formData.close_time}
                      onChange={(e) => setFormData({...formData, close_time: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason (optional)</label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  placeholder="e.g., Holiday"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={saveException}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
