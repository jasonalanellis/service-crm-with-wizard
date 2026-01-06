import { useState } from 'react';
import { FileText, Plus, Trash2, X } from 'lucide-react';

const DEFAULT_TEMPLATES = [
  { id: '1', name: 'Follow-up Call', text: 'Called customer to follow up on service. ' },
  { id: '2', name: 'Reschedule Request', text: 'Customer requested to reschedule appointment to: ' },
  { id: '3', name: 'Payment Reminder', text: 'Sent payment reminder for outstanding balance of $' },
  { id: '4', name: 'Service Complete', text: 'Service completed successfully. Customer satisfied with work.' },
  { id: '5', name: 'Quote Sent', text: 'Sent quote for requested services. Awaiting customer approval.' },
  { id: '6', name: 'Special Instructions', text: 'Special instructions from customer: ' },
];

type Props = {
  onSelect: (text: string) => void;
  onClose: () => void;
};

export default function NotesTemplates({ onSelect, onClose }: Props) {
  const [templates, setTemplates] = useState(() => {
    const saved = localStorage.getItem('notes_templates');
    return saved ? JSON.parse(saved) : DEFAULT_TEMPLATES;
  });
  const [newName, setNewName] = useState('');
  const [newText, setNewText] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const saveTemplates = (t: typeof templates) => {
    setTemplates(t);
    localStorage.setItem('notes_templates', JSON.stringify(t));
  };

  const addTemplate = () => {
    if (!newName.trim() || !newText.trim()) return;
    const t = [...templates, { id: Date.now().toString(), name: newName, text: newText }];
    saveTemplates(t);
    setNewName('');
    setNewText('');
    setShowAdd(false);
  };

  const deleteTemplate = (id: string) => {
    saveTemplates(templates.filter((t: any) => t.id !== id));
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText size={20} /> Quick Notes Templates
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {templates.map((t: any) => (
            <div key={t.id} className="p-3 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-start gap-3">
              <button onClick={() => onSelect(t.text)} className="flex-1 text-left">
                <p className="font-medium text-gray-800 dark:text-white text-sm">{t.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{t.text}</p>
              </button>
              <button onClick={() => deleteTemplate(t.id)} className="text-gray-400 hover:text-red-600 p-1">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        {showAdd ? (
          <div className="p-4 border-t dark:border-gray-700 space-y-3">
            <input
              placeholder="Template name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-full border dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
            />
            <textarea
              placeholder="Template text..."
              value={newText}
              onChange={e => setNewText(e.target.value)}
              className="w-full border dark:border-gray-600 rounded px-3 py-2 text-sm h-20 dark:bg-gray-700 dark:text-white"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">Cancel</button>
              <button onClick={addTemplate} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
            </div>
          </div>
        ) : (
          <div className="p-3 border-t dark:border-gray-700">
            <button onClick={() => setShowAdd(true)} className="w-full py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded flex items-center justify-center gap-2">
              <Plus size={16} /> Add Custom Template
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
