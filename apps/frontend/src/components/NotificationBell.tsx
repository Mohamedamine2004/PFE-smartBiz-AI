import { useState, useEffect } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../lib/axios';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

/**
 * Notification bell component with unread badge and dropdown.
 */
export const NotificationBell = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const [notifs, count] = await Promise.all([
        api.get('/notification').then(r => r.data),
        api.get('/notification/unread-count').then(r => r.data.count),
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (error) {
      // Notifications are optional — fail silently
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    await api.post(`/notification/${id}/read`);
    fetchNotifications();
  };

  const markAllAsRead = async () => {
    await api.post('/notification/read-all');
    fetchNotifications();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'IMPORT_SUCCESS': return '📊';
      case 'VALUATION_COMPLETE': return '💰';
      case 'PREDICTION_READY': return '🤖';
      case 'ANOMALY_DETECTED': return '⚠️';
      case 'TEAM_INVITE': return '👥';
      default: return '🔔';
    }
  };

  const formatTime = (date: string) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now.getTime() - notifDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('notification.justNow', 'Just now');
    if (diffMins < 60) return t('notification.minutesAgo', '{{count}}m ago', { count: diffMins });
    if (diffHours < 24) return t('notification.hoursAgo', '{{count}}h ago', { count: diffHours });
    return t('notification.daysAgo', '{{count}}d ago', { count: diffDays });
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-text-muted hover:text-text-main hover:bg-elevated rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 z-40 lg:hidden"
            onClick={() => setOpen(false)}
          />
          
          {/* Dropdown panel */}
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface border border-border rounded-xl shadow-2xl z-50 max-h-[500px] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
              <h3 className="font-semibold text-text-main">{t('notification.title', 'Notifications')}</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-brand hover:underline"
                >
                  {t('notification.markAllRead', 'Mark all as read')}
                </button>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-text-muted">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t('notification.empty', 'No notifications yet')}</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 border-b border-border last:border-0 ${
                      !notif.read ? 'bg-brand/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl flex-shrink-0">
                        {getNotificationIcon(notif.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-main truncate">
                          {notif.title}
                        </p>
                        <p className="text-xs text-text-muted mt-1 line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-xs text-text-muted mt-2">
                          {formatTime(notif.createdAt)}
                        </p>
                      </div>
                      {!notif.read && (
                        <button
                          onClick={() => markAsRead(notif.id)}
                          className="p-1 text-text-muted hover:text-brand flex-shrink-0"
                          aria-label="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
