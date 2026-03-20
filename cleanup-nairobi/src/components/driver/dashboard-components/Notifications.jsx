import React, { useState, useEffect } from 'react';
import {
  Bell, AlertTriangle, Info, CheckCircle, Clock, X,
  MapPin, Truck, Eye, Navigation, Package
} from 'lucide-react';
import { notificationsAPI } from '../../../services/api';

const Notifications = ({ onViewTask, onUnreadCountChange }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();
    const poll = setInterval(fetchNotifications, 30000);
    return () => clearInterval(poll);
  }, []);

  // Update parent component with unread count whenever notifications change
  useEffect(() => {
    if (onUnreadCountChange && Array.isArray(notifications)) {
      const count = notifications.filter(n => !n.is_read).length;
      onUnreadCountChange(count);
    }
  }, [notifications, onUnreadCountChange]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      const response = await notificationsAPI.getAll({
        limit: 10,
        is_read: false // Prioritize unread notifications
      });

      // Handle different response structures
      const notificationsData = response?.data?.notifications || response?.data || [];
      setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.message || 'Failed to fetch notifications');
      setNotifications([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'task_assigned': return <Truck className="w-4 h-4 text-blue-600" />;
      case 'report_created': return <Package className="w-4 h-4 text-emerald-600" />;
      case 'status_update': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'urgent': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'warning': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      default: return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  // Get notification background styling
  const getNotificationBg = (type, unread) => {
    const baseClasses = unread ? 'border-l-4' : 'border-l-2';
    switch (type) {
      case 'task_assigned': return `${baseClasses} border-blue-500 bg-blue-50`;
      case 'report_created': return `${baseClasses} border-emerald-500 bg-emerald-50`;
      case 'status_update': return `${baseClasses} border-green-500 bg-green-50`;
      case 'urgent': return `${baseClasses} border-red-500 bg-red-50`;
      case 'warning': return `${baseClasses} border-yellow-500 bg-yellow-50`;
      case 'success': return `${baseClasses} border-green-500 bg-green-50`;
      default: return `${baseClasses} border-blue-500 bg-blue-50`;
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
        case 'view_task':
          if (notification.related_assignment_id && onViewTask) {
            onViewTask(notification.related_assignment_id);
          }
          break;
        case 'mark_read':
          await notificationsAPI.markAsRead(notification.id);
          setNotifications(prev =>
            prev.map(n =>
              n.id === notification.id ? { ...n, is_read: true } : n
            )
          );
          break;
        case 'dismiss':
          setNotifications(prev => prev.filter(n => n.id !== notification.id));
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error handling notification action:', error);
    }
  };

  // Get task-specific action buttons
  const getNotificationActions = (notification) => {
    const actions = [];

    // View task action for task-related notifications
    if (notification.type === 'task_assigned' && notification.related_assignment_id) {
      actions.push({
        label: 'View Task',
        icon: <Eye className="w-3 h-3" />,
        action: 'view_task',
        className: 'text-blue-600 hover:bg-blue-100'
      });
    }

    // Navigate action for location-based notifications
    if (notification.metadata?.location || notification.metadata?.coordinates) {
      actions.push({
        label: 'Navigate',
        icon: <Navigation className="w-3 h-3" />,
        action: 'navigate',
        className: 'text-emerald-600 hover:bg-emerald-100'
      });
    }

    return actions;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Bell className="w-5 h-5 mr-2 text-emerald-600" />
              Notifications
            </h3>
            <div className="w-12 h-6 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-3 rounded-lg bg-gray-50 animate-pulse">
                <div className="flex items-start space-x-3">
                  <div className="w-4 h-4 bg-gray-300 rounded"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Bell className="w-5 h-5 mr-2 text-emerald-600" />
              Notifications
            </h3>
          </div>
        </div>
        <div className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-3">{error}</p>
          <button
            onClick={fetchNotifications}
            className="text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.is_read).length : 0;

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
      <div className="p-6 border-b border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
              <p className="text-sm text-gray-500">Stay updated</p>
            </div>
          </div>
          {unreadCount > 0 && (
            <div className="flex items-center space-x-2">
              <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                {unreadCount} New
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {!Array.isArray(notifications) || notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No notifications yet</p>
            </div>
          ) : (
            (notifications || []).map((notification) => {
              const actions = getNotificationActions(notification);

              return (
                <div
                  key={notification.id}
                  className={`p-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${getNotificationBg(notification.type, !notification.is_read)} border border-white/30`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </h4>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {notification.message}
                        </p>

                        {/* Task-specific metadata */}
                        {notification.metadata?.location && (
                          <div className="flex items-center mt-2 text-xs text-gray-500">
                            <MapPin className="w-3 h-3 mr-1" />
                            {notification.metadata.location}
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-500">
                            {formatNotificationTime(notification.created_at)}
                          </p>

                          {/* Action buttons */}
                          {actions.length > 0 && (
                            <div className="flex items-center space-x-1">
                              {actions.map((action, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleNotificationAction(notification, action.action)}
                                  className={`p-1 rounded text-xs font-medium transition-colors ${action.className}`}
                                  title={action.label}
                                >
                                  {action.icon}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Mark as read / Dismiss buttons */}
                    <div className="flex items-center space-x-1 ml-2">
                      {!notification.is_read && (
                        <button
                          onClick={() => handleNotificationAction(notification, 'mark_read')}
                          className="p-1 text-gray-400 hover:text-blue-600 rounded"
                          title="Mark as read"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleNotificationAction(notification, 'dismiss')}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        title="Dismiss"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {Array.isArray(notifications) && notifications.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between">
            <button
              onClick={() => {
                if (!Array.isArray(notifications)) return;
                const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
                if (unreadIds.length > 0) {
                  notificationsAPI.markMultipleAsRead(unreadIds).then(() => {
                    setNotifications(prev => Array.isArray(prev) ? prev.map(n => ({ ...n, is_read: true })) : []);
                  }).catch(err => {
                    console.error('Error marking notifications as read:', err);
                  });
                }
              }}
              className="text-sm text-gray-600 hover:text-gray-700 font-medium"
              disabled={unreadCount === 0}
            >
              Mark All Read
            </button>
            <button
              onClick={fetchNotifications}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Refresh
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
