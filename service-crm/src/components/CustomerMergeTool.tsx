import { useState, useEffect } from 'react';
import { X, Search, ArrowRight, AlertTriangle, Check, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

type Customer = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
};

type Props = {
  tenantId: string;
  onClose: () => void;
  onMerged: () => void;
};

export default function CustomerMergeTool({ tenantId, onClose, onMerged }: Props) {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search1, setSearch1] = useState('');
  const [search2, setSearch2] = useState('');
  const [primary, setPrimary] = useState<Customer | null>(null);
  const [duplicate, setDuplicate] = useState<Customer | null>(null);
  const [merging, setMerging] = useState(false);
  const [step, setStep] = useState<'select' | 'confirm'>('select');

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('customers')
        .select('id, first_name, last_name, email, phone')
        .eq('tenant_id', tenantId)
        .order('first_name');
      setCustomers(data || []);
    };
    fetch();
  }, [tenantId]);

  const filtered1 = customers.filter(c =>
    `${c.first_name} ${c.last_name} ${c.email} ${c.phone}`.toLowerCase().includes(search1.toLowerCase()) &&
    c.id !== duplicate?.id
  );

  const filtered2 = customers.filter(c =>
    `${c.first_name} ${c.last_name} ${c.email} ${c.phone}`.toLowerCase().includes(search2.toLowerCase()) &&
    c.id !== primary?.id
  );

  const handleMerge = async () => {
    if (!primary || !duplicate) return;
    setMerging(true);

    try {
      // Update all appointments from duplicate to primary
      await supabase.from('appointments').update({ customer_id: primary.id }).eq('customer_id', duplicate.id);
      
      // Update all payments from duplicate to primary
      await supabase.from('payments').update({ customer_id: primary.id }).eq('customer_id', duplicate.id);
      
      // Update all reviews from duplicate to primary
      await supabase.from('reviews').update({ customer_id: primary.id }).eq('customer_id', duplicate.id);

      // Delete the duplicate customer
      await supabase.from('customers').delete().eq('id', duplicate.id);

      showToast('Customers merged successfully!', 'success');
      onMerged();
    } catch (error) {
      showToast('Failed to merge customers', 'error');
    }

    setMerging(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Users size={20} /> Merge Duplicate Customers
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={24} />
          </button>
        </div>

        {step === 'select' ? (
          <div className="p-4 space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Select the primary customer record to keep, and the duplicate to merge into it.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Primary Customer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Keep (Primary)
                </label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={search1}
                    onChange={e => setSearch1(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="mt-2 border dark:border-gray-600 rounded-lg max-h-40 overflow-y-auto">
                  {filtered1.slice(0, 5).map(c => (
                    <button
                      key={c.id}
                      onClick={() => { setPrimary(c); setSearch1(''); }}
                      className={`w-full p-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b dark:border-gray-600 last:border-0 ${primary?.id === c.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                    >
                      <p className="font-medium text-gray-800 dark:text-white text-sm">{c.first_name} {c.last_name}</p>
                      <p className="text-xs text-gray-500">{c.email || c.phone}</p>
                    </button>
                  ))}
                </div>
                {primary && (
                  <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-green-600" />
                      <span className="font-medium text-green-800 dark:text-green-200">{primary.first_name} {primary.last_name}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Duplicate Customer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Merge & Delete (Duplicate)
                </label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={search2}
                    onChange={e => setSearch2(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="mt-2 border dark:border-gray-600 rounded-lg max-h-40 overflow-y-auto">
                  {filtered2.slice(0, 5).map(c => (
                    <button
                      key={c.id}
                      onClick={() => { setDuplicate(c); setSearch2(''); }}
                      className={`w-full p-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b dark:border-gray-600 last:border-0 ${duplicate?.id === c.id ? 'bg-red-50 dark:bg-red-900/30' : ''}`}
                    >
                      <p className="font-medium text-gray-800 dark:text-white text-sm">{c.first_name} {c.last_name}</p>
                      <p className="text-xs text-gray-500">{c.email || c.phone}</p>
                    </button>
                  ))}
                </div>
                {duplicate && (
                  <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={16} className="text-red-600" />
                      <span className="font-medium text-red-800 dark:text-red-200">{duplicate.first_name} {duplicate.last_name}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {primary && duplicate && (
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="text-center">
                  <p className="font-medium text-gray-800 dark:text-white">{duplicate.first_name} {duplicate.last_name}</p>
                  <p className="text-xs text-gray-500">Will be deleted</p>
                </div>
                <ArrowRight size={24} className="text-gray-400" />
                <div className="text-center">
                  <p className="font-medium text-gray-800 dark:text-white">{primary.first_name} {primary.last_name}</p>
                  <p className="text-xs text-gray-500">Will receive all records</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700">
              <button onClick={onClose} className="px-4 py-2 text-gray-700 dark:text-gray-300 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                Cancel
              </button>
              <button
                onClick={() => setStep('confirm')}
                disabled={!primary || !duplicate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertTriangle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0" size={24} />
                <div>
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">Confirm Merge</h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    This action cannot be undone. All appointments, payments, and reviews from
                    <strong> {duplicate?.first_name} {duplicate?.last_name}</strong> will be transferred to
                    <strong> {primary?.first_name} {primary?.last_name}</strong>, and the duplicate record will be permanently deleted.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setStep('select')} className="px-4 py-2 text-gray-700 dark:text-gray-300 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                Back
              </button>
              <button
                onClick={handleMerge}
                disabled={merging}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {merging ? 'Merging...' : 'Merge Customers'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
