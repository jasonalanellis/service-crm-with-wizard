import { useState, useRef, useEffect } from 'react';
import { Check, X, Edit2 } from 'lucide-react';

type Props = {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  type?: 'text' | 'number' | 'email';
  className?: string;
  placeholder?: string;
};

export default function InlineEdit({ value, onSave, type = 'text', className = '', placeholder }: Props) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleSave = async () => {
    if (editValue === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(editValue);
      setEditing(false);
    } catch (e) {
      setEditValue(value);
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          type={type}
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          placeholder={placeholder}
          disabled={saving}
          className={`border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${className}`}
        />
        <button onClick={handleSave} disabled={saving} className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded">
          <Check size={14} />
        </button>
        <button onClick={handleCancel} className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-1 cursor-pointer" onClick={() => setEditing(true)}>
      <span className={className}>{value || <span className="text-gray-400 italic">{placeholder || 'Click to edit'}</span>}</span>
      <Edit2 size={12} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
