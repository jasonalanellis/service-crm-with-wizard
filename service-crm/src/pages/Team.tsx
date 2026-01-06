import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { Users, Plus, Edit2, Trash2, Shield, Mail, Phone } from 'lucide-react';

type TeamMember = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'manager' | 'technician' | 'viewer';
  is_active: boolean;
  created_at: string;
};

const ROLES = [
  { value: 'admin', label: 'Admin', desc: 'Full access' },
  { value: 'manager', label: 'Manager', desc: 'Manage bookings & team' },
  { value: 'technician', label: 'Technician', desc: 'View assigned jobs' },
  { value: 'viewer', label: 'Viewer', desc: 'Read-only access' }
];

export default function Team() {
  const { tenant } = useTenant();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', role: 'technician' as TeamMember['role'] });

  useEffect(() => {
    if (tenant) fetchMembers();
  }, [tenant]);

  const fetchMembers = async () => {
    const { data } = await supabase
      .from('team_members')
      .select('*')
      .eq('tenant_id', tenant!.id)
      .order('created_at', { ascending: false });
    setMembers(data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (editing) {
      await supabase.from('team_members').update(formData).eq('id', editing.id);
    } else {
      await supabase.from('team_members').insert({ ...formData, tenant_id: tenant!.id, is_active: true });
    }
    setShowModal(false);
    setEditing(null);
    setFormData({ name: '', email: '', phone: '', role: 'technician' });
    fetchMembers();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Remove this team member?')) {
      await supabase.from('team_members').delete().eq('id', id);
      fetchMembers();
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await supabase.from('team_members').update({ is_active: !isActive }).eq('id', id);
    fetchMembers();
  };

  if (!tenant) return <div className="p-8 text-center text-gray-500">Select a business first</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
        <button onClick={() => { setShowModal(true); setFormData({ name: '', email: '', phone: '', role: 'technician' }); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={20} /> Add Member
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : members.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Users size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No team members yet</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {members.map(member => (
            <div key={member.id} className={`bg-white rounded-lg shadow p-4 ${!member.is_active ? 'opacity-60' : ''}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{member.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded ${
                    member.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    member.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                    member.role === 'technician' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>{member.role}</span>
                </div>
                <button onClick={() => toggleActive(member.id, member.is_active)} className={`text-xs px-2 py-1 rounded ${member.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {member.is_active ? 'Active' : 'Inactive'}
                </button>
              </div>
              <div className="space-y-1 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-2"><Mail size={14} /> {member.email}</div>
                {member.phone && <div className="flex items-center gap-2"><Phone size={14} /> {member.phone}</div>}
              </div>
              <div className="flex gap-2 pt-2 border-t">
                <button onClick={() => { setEditing(member); setFormData({ name: member.name, email: member.email, phone: member.phone || '', role: member.role }); setShowModal(true); }} className="text-sm text-blue-600 hover:underline flex items-center gap-1"><Edit2 size={14} /> Edit</button>
                <button onClick={() => handleDelete(member.id)} className="text-sm text-red-600 hover:underline flex items-center gap-1"><Trash2 size={14} /> Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">{editing ? 'Edit Member' : 'Add Team Member'}</h2>
            </div>
            <div className="p-6 space-y-4">
              <input type="text" placeholder="Name" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full border rounded-lg px-3 py-2" />
              <input type="email" placeholder="Email" value={formData.email} onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))} className="w-full border rounded-lg px-3 py-2" />
              <input type="tel" placeholder="Phone" value={formData.phone} onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))} className="w-full border rounded-lg px-3 py-2" />
              <div>
                <label className="text-sm text-gray-600 block mb-2">Role</label>
                <div className="space-y-2">
                  {ROLES.map(role => (
                    <label key={role.value} className={`flex items-center p-3 border rounded-lg cursor-pointer ${formData.role === role.value ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}>
                      <input type="radio" checked={formData.role === role.value} onChange={() => setFormData(prev => ({ ...prev, role: role.value as TeamMember['role'] }))} className="mr-3" />
                      <div>
                        <div className="font-medium">{role.label}</div>
                        <div className="text-sm text-gray-500">{role.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => { setShowModal(false); setEditing(null); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
