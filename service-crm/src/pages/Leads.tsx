import { useEffect, useState } from 'react';
import { supabase, Lead } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { useToast } from '../context/ToastContext';
import { format, differenceInDays } from 'date-fns';
import { Phone, Mail, FileText, Calendar, X as XIcon, Plus, GripVertical, Clock } from 'lucide-react';
import { DndContext, DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const STATUSES: { id: Lead['status']; label: string; color: string }[] = [
  { id: 'new', label: 'New', color: 'bg-blue-100 border-blue-300' },
  { id: 'contacted', label: 'Contacted', color: 'bg-yellow-100 border-yellow-300' },
  { id: 'quote_sent', label: 'Quote Sent', color: 'bg-purple-100 border-purple-300' },
  { id: 'booked', label: 'Booked', color: 'bg-green-100 border-green-300' },
  { id: 'lost', label: 'Lost', color: 'bg-gray-100 border-gray-300' },
];

export default function Leads() {
  const { tenant } = useTenant();
  const { showToast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showForm, setShowForm] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    if (!tenant) return;
    fetchLeads();
  }, [tenant]);

  const fetchLeads = async () => {
    if (!tenant) return;
    setLoading(true);
    const { data } = await supabase
      .from('leads')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false });
    setLeads(data || []);
    setLoading(false);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !tenant) return;

    const leadId = active.id as string;
    const newStatus = over.id as Lead['status'];
    
    const lead = leads.find(l => l.id === leadId);
    if (!lead || lead.status === newStatus) return;

    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));

    const { error } = await supabase
      .from('leads')
      .update({ status: newStatus, last_contacted_at: new Date().toISOString() })
      .eq('id', leadId);

    if (error) {
      showToast('Failed to update lead status', 'error');
      fetchLeads();
    } else {
      showToast('Lead status updated', 'success');
    }
  };

  const handleQuickAction = async (lead: Lead, action: string) => {
    switch (action) {
      case 'call':
        window.open(`tel:${lead.phone}`);
        await supabase.from('leads').update({ last_contacted_at: new Date().toISOString() }).eq('id', lead.id);
        break;
      case 'email':
        window.open(`mailto:${lead.email}`);
        await supabase.from('leads').update({ last_contacted_at: new Date().toISOString() }).eq('id', lead.id);
        break;
      case 'lost':
        await supabase.from('leads').update({ status: 'lost' }).eq('id', lead.id);
        showToast('Lead marked as lost', 'info');
        fetchLeads();
        break;
    }
  };

  if (!tenant) {
    return <div className="p-8 text-gray-500 dark:text-gray-400">Please select a business from the sidebar</div>;
  }

  return (
    <div className="p-4 lg:p-8 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leads</h1>
        <button
          onClick={() => { setSelectedLead(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} /> Add Lead
        </button>
      </div>

      {loading ? (
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
            {STATUSES.map(status => (
              <KanbanColumn
                key={status.id}
                status={status}
                leads={leads.filter(l => l.status === status.id)}
                onSelect={setSelectedLead}
                onQuickAction={handleQuickAction}
              />
            ))}
          </div>
        </DndContext>
      )}

      {/* Lead Form Modal */}
      {showForm && (
        <LeadForm
          lead={selectedLead}
          tenantId={tenant.id}
          onClose={() => setShowForm(false)}
          onSave={() => { setShowForm(false); fetchLeads(); }}
        />
      )}

      {/* Lead Detail Modal */}
      {selectedLead && !showForm && (
        <LeadDetail
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onEdit={() => setShowForm(true)}
          onQuickAction={handleQuickAction}
        />
      )}
    </div>
  );
}

function KanbanColumn({ status, leads, onSelect, onQuickAction }: {
  status: { id: Lead['status']; label: string; color: string };
  leads: Lead[];
  onSelect: (lead: Lead) => void;
  onQuickAction: (lead: Lead, action: string) => void;
}) {
  return (
    <div className={`min-w-[280px] flex flex-col rounded-lg border-2 ${status.color}`} id={status.id}>
      <div className="p-3 font-semibold text-gray-700 border-b flex items-center justify-between">
        <span>{status.label}</span>
        <span className="bg-white dark:bg-gray-800/80 text-sm px-2 py-0.5 rounded">{leads.length}</span>
      </div>
      <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy} id={status.id}>
        <div className="flex-1 p-2 space-y-2 min-h-[200px]" data-status={status.id}>
          {leads.map(lead => (
            <LeadCard key={lead.id} lead={lead} onSelect={onSelect} onQuickAction={onQuickAction} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

function LeadCard({ lead, onSelect, onQuickAction }: {
  lead: Lead;
  onSelect: (lead: Lead) => void;
  onQuickAction: (lead: Lead, action: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    data: { status: lead.status },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const daysSinceContact = lead.last_contacted_at
    ? differenceInDays(new Date(), new Date(lead.last_contacted_at))
    : differenceInDays(new Date(), new Date(lead.created_at));

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 cursor-pointer hover:shadow-md border"
      onClick={() => onSelect(lead)}
    >
      <div className="flex items-start gap-2">
        <button {...attributes} {...listeners} className="mt-1 text-gray-400 cursor-grab">
          <GripVertical size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 dark:text-white truncate">
            {lead.first_name} {lead.last_name}
          </p>
          {lead.service_requested && (
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{lead.service_requested}</p>
          )}
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
            {lead.source && <span className="bg-gray-100 px-2 py-0.5 rounded">{lead.source}</span>}
            <span className={`flex items-center gap-1 ${daysSinceContact > 3 ? 'text-red-500' : ''}`}>
              <Clock size={12} /> {daysSinceContact}d
            </span>
          </div>
        </div>
      </div>
      <div className="flex gap-1 mt-3 pt-2 border-t" onClick={e => e.stopPropagation()}>
        {lead.phone && (
          <button onClick={() => onQuickAction(lead, 'call')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="Call">
            <Phone size={16} className="text-green-600" />
          </button>
        )}
        {lead.email && (
          <button onClick={() => onQuickAction(lead, 'email')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="Email">
            <Mail size={16} className="text-blue-600" />
          </button>
        )}
      </div>
    </div>
  );
}

function LeadDetail({ lead, onClose, onEdit, onQuickAction }: {
  lead: Lead;
  onClose: () => void;
  onEdit: () => void;
  onQuickAction: (lead: Lead, action: string) => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">{lead.first_name} {lead.last_name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-300"><XIcon size={24} /></button>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500 dark:text-gray-400">Status:</span> <span className="font-medium capitalize">{lead.status.replace('_', ' ')}</span></div>
            <div><span className="text-gray-500 dark:text-gray-400">Source:</span> <span className="font-medium">{lead.source || '-'}</span></div>
            <div><span className="text-gray-500 dark:text-gray-400">Phone:</span> <span className="font-medium">{lead.phone || '-'}</span></div>
            <div><span className="text-gray-500 dark:text-gray-400">Email:</span> <span className="font-medium">{lead.email || '-'}</span></div>
          </div>
          {lead.address && <div className="text-sm"><span className="text-gray-500 dark:text-gray-400">Address:</span> <p>{lead.address}</p></div>}
          {lead.service_requested && <div className="text-sm"><span className="text-gray-500 dark:text-gray-400">Service:</span> <p>{lead.service_requested}</p></div>}
          {lead.notes && <div className="text-sm"><span className="text-gray-500 dark:text-gray-400">Notes:</span> <p className="whitespace-pre-wrap">{lead.notes}</p></div>}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Created: {format(new Date(lead.created_at), 'MMM d, yyyy h:mm a')}
            {lead.last_contacted_at && <> | Last Contact: {format(new Date(lead.last_contacted_at), 'MMM d, yyyy')}</>}
          </div>
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {lead.phone && (
              <button onClick={() => onQuickAction(lead, 'call')} className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                <Phone size={16} /> Call
              </button>
            )}
            {lead.email && (
              <button onClick={() => onQuickAction(lead, 'email')} className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
                <Mail size={16} /> Email
              </button>
            )}
            <button onClick={onEdit} className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              <FileText size={16} /> Edit
            </button>
            {lead.status !== 'lost' && lead.status !== 'booked' && (
              <button onClick={() => onQuickAction(lead, 'lost')} className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                <XIcon size={16} /> Mark Lost
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LeadForm({ lead, tenantId, onClose, onSave }: {
  lead: Lead | null;
  tenantId: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    first_name: lead?.first_name || '',
    last_name: lead?.last_name || '',
    email: lead?.email || '',
    phone: lead?.phone || '',
    address: lead?.address || '',
    service_requested: lead?.service_requested || '',
    source: lead?.source || '',
    status: lead?.status || 'new',
    notes: lead?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name) {
      showToast('First name is required', 'error');
      return;
    }
    setSaving(true);
    if (lead) {
      const { error } = await supabase.from('leads').update(form).eq('id', lead.id);
      if (error) showToast('Failed to update lead', 'error');
      else { showToast('Lead updated', 'success'); onSave(); }
    } else {
      const { error } = await supabase.from('leads').insert({ ...form, tenant_id: tenantId });
      if (error) showToast('Failed to create lead', 'error');
      else { showToast('Lead created', 'success'); onSave(); }
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">{lead ? 'Edit Lead' : 'Add Lead'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-300"><XIcon size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="First Name *" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} className="border rounded-lg px-3 py-2" required />
            <input placeholder="Last Name" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} className="border rounded-lg px-3 py-2" />
            <input placeholder="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="border rounded-lg px-3 py-2" />
            <input placeholder="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="border rounded-lg px-3 py-2" />
          </div>
          <input placeholder="Address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="w-full border rounded-lg px-3 py-2" />
          <input placeholder="Service Requested" value={form.service_requested} onChange={e => setForm(f => ({ ...f, service_requested: e.target.value }))} className="w-full border rounded-lg px-3 py-2" />
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Source (e.g., Google, Referral)" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} className="border rounded-lg px-3 py-2" />
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Lead['status'] }))} className="border rounded-lg px-3 py-2">
              {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <textarea placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full border rounded-lg px-3 py-2 h-24" />
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
