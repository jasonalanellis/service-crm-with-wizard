import { useState, useEffect } from 'react';
import { Users, Plus, Filter, Tag, Trash2, Edit2, Save, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { useToast } from '../context/ToastContext';

type Segment = {
  id: string;
  name: string;
  description: string;
  criteria: SegmentCriteria[];
  customer_count: number;
  color: string;
  created_at: string;
};

type SegmentCriteria = {
  field: string;
  operator: string;
  value: string;
};

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

const FIELDS = [
  { value: 'total_bookings', label: 'Total Bookings' },
  { value: 'total_spent', label: 'Total Spent' },
  { value: 'last_booking_days', label: 'Days Since Last Booking' },
  { value: 'average_rating', label: 'Average Rating Given' },
  { value: 'customer_since_days', label: 'Customer Since (days)' },
];

const OPERATORS = [
  { value: 'gt', label: 'Greater than' },
  { value: 'lt', label: 'Less than' },
  { value: 'eq', label: 'Equals' },
  { value: 'gte', label: 'Greater or equal' },
  { value: 'lte', label: 'Less or equal' },
];

export default function CustomerSegments() {
  const { tenant } = useTenant();
  const { showToast } = useToast();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: COLORS[0],
    criteria: [{ field: 'total_bookings', operator: 'gte', value: '5' }] as SegmentCriteria[]
  });

  useEffect(() => {
    if (tenant?.id) loadSegments();
  }, [tenant?.id]);

  const loadSegments = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('customer_segments')
      .select('*')
      .eq('tenant_id', tenant!.id)
      .order('created_at', { ascending: false });
    setSegments(data || []);
    setLoading(false);
  };

  const saveSegment = async () => {
    if (!formData.name.trim()) {
      showToast('Segment name is required', 'error');
      return;
    }

    const segmentData = {
      tenant_id: tenant!.id,
      name: formData.name,
      description: formData.description,
      color: formData.color,
      criteria: formData.criteria,
      customer_count: 0 // Will be calculated by a trigger/function
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from('customer_segments').update(segmentData).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('customer_segments').insert(segmentData));
    }

    if (error) {
      showToast('Failed to save segment', 'error');
    } else {
      showToast(editingId ? 'Segment updated' : 'Segment created', 'success');
      resetForm();
      loadSegments();
    }
  };

  const deleteSegment = async (id: string) => {
    if (!confirm('Delete this segment?')) return;
    await supabase.from('customer_segments').delete().eq('id', id);
    showToast('Segment deleted', 'success');
    loadSegments();
  };

  const editSegment = (segment: Segment) => {
    setFormData({
      name: segment.name,
      description: segment.description,
      color: segment.color,
      criteria: segment.criteria || []
    });
    setEditingId(segment.id);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: COLORS[0],
      criteria: [{ field: 'total_bookings', operator: 'gte', value: '5' }]
    });
    setEditingId(null);
    setShowModal(false);
  };

  const addCriteria = () => {
    setFormData({
      ...formData,
      criteria: [...formData.criteria, { field: 'total_bookings', operator: 'gte', value: '' }]
    });
  };

  const removeCriteria = (index: number) => {
    setFormData({
      ...formData,
      criteria: formData.criteria.filter((_, i) => i !== index)
    });
  };

  const updateCriteria = (index: number, field: keyof SegmentCriteria, value: string) => {
    const newCriteria = [...formData.criteria];
    newCriteria[index] = { ...newCriteria[index], [field]: value };
    setFormData({ ...formData, criteria: newCriteria });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Users className="text-blue-600" />
          Customer Segments
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} />
          Create Segment
        </button>
      </div>

      {/* Segments Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : segments.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
          <Filter size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No segments yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Create segments to group customers based on criteria</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create First Segment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {segments.map(segment => (
            <div key={segment.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }}></div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{segment.name}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => editSegment(segment)} className="p-1 text-gray-400 hover:text-blue-600">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => deleteSegment(segment.id)} className="p-1 text-gray-400 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{segment.description || 'No description'}</p>
              
              <div className="flex flex-wrap gap-1 mb-3">
                {segment.criteria?.slice(0, 2).map((c, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
                    <Tag size={10} />
                    {FIELDS.find(f => f.value === c.field)?.label} {c.operator} {c.value}
                  </span>
                ))}
                {(segment.criteria?.length || 0) > 2 && (
                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
                    +{segment.criteria.length - 2} more
                  </span>
                )}
              </div>
              
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{segment.customer_count}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">customers</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingId ? 'Edit Segment' : 'Create Segment'}
              </h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., VIP Customers"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={2}
                  placeholder="Optional description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Color</label>
                <div className="flex gap-2">
                  {COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setFormData({...formData, color})}
                      className={`w-8 h-8 rounded-full ${formData.color === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Criteria</label>
                  <button onClick={addCriteria} className="text-sm text-blue-600 hover:text-blue-700">
                    + Add criteria
                  </button>
                </div>
                
                <div className="space-y-2">
                  {formData.criteria.map((criteria, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <select
                        value={criteria.field}
                        onChange={(e) => updateCriteria(i, 'field', e.target.value)}
                        className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>
                      <select
                        value={criteria.operator}
                        onChange={(e) => updateCriteria(i, 'operator', e.target.value)}
                        className="w-28 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <input
                        type="text"
                        value={criteria.value}
                        onChange={(e) => updateCriteria(i, 'value', e.target.value)}
                        className="w-20 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Value"
                      />
                      {formData.criteria.length > 1 && (
                        <button onClick={() => removeCriteria(i)} className="text-red-500 hover:text-red-600">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={resetForm}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={saveSegment}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Save Segment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
