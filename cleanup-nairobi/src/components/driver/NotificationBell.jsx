import React, { useState, useEffect, useCallback } from 'react';
import { Bell, AlertTriangle, Info, CheckCircle, Clock, X, Truck } from 'lucide-react';
import { notificationsAPI } from '../../services/api';

const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch notification counts and recent notifications
  const fetchNotifications = useCallback(async (limit = 5) => {
    try {
      setLoading(true);

      // Get recent notifications
      const notificationsResponse = await notificationsAPI.getAll({
        limit: limit,
        is_read: false,
        order_by: 'created_at',
        order: 'desc'
      });

      const notificationsData = notificationsResponse?.data?.notifications ||
                                notificationsResponse?.data ||
                                [];

      setNotifications(Array.isArray(notificationsData) ? notificationsData : []);

      // Get unread count
      const countResponse = await notificationsAPI.getUnreadCount();
      const count = countResponse?.data?.unread_count || countResponse?.unread_count || 0;
      setUnreadCount(count);

    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and set up polling
  useEffect(() => {
    // Fetch immediately
    fetchNotifications(5);

    // Set up polling every 30 seconds to keep notifications updated
    const interval = setInterval(() => fetchNotifications(5), 30000);

    return () => {
      // Cleanup interval on component unmount
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  // Listen for document visibility change to refresh when user returns to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifications(5);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchNotifications]);

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'task_assigned': return <Truck className="w-4 h-4 text-blue-600" />;
      case 'report_created': return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'status_update': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'urgent': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      default: return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  // Format notification time
  const formatNotificationTime = (dateString) => {
    if (!dateString) return 'Just now';
    const now = new Date();
    const notificationDate = new Date(dateString);
    const diffMs = now - notificationDate;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Handle notification actions
  const handleNotificationAction = async (notification, action) => {
    try {
      switch (action) {
        case 'mark_read':
          await notificationsAPI.markAsRead(notification.id);
          // Update local state to mark as read
          setNotifications(prev =>
            prev.map(n =>
              n.id === notification.id ? { ...n, is_read: true } : n
            )
          );
          // Update unread count
          setUnreadCount(prev => Math.max(prev - 1, 0));
          setShowDropdown(false); // Close dropdown after marking as read
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error handling notification action:', error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          fetchNotifications(5); // Refresh when clicked
          setShowDropdown(!showDropdown);
        }}
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Notifications</h3>
              <button
                onClick={() => fetchNotifications(5)}
                className="text-sm text-emerald-600 hover:text-emerald-700"
              >
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-4 text-center">
              <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center py-8">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No new notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !notification.is_read ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </h4>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 truncate">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatNotificationTime(notification.created_at)}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <button
                        onClick={() => handleNotificationAction(notification, 'mark_read')}
                        className="ml-2 p-1 text-gray-400 hover:text-blue-600 rounded"
                        title="Mark as read"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        ></div>
      )}
    </div>
  );
};

export default NotificationBell;