import { useState, useEffect } from 'react';
import { MessageSquare, Plus, Edit2, Trash2, X, Save, Copy } from 'lucide-react';
import { useTenant } from '../context/TenantContext';
import { useToast } from '../context/ToastContext';

type SMSTemplate = {
  id: string;
  name: string;
  message: string;
  type: 'confirmation' | 'reminder' | 'running_late' | 'completed' | 'custom';
};

const DEFAULT_SMS_TEMPLATES: SMSTemplate[] = [
  {
    id: 'confirm',
    name: 'Booking Confirmation',
    message: 'Hi {{name}}! Your appointment for {{service}} on {{date}} at {{time}} is confirmed. Reply HELP for assistance.',
    type: 'confirmation',
  },
  {
    id: 'reminder',
    name: 'Day-Before Reminder',
    message: "Reminder: Your {{service}} appointment is tomorrow at {{time}}. We'll see you then! - {{business}}",
    type: 'reminder',
  },
  {
    id: 'on_the_way',
    name: 'On The Way',
    message: 'Hi {{name}}! Our technician {{tech_name}} is on the way and will arrive in approximately {{eta}} minutes.',
    type: 'running_late',
  },
  {
    id: 'completed',
    name: 'Job Completed',
    message: 'Your service is complete! Total: ${{amount}}. Thank you for choosing {{business}}. Leave a review: {{review_link}}',
    type: 'completed',
  },
  {
    id: 'running_late',
    name: 'Running Late',
    message: 'Hi {{name}}, we apologize but our technician is running about {{delay}} minutes late. We appreciate your patience!',
    type: 'running_late',
  },
];

export default function SMSTemplates() {
  const { tenant } = useTenant();
  const { showToast } = useToast();
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<SMSTemplate | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(`sms_templates_${tenant?.id}`);
    setTemplates(saved ? JSON.parse(saved) : DEFAULT_SMS_TEMPLATES);
  }, [tenant?.id]);

  const saveTemplates = (t: SMSTemplate[]) => {
    setTemplates(t);
    localStorage.setItem(`sms_templates_${tenant?.id}`, JSON.stringify(t));
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard', 'success');
  };

  const getCharCount = (msg: string) => {
    const count = msg.length;
    const segments = Math.ceil(count / 160);
    return { count, segments };
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'confirmation': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'reminder': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'running_late': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'completed': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (!tenant) return <div className="p-8 text-gray-500">Please select a business</div>;

  return (
    <div className="p-4 lg:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare size={28} /> SMS Templates
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Quick messages for customer communication</p>
        </div>
        <button
          onClick={() => setEditingTemplate({ id: '', name: '', message: '', type: 'custom' })}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} /> New Template
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(template => {
          const { count, segments } = getCharCount(template.message);
          return (
            <div key={template.id} className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{template.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded capitalize ${getTypeColor(template.type)}`}>
                    {template.type.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => copyToClipboard(template.message)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                    <Copy size={14} className="text-gray-500" />
                  </button>
                  <button onClick={() => setEditingTemplate(template)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                    <Edit2 size={14} className="text-gray-500" />
                  </button>
                  <button onClick={() => handleDelete(template.id)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{template.message}</p>
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                <span>{count} characters</span>
                <span>{segments} SMS segment{segments > 1 ? 's' : ''}</span>
              </div>
            </div>
          );
        })}
      </div>

      {editingTemplate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditingTemplate(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingTemplate.id ? 'Edit SMS Template' : 'New SMS Template'}
              </h2>
              <button onClick={() => setEditingTemplate(null)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                  <input
                    value={editingTemplate.name}
                    onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                    className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                  <select
                    value={editingTemplate.type}
                    onChange={e => setEditingTemplate({ ...editingTemplate, type: e.target.value as SMSTemplate['type'] })}
                    className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="confirmation">Confirmation</option>
                    <option value="reminder">Reminder</option>
                    <option value="running_late">Running Late</option>
                    <option value="completed">Completed</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
                <textarea
                  value={editingTemplate.message}
                  onChange={e => setEditingTemplate({ ...editingTemplate, message: e.target.value })}
                  className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 h-32 dark:bg-gray-700 dark:text-white"
                  maxLength={480}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{editingTemplate.message.length}/480 characters</span>
                  <span>{Math.ceil(editingTemplate.message.length / 160)} SMS segment(s)</span>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Variables:</p>
                <div className="flex flex-wrap gap-1">
                  {['name', 'service', 'date', 'time', 'business', 'tech_name', 'eta', 'amount', 'delay', 'review_link'].map(v => (
                    <button
                      key={v}
                      onClick={() => setEditingTemplate({ ...editingTemplate, message: editingTemplate.message + `{{${v}}}` })}
                      className="text-xs bg-white dark:bg-gray-600 border dark:border-gray-500 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    >
                      {`{{${v}}}`}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button onClick={() => setEditingTemplate(null)} className="px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                  Cancel
                </button>
                <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                  <Save size={16} /> Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
