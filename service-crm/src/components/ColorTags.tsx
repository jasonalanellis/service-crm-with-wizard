import { useState } from 'react';
import { Tag, Plus, X, Check } from 'lucide-react';

const TAG_COLORS = [
  { name: 'gray', bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', dot: 'bg-gray-500' },
  { name: 'red', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
  { name: 'orange', bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-500' },
  { name: 'yellow', bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', dot: 'bg-yellow-500' },
  { name: 'green', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', dot: 'bg-green-500' },
  { name: 'blue', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  { name: 'purple', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
  { name: 'pink', bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-300', dot: 'bg-pink-500' },
];

type TagItem = {
  name: string;
  color: string;
};

type Props = {
  tags: TagItem[];
  onChange: (tags: TagItem[]) => void;
  maxTags?: number;
  editable?: boolean;
};

export default function ColorTags({ tags, onChange, maxTags = 5, editable = true }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState('blue');

  const addTag = () => {
    if (!newTagName.trim() || tags.length >= maxTags) return;
    if (tags.some(t => t.name.toLowerCase() === newTagName.toLowerCase())) return;
    onChange([...tags, { name: newTagName.trim(), color: selectedColor }]);
    setNewTagName('');
    setShowPicker(false);
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const getColorClass = (color: string) => TAG_COLORS.find(c => c.name === color) || TAG_COLORS[0];

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {tags.map((tag, idx) => {
        const colorClass = getColorClass(tag.color);
        return (
          <span
            key={idx}
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${colorClass.bg} ${colorClass.text}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${colorClass.dot}`} />
            {tag.name}
            {editable && (
              <button onClick={() => removeTag(idx)} className="hover:opacity-70">
                <X size={12} />
              </button>
            )}
          </span>
        );
      })}
      
      {editable && tags.length < maxTags && (
        <div className="relative">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"
          >
            <Plus size={14} />
          </button>

          {showPicker && (
            <div className="absolute left-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 p-3 z-20 w-48">
              <input
                type="text"
                placeholder="Tag name"
                value={newTagName}
                onChange={e => setNewTagName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTag()}
                className="w-full px-2 py-1.5 text-sm border dark:border-gray-600 rounded mb-2 dark:bg-gray-700 dark:text-white"
                autoFocus
              />
              <div className="flex flex-wrap gap-1.5 mb-2">
                {TAG_COLORS.map(color => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    className={`w-5 h-5 rounded-full ${color.dot} flex items-center justify-center`}
                  >
                    {selectedColor === color.name && <Check size={12} className="text-white" />}
                  </button>
                ))}
              </div>
              <div className="flex justify-end gap-1">
                <button
                  onClick={() => setShowPicker(false)}
                  className="px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={addTag}
                  disabled={!newTagName.trim()}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Display-only version
export function TagBadges({ tags }: { tags: TagItem[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag, idx) => {
        const colorClass = TAG_COLORS.find(c => c.name === tag.color) || TAG_COLORS[0];
        return (
          <span
            key={idx}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colorClass.bg} ${colorClass.text}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${colorClass.dot}`} />
            {tag.name}
          </span>
        );
      })}
    </div>
  );
}
