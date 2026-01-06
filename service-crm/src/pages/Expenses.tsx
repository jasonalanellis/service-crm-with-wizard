import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { useToast } from '../context/ToastContext';
import { format } from 'date-fns';
import { Plus, Search, DollarSign, Car, ShoppingCart, Wrench, Coffee, X, Check } from 'lucide-react';

interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  expense_date: string;
  is_reimbursed: boolean;
}

const categories = [
  { id: 'mileage', label: 'Mileage', icon: Car },
  { id: 'supplies', label: 'Supplies', icon: ShoppingCart },
  { id: 'equipment', label: 'Equipment', icon: Wrench },
  { id: 'meals', label: 'Meals', icon: Coffee },
  { id: 'other', label: 'Other', icon: DollarSign },
];

export default function Expenses() {
  const { tenant } = useTenant();
  const { showToast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category: 'supplies', amount: 0, description: '', expense_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (tenant) fetchExpenses();
  }, [tenant]);

  const fetchExpenses = async () => {
    if (!tenant) return;
    setLoading(true);
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('expense_date', { ascending: false });
    setExpenses(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    const { error } = await supabase
      .from('expenses')
      .insert({ ...formData, tenant_id: tenant.id });
    
    if (!error) {
      showToast('Expense added', 'success');
      fetchExpenses();
      setShowForm(false);
      setFormData({ category: 'supplies', amount: 0, description: '', expense_date: new Date().toISOString().split('T')[0] });
    }
  };

  const toggleReimbursed = async (id: string, current: boolean) => {
    await supabase.from('expenses').update({ is_reimbursed: !current }).eq('id', id);
    fetchExpenses();
  };

  const filteredExpenses = expenses.filter(exp => {
    const matchSearch = !search || exp.description?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !filterCategory || exp.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const pendingReimbursement = filteredExpenses.filter(e => !e.is_reimbursed).reduce((sum, e) => sum + e.amount, 0);

  const getCategoryIcon = (cat: string) => {
    const found = categories.find(c => c.id === cat);
    return found ? <found.icon size={18} /> : <DollarSign size={18} />;
  };

  if (!tenant) return <div className="p-8 text-gray-500">Please select a business</div>;

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Expenses</h1>
          <p className="text-gray-500 text-sm">Track business expenses and reimbursements</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} /> Add Expense
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-sm text-gray-500">Total Expenses</p>
          <p className="text-2xl font-bold">${totalExpenses.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-sm text-gray-500">Pending Reimbursement</p>
          <p className="text-2xl font-bold text-yellow-600">${pendingReimbursement.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-sm text-gray-500">This Month</p>
          <p className="text-2xl font-bold">
            ${expenses.filter(e => e.expense_date.startsWith(new Date().toISOString().slice(0, 7))).reduce((s, e) => s + e.amount, 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-sm text-gray-500">Total Records</p>
          <p className="text-2xl font-bold">{filteredExpenses.length}</p>
        </div>
      </div>

      {/* Filters & Table */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg w-full"
            />
          </div>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No expenses found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-left text-sm text-gray-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredExpenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{format(new Date(exp.expense_date), 'MMM d, yyyy')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">{getCategoryIcon(exp.category)}</span>
                        <span className="capitalize">{exp.category}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{exp.description || '-'}</td>
                    <td className="px-4 py-3 text-right font-medium">${exp.amount.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleReimbursed(exp.id, exp.is_reimbursed)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          exp.is_reimbursed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {exp.is_reimbursed ? <Check size={14} /> : null}
                        {exp.is_reimbursed ? 'Reimbursed' : 'Pending'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Add Expense</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.expense_date}
                    onChange={e => setFormData({ ...formData, expense_date: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 h-20"
                />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                Add Expense
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
