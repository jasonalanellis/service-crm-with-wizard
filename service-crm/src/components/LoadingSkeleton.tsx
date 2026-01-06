type Props = {
  type?: 'card' | 'table' | 'list';
  count?: number;
};

export default function LoadingSkeleton({ type = 'card', count = 3 }: Props) {
  if (type === 'table') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden animate-pulse">
        <div className="h-12 bg-gray-100 dark:bg-gray-700" />
        {[...Array(count)].map((_, i) => (
          <div key={i} className="h-16 border-t border-gray-100 dark:border-gray-700 flex items-center gap-4 px-6">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/3" />
              <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/4" />
            </div>
            <div className="h-6 w-16 bg-gray-200 dark:bg-gray-600 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(count)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-2/3" />
              <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-pulse">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex justify-between items-start mb-4">
            <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-1/2" />
            <div className="h-5 w-16 bg-gray-200 dark:bg-gray-600 rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
