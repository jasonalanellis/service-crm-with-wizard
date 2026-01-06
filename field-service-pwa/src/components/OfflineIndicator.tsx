import { WifiOff } from 'lucide-react';

interface Props {
  isOnline: boolean;
}

export function OfflineIndicator({ isOnline }: Props) {
  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-500 text-white py-2 px-4 flex items-center justify-center gap-2 z-50">
      <WifiOff className="w-4 h-4" />
      <span className="text-sm font-medium">You are offline</span>
    </div>
  );
}
