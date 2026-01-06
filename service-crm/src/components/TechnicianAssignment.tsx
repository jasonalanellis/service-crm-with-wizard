import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { User, Check, X, Loader2 } from 'lucide-react';

interface TechnicianAssignmentProps {
  appointmentId: string;
  currentTechnicianId?: string;
  onAssigned?: (technicianId: string) => void;
  onClose?: () => void;
}

interface Technician {
  id: string;
  user_name: string;
  email: string;
  phone: string;
  status: string;
}

export default function TechnicianAssignment({ appointmentId, currentTechnicianId, onAssigned, onClose }: TechnicianAssignmentProps) {
  const { tenant } = useTenant();
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(currentTechnicianId || null);

  useEffect(() => {
    if (tenant) fetchTechnicians();
  }, [tenant]);

  const fetchTechnicians = async () => {
    if (!tenant) return;
    const { data } = await supabase
      .from('service_providers')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('status', 'active')
      .order('user_name');
    setTechnicians(data || []);
    setLoading(false);
  };

  const assignTechnician = async () => {
    if (!selectedId) return;
    setAssigning(true);

    const { error } = await supabase
      .from('appointments')
      .update({
        technician_id: selectedId,
        assigned_at: new Date().toISOString(),
      })
      .eq('id', appointmentId);

    if (!error && onAssigned) {
      onAssigned(selectedId);
    }
    setAssigning(false);
    if (onClose) onClose();
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={24} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border p-4 min-w-[300px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Assign Technician</h3>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        )}
      </div>

      {technicians.length === 0 ? (
        <p className="text-gray-500 text-sm py-4">No technicians available</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {technicians.map(tech => (
            <button
              key={tech.id}
              onClick={() => setSelectedId(tech.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                selectedId === tech.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                selectedId === tech.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                <User size={20} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900">{tech.user_name}</p>
                <p className="text-xs text-gray-500">{tech.email}</p>
              </div>
              {selectedId === tech.id && (
                <Check className="text-blue-500" size={20} />
              )}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button
          onClick={assignTechnician}
          disabled={!selectedId || assigning}
          className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {assigning ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
          {assigning ? 'Assigning...' : 'Assign'}
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
