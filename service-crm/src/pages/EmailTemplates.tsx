import { useState, useEffect } from 'react';
import { Mail, Plus, Edit2, Trash2, X, Save, Eye } from 'lucide-react';
import { useTenant } from '../context/TenantContext';
import { useToast } from '../context/ToastContext';

type Template = {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'confirmation' | 'reminder' | 'receipt' | 'followup' | 'custom';
  variables: string[];
};

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'confirm',
    name: 'Booking Confirmation',
    subject: 'Your appointment is confirmed - {{service_name}}',
    body: `Hi {{customer_name}},\n\nYour appointment has been confirmed!\n\nDetails:\n- Service: {{service_name}}\n- Date: {{date}}\n- Time: {{time}}\n- Address: {{address}}\n\nIf you need to reschedule or cancel, please contact us.\n\nThank you,\n{{business_name}}`,
    type: 'confirmation',
    variables: ['customer_name', 'service_name', 'date', 'time', 'address', 'business_name'],
  },
  {
    id: 'reminder',
    name: 'Appointment Reminder',
    subject: 'Reminder: Your appointment is tomorrow',
    body: `Hi {{customer_name}},\n\nThis is a friendly reminder that your appointment is scheduled for tomorrow.\n\nDetails:\n- Service: {{service_name}}\n- Date: {{date}}\n- Time: {{time}}\n\nWe look forward to seeing you!\n\n{{business_name}}`,
    type: 'reminder',
    variables: ['customer_name', 'service_name', 'date', 'time', 'business_name'],
  },
  {
    id: 'receipt',
    name: 'Payment Receipt',
    subject: 'Receipt for your payment - {{invoice_number}}',
    body: `Hi {{customer_name}},\n\nThank you for your payment!\n\nPayment Details:\n- Amount: \${{amount}}\n- Invoice: {{invoice_number}}\n- Date: {{date}}\n\nThis receipt confirms your payment has been processed.\n\nThank you for choosing {{business_name}}!`,
    type: 'receipt',
    variables: ['customer_name', 'amount', 'invoice_number', 'date', 'business_name'],
  },
  {
    id: 'followup',
    name: 'Follow-up Message',
    subject: 'How was your experience with us?',
    body: `Hi {{customer_name}},\n\nThank you for choosing {{business_name}}!\n\nWe hope you're satisfied with your recent service. We'd love to hear your feedback.\n\nClick here to leave a review: {{review_link}}\n\nThank you!`,
    type: 'followup',
    variables: ['customer_name', 'business_name', 'review_link'],
  },
];

export default function EmailTemplates() {
  const { tenant } = useTenant();
  const { showToast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`email_templates_${tenant?.id}`);
    setTemplates(saved ? JSON.parse(saved) : DEFAULT_TEMPLATES);
  }, [tenant?.id]);

  const saveTemplates = (t: Template[]) => {
    setTemplates(t);
    localStorage.setItem(`email_templates_${tenant?.id}`, JSON.stringify(t));
  };

  const handleSave = () => {
    if (!editingTemplate) return;
    const existing = templates.find(t => t.id === editingTemplate.id);
    if (existing) {
      saveTemplates(templates.map(t => t.id === editingTemplate.id ? editingTemplate : t));
    } else {
      saveTemplates([...templates, { ...editingTemplate, id: Date.now().toString() }]);
    }
    showToast('Template saved', 'success');
    setEditingTemplate(null);
  };

  const handleDelete = (id: string) => {
    saveTemplates(templates.filter(t => t.id !== id));
    showToast('Template deleted', 'success');
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'confirmation': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'reminder': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'receipt': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'followup': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (!tenant) return <div className="p-8 text-gray-500">Please select a business</div>;

  return (
    <div className="p-4 lg:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Mail size={28} /> Email Templates
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Customize email communications for your customers</p>
        </div>
        <button
          onClick={() => setEditingTemplate({ id: '', name: '', subject: '', body: '', type: 'custom', variables: [] })}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} /> New Template
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {templates.map(template => (
          <div key={template.id} className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{template.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded capitalize ${getTypeColor(template.type)}`}>
                  {template.type}
                </span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditingTemplate(template); setShowPreview(true); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                  <Eye size={16} className="text-gray-500" />
                </button>
                <button onClick={() => setEditingTemplate(template)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                  <Edit2 size={16} className="text-gray-500" />
                </button>
                <button onClick={() => handleDelete(template.id)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                  <Trash2 size={16} className="text-red-500" />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Subject: {template.subject}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-2">{template.body}</p>
            {template.variables.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {template.variables.slice(0, 4).map(v => (
                  <span key={v} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-400">
                    {`{{${v}}}`}
                  </span>
                ))}
                {template.variables.length > 4 && (
                  <span className="text-xs text-gray-400">+{template.variables.length - 4} more</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {editingTemplate && !showPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditingTemplate(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingTemplate.id ? 'Edit Template' : 'New Template'}
              </h2>
              <button onClick={() => setEditingTemplate(null)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Template Name</label>
                  <input
                    value={editingTemplate.name}
                    onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                    className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., Booking Confirmation"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                  <select
                    value={editingTemplate.type}
                    onChange={e => setEditingTemplate({ ...editingTemplate, type: e.target.value as Template['type'] })}
                    className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="confirmation">Confirmation</option>
                    <option value="reminder">Reminder</option>
                    <option value="receipt">Receipt</option>
                    <option value="followup">Follow-up</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject Line</label>
                <input
                  value={editingTemplate.subject}
                  onChange={e => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                  className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Your appointment is confirmed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Body</label>
                <textarea
                  value={editingTemplate.body}
                  onChange={e => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                  className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 h-48 dark:bg-gray-700 dark:text-white font-mono text-sm"
                  placeholder="Use {{variable_name}} for dynamic content"
                />
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Available Variables:</p>
                <div className="flex flex-wrap gap-1">
                  {['customer_name', 'service_name', 'date', 'time', 'address', 'amount', 'business_name', 'invoice_number', 'review_link'].map(v => (
                    <button
                      key={v}
                      onClick={() => setEditingTemplate({ ...editingTemplate, body: editingTemplate.body + `{{${v}}}` })}
                      className="text-xs bg-white dark:bg-gray-600 border dark:border-gray-500 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-300"
                    >
                      {`{{${v}}}`}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button onClick={() => setEditingTemplate(null)} className="px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
                  Cancel
                </button>
                <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                  <Save size={16} /> Save Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPreview && editingTemplate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setShowPreview(false); setEditingTemplate(null); }}>
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Preview: {editingTemplate.name}</h2>
              <button onClick={() => { setShowPreview(false); setEditingTemplate(null); }} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-4">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Subject:</p>
                <p className="font-medium text-gray-900 dark:text-white">{editingTemplate.subject}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-sans">{editingTemplate.body}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
