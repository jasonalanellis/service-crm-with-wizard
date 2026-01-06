import { useState, useEffect } from 'react';
import { Gift, Plus, Search, CreditCard, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { useToast } from '../context/ToastContext';

type GiftCard = {
  id: string;
  code: string;
  initial_amount: number;
  balance: number;
  status: 'active' | 'redeemed' | 'expired';
  recipient_email?: string;
  recipient_name?: string;
  purchased_by?: string;
  expires_at?: string;
  created_at: string;
};

export default function GiftCards() {
  const { tenant } = useTenant();
  const { showToast } = useToast();
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    amount: 50,
    recipient_email: '',
    recipient_name: '',
    message: ''
  });

  useEffect(() => {
    if (tenant?.id) loadCards();
  }, [tenant?.id]);

  const loadCards = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('gift_cards')
      .select('*')
      .eq('tenant_id', tenant!.id)
      .order('created_at', { ascending: false });
    setCards(data || []);
    setLoading(false);
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) code += '-';
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  };

  const createCard = async () => {
    const code = generateCode();
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const { error } = await supabase.from('gift_cards').insert({
      tenant_id: tenant!.id,
      code,
      initial_amount: formData.amount,
      balance: formData.amount,
      status: 'active',
      recipient_email: formData.recipient_email || null,
      recipient_name: formData.recipient_name || null,
      expires_at: expiresAt.toISOString()
    });

    if (error) {
      showToast('Failed to create gift card', 'error');
    } else {
      showToast('Gift card created successfully!', 'success');
      setShowModal(false);
      setFormData({ amount: 50, recipient_email: '', recipient_name: '', message: '' });
      loadCards();
    }
  };

  const filteredCards = cards.filter(c => 
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.recipient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.recipient_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalValue = cards.filter(c => c.status === 'active').reduce((sum, c) => sum + c.balance, 0);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Gift className="text-purple-600" />
          Gift Cards
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Plus size={18} />
          Create Gift Card
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Cards</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{cards.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <p className="text-sm text-gray-600 dark:text-gray-400">Active Balance</p>
          <p className="text-2xl font-bold text-purple-600">${totalValue.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <p className="text-sm text-gray-600 dark:text-gray-400">Redeemed</p>
          <p className="text-2xl font-bold text-green-600">{cards.filter(c => c.status === 'redeemed').length}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search by code, name, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>

      {/* Cards List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No gift cards found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Recipient</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Balance</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Expires</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCards.map(card => (
                <tr key={card.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <CreditCard size={16} className="text-purple-500" />
                      <span className="font-mono text-sm text-gray-900 dark:text-white">{card.code}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {card.recipient_name || card.recipient_email || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">${card.initial_amount}</td>
                  <td className="px-4 py-3 text-sm font-medium text-purple-600">${card.balance}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                      card.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      card.status === 'redeemed' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {card.status === 'active' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {card.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {card.expires_at ? new Date(card.expires_at).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create Gift Card</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                <div className="flex gap-2">
                  {[25, 50, 100, 200].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setFormData({...formData, amount: amt})}
                      className={`flex-1 py-2 rounded-lg border ${
                        formData.amount === amt 
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-600' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recipient Name</label>
                <input
                  type="text"
                  value={formData.recipient_name}
                  onChange={(e) => setFormData({...formData, recipient_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recipient Email</label>
                <input
                  type="email"
                  value={formData.recipient_email}
                  onChange={(e) => setFormData({...formData, recipient_email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Optional - to send digitally"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={createCard}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Create Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
