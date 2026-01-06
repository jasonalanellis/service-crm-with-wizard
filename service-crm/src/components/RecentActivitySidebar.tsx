import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Activity, Calendar, User, DollarSign, Star, FileText, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type ActivityItem = {
  id: string;
  type: 'booking' | 'customer' | 'payment' | 'review' | 'quote' | 'note';
  title: string;
  description: string;
  timestamp: Date;
};

// Store in localStorage
const STORAGE_KEY = 'recent_activities';
const MAX_ACTIVITIES = 20;

export function addRecentActivity(item: Omit<ActivityItem, 'id' | 'timestamp'>) {
  const activities = getRecentActivities();
  const newItem: ActivityItem = {
    ...item,
    id: Date.now().toString(),
    timestamp: new Date(),
  };
  const updated = [newItem, ...activities].slice(0, MAX_ACTIVITIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('activity_added'));
}

export function getRecentActivities(): ActivityItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).map((a: any) => ({ ...a, timestamp: new Date(a.timestamp) })) : [];
  } catch {
    return [];
  }
}

const icons = {
  booking: Calendar,
  customer: User,
  payment: DollarSign,
  review: Star,
  quote: FileText,
  note: FileText,
};

const colors = {
  booking: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
  customer: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
  payment: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400',
  review: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400',
  quote: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400',
  note: 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400',
};

export default function RecentActivitySidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    setActivities(getRecentActivities());
    const handler = () => setActivities(getRecentActivities());
    window.addEventListener('activity_added', handler);
    return () => window.removeEventListener('activity_added', handler);
  }, []);

  const displayedActivities = activities.slice(0, 10);

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-white dark:bg-gray-800 shadow-lg rounded-l-lg p-2 border border-r-0 dark:border-gray-700 transition-transform ${isOpen ? 'translate-x-full' : ''}`}
      >
        <Activity size={20} className="text-gray-600 dark:text-gray-300" />
      </button>

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full w-72 bg-white dark:bg-gray-800 shadow-xl z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity size={18} /> Recent Activity
          </h3>
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100%-60px)]">
          {displayedActivities.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <Clock size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent activity</p>
            </div>
          ) : (
            displayedActivities.map(activity => {
              const Icon = icons[activity.type] || Activity;
              return (
                <div key={activity.id} className="p-3 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div className="flex gap-3">
                    <div className={`p-2 rounded-lg ${colors[activity.type]}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 dark:text-white text-sm truncate">{activity.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{activity.description}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setIsOpen(false)} />
      )}
    </>
  );
}
