import { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertTriangle, Truck, Trophy, User } from 'lucide-react';
import { notificationsAPI } from '../../services/api';
import { useApiState } from '../../hooks/useApiState';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/ui/Badge';

const NotificationBell = () => {
  const { user, loading: authLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // API state management
  const {
    loading,
    execute: fetchNotifications
  } = useApiState({
    onSuccess: (response) => {
      // Handle nested response structure
      if (response.data?.notifications) {
        setNotifications(response.data.notifications);
      } else if (Array.isArray(response.data)) {
        setNotifications(response.data);
      }
    }
  });

  const {
    execute: fetchCounts
  } = useApiState({
    onSuccess: (response) => {
      setUnreadCount(response.data?.unread || 0);
    }
  });

  const {
    execute: markAsRead
  } = useApiState({
    onSuccess: () => {
      // Refresh counts after marking as read
      fetchCounts(() => notificationsAPI.getCounts());
    }
  });

  // Load initial data only when user is authenticated
  useEffect(() => {
    if (user && !authLoading) {
      // Load counts with error handling
      fetchCounts(async () => {
        try {
          return await notificationsAPI.getCounts();
        } catch (error) {
          console.warn('Failed to load notification counts:', error);
          return { data: { unread: 0, total: 0, read: 0 } };
        }
      });

      // Load notifications with error handling
      fetchNotifications(async () => {
        try {
          return await notificationsAPI.getNotifications({ limit: 5 });
        } catch (error) {
          console.warn('Failed to load notifications:', error);
          return { data: { notifications: [] } };
        }
      });
    }
  }, [user, authLoading]);

  // Auto-refresh every 30 seconds only when authenticated
  useEffect(() => {
    if (!user || authLoading) return;

    const interval = setInterval(async () => {
      try {
        await fetchCounts(() => notificationsAPI.getCounts());
        if (isOpen) {
          await fetchNotifications(() => notificationsAPI.getNotifications({ limit: 5 }));
        }
      } catch (error) {
        console.warn('Auto-refresh failed:', error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isOpen, user, authLoading]);

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(() => notificationsAPI.markAsRead(notification.id));
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notification.id ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  // Get notification icon
  const getNotificationIcon = (type, priority) => {
    const iconClass = `w-4 h-4 ${getPriorityColor(priority)}`;
    
    switch (type) {
      case 'report_created':
        return <AlertTriangle className={iconClass} />;
      case 'task_accepted':
      case 'task_started':
      case 'task_completed':
        return <Truck className={iconClass} />;
      case 'achievement_unlocked':
        return <Trophy className={iconClass} />;
      case 'driver_joined':
        return <User className={iconClass} />;
      default:
        return <Bell className={iconClass} />;
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-500';
      case 'high':
        return 'text-orange-500';
      case 'medium':
        return 'text-blue-500';
      case 'low':
        return 'text-gray-500';
      default:
        return 'text-gray-500';
    }
  };

  // Format time ago
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Don't render if user is not authenticated
  if (!user || authLoading) {
    return null;
  }

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={async () => {
          if (!user || authLoading) return;
          
          setIsOpen(!isOpen);
          if (!isOpen) {
            try {
              await fetchNotifications(() => notificationsAPI.getNotifications({ limit: 5 }));
            } catch (error) {
              console.warn('Failed to refresh notifications on open:', error);
            }
          }
        }}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1">
            <Badge variant="danger" size="sm" className="min-w-[18px] h-4 flex items-center justify-center text-xs animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          </div>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Notification Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                <p className="text-sm text-gray-500">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up! 🎉'}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <div className="p-4 text-center">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No notifications yet</p>
                  <p className="text-sm text-gray-400">You'll see updates here when they arrive</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.is_read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type, notification.priority)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${
                                !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                {formatTimeAgo(notification.created_at)}
                              </p>
                            </div>
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // Navigate to full notifications page
                    window.location.href = '/admin/notifications';
                  }}
                  className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  View All Notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;