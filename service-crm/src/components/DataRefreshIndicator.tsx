import { useState, useEffect } from 'react';
import { RefreshCw, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type Props = {
  onRefresh: () => Promise<void>;
  lastUpdated?: Date;
};

export default function DataRefreshIndicator({ onRefresh, lastUpdated }: Props) {
  const [refreshing, setRefreshing] = useState(false);
  const [internalLastUpdated, setInternalLastUpdated] = useState(lastUpdated || new Date());
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (lastUpdated) setInternalLastUpdated(lastUpdated);
  }, [lastUpdated]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
      setInternalLastUpdated(new Date());
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
      <span className="hidden sm:inline">
        Last updated: {formatDistanceToNow(internalLastUpdated, { addSuffix: true })}
      </span>
      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className={`p-1.5 rounded-lg transition-colors ${
          showSuccess
            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        title="Refresh data"
      >
        {showSuccess ? (
          <Check size={16} />
        ) : (
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        )}
      </button>
    </div>
  );
}
