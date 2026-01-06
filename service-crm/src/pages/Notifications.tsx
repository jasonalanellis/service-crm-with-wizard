import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { format } from 'date-fns';
import { Bell, Check, CheckCheck, Calendar, DollarSign, Star, User, Trash2 } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  created_at: string;
}

const typeIcons: Record<string, any> = {
  booking: Calendar,
  payment: DollarSign,
  review: Star,
  customer: User,
  default: Bell,
};

export default function Notifications() {
  const { tenant } = useTenant();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (tenant) fetchNotifications();
  }, [tenant]);

  const fetchNotifications = async () => {
    if (!tenant) return;
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false })
      .limit(100);
    setNotifications(data || []);
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = async () => {
    if (!tenant) return;
    await supabase.from('notifications').update({ is_read: true }).eq('tenant_id', tenant.id).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const deleteNotification = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.is_read) 
    : notifications;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!tenant) return <div className="p-8 text-gray-500">Please select a business</div>;

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
          <p className="text-gray-500 text-sm">{unreadCount} unread</p>
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value as any)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
          </select>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <CheckCheck size={18} /> Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-600">No notifications</h3>
            <p className="text-gray-400 text-sm">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredNotifications.map(notif => {
              const Icon = typeIcons[notif.type] || typeIcons.default;
              return (
                <div
                  key={notif.id}
                  className={`p-4 flex items-start gap-4 hover:bg-gray-50 ${!notif.is_read ? 'bg-blue-50' : ''}`}
                >
                  <div className={`p-2 rounded-lg ${!notif.is_read ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <Icon className={!notif.is_read ? 'text-blue-600' : 'text-gray-500'} size={20} />
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${!notif.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                      {notif.title}
                    </p>
                    <p className="text-sm text-gray-500">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(notif.created_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!notif.is_read && (
                      <button
                        onClick={() => markAsRead(notif.id)}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Mark as read"
                      >
                        <Check size={16} className="text-gray-400" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notif.id)}
                      className="p-1 hover:bg-gray-200 rounded"
                      title="Delete"
                    >
                      <Trash2 size={16} className="text-gray-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
