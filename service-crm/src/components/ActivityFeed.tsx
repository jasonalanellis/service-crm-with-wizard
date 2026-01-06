import { CalendarCheck, UserPlus, DollarSign, Star, FileText, Clock } from 'lucide-react';

type Activity = {
  id: string;
  type: 'booking' | 'customer' | 'payment' | 'review' | 'quote';
  title: string;
  description: string;
  time: string;
};

type Props = {
  activities: Activity[];
};

const icons = {
  booking: CalendarCheck,
  customer: UserPlus,
  payment: DollarSign,
  review: Star,
  quote: FileText,
};

const colors = {
  booking: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
  customer: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400',
  payment: 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400',
  review: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400',
  quote: 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400',
};

export default function ActivityFeed({ activities }: Props) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Clock size={32} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map(activity => {
        const Icon = icons[activity.type];
        return (
          <div key={activity.id} className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${colors[activity.type]}`}>
              <Icon size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{activity.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{activity.description}</p>
            </div>
            <span className="text-xs text-gray-400 whitespace-nowrap">{activity.time}</span>
          </div>
        );
      })}
    </div>
  );
}
