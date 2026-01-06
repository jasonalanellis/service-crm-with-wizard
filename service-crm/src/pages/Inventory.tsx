import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { useToast } from '../context/ToastContext';
import { Plus, Search, Edit, Trash2, Package, AlertTriangle, X } from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  sku: string;
  quantity: number;
  min_quantity: number;
  unit_cost: number;
  category: string;
}

export default function Inventory() {
  const { tenant } = useTenant();
  const { showToast } = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: '', description: '', sku: '', quantity: 0, min_quantity: 5, unit_cost: 0, category: ''
  });

  useEffect(() => {
    if (tenant) fetchItems();
  }, [tenant]);

  const fetchItems = async () => {
    if (!tenant) return;
    setLoading(true);
    const { data } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('name');
    setItems(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    if (editingItem) {
      const { error } = await supabase
        .from('inventory_items')
        .update(formData)
        .eq('id', editingItem.id);
      if (!error) {
        showToast('Item updated', 'success');
        fetchItems();
      }
    } else {
      const { error } = await supabase
        .from('inventory_items')
        .insert({ ...formData, tenant_id: tenant.id });
      if (!error) {
        showToast('Item added', 'success');
        fetchItems();
      }
    }
    resetForm();
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    const { error } = await supabase.from('inventory_items').delete().eq('id', id);
    if (!error) {
      showToast('Item deleted', 'success');
      fetchItems();
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({ name: '', description: '', sku: '', quantity: 0, min_quantity: 5, unit_cost: 0, category: '' });
  };

  const openEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData(item);
    setShowForm(true);
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.sku?.toLowerCase().includes(search.toLowerCase()) ||
    item.category?.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockItems = items.filter(i => i.quantity <= i.min_quantity);
  const totalValue = items.reduce((sum, i) => sum + (i.quantity * (i.unit_cost || 0)), 0);

  if (!tenant) return <div className="p-8 text-gray-500">Please select a business</div>;

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inventory</h1>
          <p className="text-gray-500 text-sm">Track supplies and equipment</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} /> Add Item
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-sm text-gray-500">Total Items</p>
          <p className="text-2xl font-bold">{items.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-sm text-gray-500">Total Value</p>
          <p className="text-2xl font-bold">${totalValue.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-sm text-gray-500">Low Stock</p>
          <p className="text-2xl font-bold text-yellow-600">{lowStockItems.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-sm text-gray-500">Categories</p>
          <p className="text-2xl font-bold">{new Set(items.map(i => i.category).filter(Boolean)).size}</p>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="text-yellow-600 mt-0.5" size={20} />
          <div>
            <p className="font-medium text-yellow-800">Low Stock Alert</p>
            <p className="text-sm text-yellow-700">
              {lowStockItems.map(i => i.name).join(', ')} {lowStockItems.length === 1 ? 'is' : 'are'} running low
            </p>
          </div>
        </div>
      )}

      {/* Search & Table */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <div className="relative max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg w-full"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No items found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-left text-sm text-gray-500">
                <tr>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3 text-right">Unit Cost</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Package className="text-blue-600" size={20} />
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{item.sku || '-'}</td>
                    <td className="px-4 py-3 text-sm">{item.category || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={item.quantity <= item.min_quantity ? 'text-yellow-600 font-medium' : ''}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">${(item.unit_cost || 0).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(item)} className="p-1 hover:bg-gray-100 rounded">
                          <Edit size={16} className="text-gray-400" />
                        </button>
                        <button onClick={() => deleteItem(item.id)} className="p-1 hover:bg-gray-100 rounded">
                          <Trash2 size={16} className="text-gray-400" />
                        </button>
                      </div>
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
              <h2 className="text-lg font-semibold">{editingItem ? 'Edit Item' : 'Add Item'}</h2>
              <button onClick={resetForm}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Min Qty</label>
                  <input
                    type="number"
                    value={formData.min_quantity}
                    onChange={e => setFormData({ ...formData, min_quantity: parseInt(e.target.value) || 0 })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Unit Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unit_cost}
                    onChange={e => setFormData({ ...formData, unit_cost: parseFloat(e.target.value) || 0 })}
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
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                  {editingItem ? 'Update' : 'Add Item'}
                </button>
                <button type="button" onClick={resetForm} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
