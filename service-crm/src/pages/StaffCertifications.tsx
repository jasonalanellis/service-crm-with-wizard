import { useState, useEffect } from 'react';
import { Award, Plus, AlertTriangle, CheckCircle, Clock, Upload, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { useToast } from '../context/ToastContext';

type Certification = {
  id: string;
  provider_id: string;
  provider_name?: string;
  name: string;
  issuing_org: string;
  issue_date: string;
  expiry_date?: string;
  status: 'valid' | 'expiring' | 'expired';
  document_url?: string;
};

export default function StaffCertifications() {
  const { tenant } = useTenant();
  const { showToast } = useToast();
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [providers, setProviders] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    provider_id: '',
    name: '',
    issuing_org: '',
    issue_date: '',
    expiry_date: ''
  });

  useEffect(() => {
    if (tenant?.id) {
      loadData();
    }
  }, [tenant?.id]);

  const loadData = async () => {
    setLoading(true);
    const [certsRes, providersRes] = await Promise.all([
      supabase.from('staff_certifications')
        .select('*, service_providers(name)')
        .eq('tenant_id', tenant!.id)
        .order('expiry_date', { ascending: true }),
      supabase.from('service_providers')
        .select('id, name')
        .eq('tenant_id', tenant!.id)
    ]);

    const certs = (certsRes.data || []).map(c => {
      let status: 'valid' | 'expiring' | 'expired' = 'valid';
      if (c.expiry_date) {
        const daysUntil = Math.ceil((new Date(c.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysUntil < 0) status = 'expired';
        else if (daysUntil < 30) status = 'expiring';
      }
      return { ...c, status, provider_name: c.service_providers?.name };
    });

    setCertifications(certs);
    setProviders(providersRes.data || []);
    setLoading(false);
  };

  const saveCertification = async () => {
    if (!formData.provider_id || !formData.name) {
      showToast('Provider and certification name are required', 'error');
      return;
    }

    const { error } = await supabase.from('staff_certifications').insert({
      tenant_id: tenant!.id,
      ...formData
    });

    if (error) {
      showToast('Failed to save certification', 'error');
    } else {
      showToast('Certification added', 'success');
      setShowModal(false);
      setFormData({ provider_id: '', name: '', issuing_org: '', issue_date: '', expiry_date: '' });
      loadData();
    }
  };

  const expiringSoon = certifications.filter(c => c.status === 'expiring').length;
  const expired = certifications.filter(c => c.status === 'expired').length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Award className="text-amber-600" />
          Staff Certifications
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
        >
          <Plus size={18} />
          Add Certification
        </button>
      </div>

      {/* Alerts */}
      {(expiringSoon > 0 || expired > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {expired > 0 && (
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertTriangle className="text-red-600" size={24} />
              <div>
                <p className="font-medium text-red-800 dark:text-red-400">{expired} Expired Certification{expired > 1 ? 's' : ''}</p>
                <p className="text-sm text-red-600 dark:text-red-500">Require immediate renewal</p>
              </div>
            </div>
          )}
          {expiringSoon > 0 && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <Clock className="text-amber-600" size={24} />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-400">{expiringSoon} Expiring Soon</p>
                <p className="text-sm text-amber-600 dark:text-amber-500">Within the next 30 days</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
          </div>
        ) : certifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No certifications tracked yet</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Staff Member</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Certification</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Issuing Org</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Issued</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Expires</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {certifications.map(cert => (
                <tr key={cert.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">
                    {cert.provider_name || 'Unknown'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{cert.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{cert.issuing_org || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {cert.issue_date ? new Date(cert.issue_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {cert.expiry_date ? new Date(cert.expiry_date).toLocaleDateString() : 'No expiry'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                      cert.status === 'valid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      cert.status === 'expiring' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {cert.status === 'valid' ? <CheckCircle size={12} /> : 
                       cert.status === 'expiring' ? <Clock size={12} /> : <AlertTriangle size={12} />}
                      {cert.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Certification</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Staff Member</label>
                <select
                  value={formData.provider_id}
                  onChange={(e) => setFormData({...formData, provider_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select staff member</option>
                  {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Certification Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., CPR Certification"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Issuing Organization</label>
                <input
                  type="text"
                  value={formData.issuing_org}
                  onChange={(e) => setFormData({...formData, issuing_org: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => setFormData({...formData, issue_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
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
                onClick={saveCertification}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
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
