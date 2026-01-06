import { useState } from 'react';
import { CreditCard, DollarSign, Save, Percent, Gift, Zap } from 'lucide-react';

export default function PaymentSettings() {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    // Payment Methods
    acceptCash: true,
    acceptCard: true,
    acceptCheck: false,
    // Auto-charge
    autoCharge: true,
    chargeOnCompletion: true,
    requireDeposit: false,
    depositPercent: 25,
    // Fees
    cancellationFee: 50,
    lateCancelHours: 24,
    noShowFee: 75,
    // Processing
    processingFee: 2.9,
    passToCustomer: false,
    // Tips
    allowTips: true,
    suggestedTips: [15, 20, 25],
    // Referrals
    referralEnabled: true,
    referrerReward: 25,
    refereeDiscount: 20,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-4 lg:p-6 max-w-4xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Settings</h1>
          <p className="text-gray-600">Configure payment methods, fees, and policies</p>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            saved ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
          } text-white`}
        >
          <Save size={18} />
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CreditCard size={20} />
          Payment Methods
        </h3>
        <div className="space-y-4">
          {[
            { key: 'acceptCard', label: 'Credit/Debit Cards', desc: 'Accept Visa, Mastercard, Amex via Stripe' },
            { key: 'acceptCash', label: 'Cash', desc: 'Accept cash payments on-site' },
            { key: 'acceptCheck', label: 'Check', desc: 'Accept check payments' },
          ].map((method) => (
            <div key={method.key} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{method.label}</p>
                <p className="text-sm text-gray-500">{method.desc}</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, [method.key]: !settings[method.key as keyof typeof settings] })}
                className={`w-12 h-7 rounded-full transition-colors ${
                  settings[method.key as keyof typeof settings] ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
                  settings[method.key as keyof typeof settings] ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Auto-Charge Settings */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Zap size={20} />
          Auto-Charge
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Enable Auto-Charge</p>
              <p className="text-sm text-gray-500">Automatically charge saved cards</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, autoCharge: !settings.autoCharge })}
              className={`w-12 h-7 rounded-full transition-colors ${settings.autoCharge ? 'bg-blue-600' : 'bg-gray-200'}`}
            >
              <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
                settings.autoCharge ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Require Deposit</p>
              <p className="text-sm text-gray-500">Charge partial amount at booking</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, requireDeposit: !settings.requireDeposit })}
              className={`w-12 h-7 rounded-full transition-colors ${settings.requireDeposit ? 'bg-blue-600' : 'bg-gray-200'}`}
            >
              <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
                settings.requireDeposit ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
          {settings.requireDeposit && (
            <div className="ml-4 flex items-center gap-2">
              <span className="text-gray-600">Deposit amount:</span>
              <input
                type="number"
                value={settings.depositPercent}
                onChange={(e) => setSettings({ ...settings, depositPercent: Number(e.target.value) })}
                className="w-20 px-3 py-1.5 border rounded-lg"
                min={10}
                max={100}
              />
              <span className="text-gray-600">%</span>
            </div>
          )}
        </div>
      </div>

      {/* Fees */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign size={20} />
          Fees & Policies
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cancellation Fee</label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">$</span>
              <input
                type="number"
                value={settings.cancellationFee}
                onChange={(e) => setSettings({ ...settings, cancellationFee: Number(e.target.value) })}
                className="flex-1 px-3 py-2 border rounded-lg"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Charged if cancelled within {settings.lateCancelHours} hours</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">No-Show Fee</label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">$</span>
              <input
                type="number"
                value={settings.noShowFee}
                onChange={(e) => setSettings({ ...settings, noShowFee: Number(e.target.value) })}
                className="flex-1 px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Processing Fee</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={settings.processingFee}
                onChange={(e) => setSettings({ ...settings, processingFee: Number(e.target.value) })}
                className="w-24 px-3 py-2 border rounded-lg"
                step={0.1}
              />
              <span className="text-gray-500">%</span>
            </div>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={settings.passToCustomer}
              onChange={(e) => setSettings({ ...settings, passToCustomer: e.target.checked })}
              className="w-4 h-4 mr-2"
            />
            <label className="text-sm text-gray-700">Pass processing fee to customer</label>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Percent size={20} />
          Tips
        </h3>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-medium text-gray-900">Allow Tips</p>
            <p className="text-sm text-gray-500">Let customers add tips during checkout</p>
          </div>
          <button
            onClick={() => setSettings({ ...settings, allowTips: !settings.allowTips })}
            className={`w-12 h-7 rounded-full transition-colors ${settings.allowTips ? 'bg-blue-600' : 'bg-gray-200'}`}
          >
            <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
              settings.allowTips ? 'translate-x-5' : 'translate-x-0.5'
            }`} />
          </button>
        </div>
        {settings.allowTips && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Suggested Tip Amounts</label>
            <div className="flex gap-2">
              {settings.suggestedTips.map((tip, i) => (
                <div key={i} className="flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-lg">
                  <input
                    type="number"
                    value={tip}
                    onChange={(e) => {
                      const newTips = [...settings.suggestedTips];
                      newTips[i] = Number(e.target.value);
                      setSettings({ ...settings, suggestedTips: newTips });
                    }}
                    className="w-12 bg-transparent text-center"
                  />
                  <span>%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Referrals */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Gift size={20} />
          Referral Program
        </h3>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-medium text-gray-900">Enable Referrals</p>
            <p className="text-sm text-gray-500">Reward customers for referring friends</p>
          </div>
          <button
            onClick={() => setSettings({ ...settings, referralEnabled: !settings.referralEnabled })}
            className={`w-12 h-7 rounded-full transition-colors ${settings.referralEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}
          >
            <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
              settings.referralEnabled ? 'translate-x-5' : 'translate-x-0.5'
            }`} />
          </button>
        </div>
        {settings.referralEnabled && (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Referrer Reward</label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">$</span>
                <input
                  type="number"
                  value={settings.referrerReward}
                  onChange={(e) => setSettings({ ...settings, referrerReward: Number(e.target.value) })}
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
                <span className="text-sm text-gray-500">credit</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Customer Discount</label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">$</span>
                <input
                  type="number"
                  value={settings.refereeDiscount}
                  onChange={(e) => setSettings({ ...settings, refereeDiscount: Number(e.target.value) })}
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
                <span className="text-sm text-gray-500">off first booking</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
