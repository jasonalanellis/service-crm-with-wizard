import { useEffect } from 'react';

type Props = {
  onNavigate: (page: string) => void;
};

const shortcuts: Record<string, string> = {
  'd': 'dashboard',
  'b': 'bookings',
  'c': 'customers',
  'l': 'leads',
  'q': 'quotes',
  'i': 'invoices',
  's': 'settings',
};

export default function KeyboardShortcuts({ onNavigate }: Props) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if no input is focused and using modifier key
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!e.altKey) return;

      const page = shortcuts[e.key.toLowerCase()];
      if (page) {
        e.preventDefault();
        onNavigate(page);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNavigate]);

  return null;
}
