import { useState, useEffect, useCallback } from 'react';
import { Pin } from 'lucide-react';

type PinnedItems = Record<string, string[]>; // category -> ids

const STORAGE_KEY = 'pinned_items';

function getPinnedItems(): PinnedItems {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function savePinnedItems(items: PinnedItems) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('pinned_changed'));
}

export function usePinnedItems(category: string) {
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
    return getPinnedItems()[category] || [];
  });

  useEffect(() => {
    const handler = () => {
      setPinnedIds(getPinnedItems()[category] || []);
    };
    window.addEventListener('pinned_changed', handler);
    return () => window.removeEventListener('pinned_changed', handler);
  }, [category]);

  const isPinned = useCallback((id: string) => {
    return pinnedIds.includes(id);
  }, [pinnedIds]);

  const togglePin = useCallback((id: string) => {
    const items = getPinnedItems();
    const current = items[category] || [];
    
    if (current.includes(id)) {
      items[category] = current.filter(i => i !== id);
    } else {
      items[category] = [id, ...current];
    }
    
    savePinnedItems(items);
    setPinnedIds(items[category]);
  }, [category]);

  const pinItem = useCallback((id: string) => {
    const items = getPinnedItems();
    const current = items[category] || [];
    
    if (!current.includes(id)) {
      items[category] = [id, ...current];
      savePinnedItems(items);
      setPinnedIds(items[category]);
    }
  }, [category]);

  const unpinItem = useCallback((id: string) => {
    const items = getPinnedItems();
    const current = items[category] || [];
    
    if (current.includes(id)) {
      items[category] = current.filter(i => i !== id);
      savePinnedItems(items);
      setPinnedIds(items[category]);
    }
  }, [category]);

  // Sort function to put pinned items first
  const sortWithPinned = useCallback(<T extends { id: string }>(items: T[]): T[] => {
    return [...items].sort((a, b) => {
      const aP = pinnedIds.includes(a.id);
      const bP = pinnedIds.includes(b.id);
      if (aP && !bP) return -1;
      if (!aP && bP) return 1;
      return 0;
    });
  }, [pinnedIds]);

  return {
    pinnedIds,
    isPinned,
    togglePin,
    pinItem,
    unpinItem,
    sortWithPinned,
  };
}

// Pin button component
export function PinButton({ isPinned, onToggle }: { isPinned: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
        isPinned ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
      }`}
      title={isPinned ? 'Unpin' : 'Pin to top'}
    >
      <Pin size={14} className={isPinned ? 'fill-current' : ''} />
    </button>
  );
}
