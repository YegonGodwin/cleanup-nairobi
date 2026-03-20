import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import Badge from '../ui/Badge';
import { Bell, X, AlertCircle, CheckCircle, Clock, Truck } from 'lucide-react';
import { notificationsAPI } from '../../services/api';

const normalizeNotifications = (response) => {
  const payload = response?.data;

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.notifications)) {
    return payload.notifications;
  }

  return [];
};

const NotificationCenter = ({ className = '' }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dismissedNotifications, setDismissedNotifications] = useState(new Set());

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setIsLoading(true);
        const response = await notificationsAPI.getAll({ limit: 5 });
        if (response.success) {
          setNotifications(normalizeNotifications(response));
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const getNotificationIcon = (type) => {
    const iconClasses = "w-4 h-4";
    switch (type) {
      case 'status_update':
        return <CheckCircle className={`${iconClasses} text-green-500`} />;
      case 'report_created':
      case 'new_report':
        return <AlertCircle className={`${iconClasses} text-orange-500`} />;
      case 'report_assigned':
      case 'task_assigned':
        return <Truck className={`${iconClasses} w-4 h-4 text-blue-500`} />;
      default:
        return <Bell className={`${iconClasses} text-gray-500`} />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'status_update':
        return 'success';
      case 'report_created':
      case 'new_report':
        return 'warning';
      case 'report_assigned':
      case 'task_assigned':
        return 'primary';
      default:
        return 'default';
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const dismissNotification = (id) => {
    setDismissedNotifications(prev => new Set([...prev, id]));
  };

  const markAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter((notification) => !notification.is_read)
        .map((notification) => notification.id)
        .filter(Boolean);

      if (unreadIds.length === 0) {
        return;
      }

      await notificationsAPI.markMultipleAsRead(unreadIds);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const visibleNotifications = Array.isArray(notifications)
    ? notifications.filter(n => !dismissedNotifications.has(n.id))
    : [];
  const unreadCount = visibleNotifications.filter(n => !n.is_read).length;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-400" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-600" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="danger" size="sm">
                {unreadCount}
              </Badge>
            )}
          </div>
          <button 
            onClick={markAllAsRead}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Mark all read
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleNotifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No notifications</p>
            <p className="text-sm">You're all caught up!</p>
          </div>
        ) : (
          visibleNotifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-sm ${
                notification.is_read 
                  ? 'bg-gray-50 border-gray-200' 
                  : 'bg-white border-gray-300 shadow-sm'
              }`}
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className={`font-medium text-sm ${
                      notification.is_read ? 'text-gray-700' : 'text-gray-900'
                    }`}>
                      {notification.title}
                    </h4>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={getNotificationColor(notification.type)} 
                        size="sm"
                      >
                        {String(notification.type || 'notification').replace('_', ' ')}
                      </Badge>
                      <button
                        onClick={() => dismissNotification(notification.id)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <p className={`text-sm mb-2 ${
                    notification.is_read ? 'text-gray-600' : 'text-gray-700'
                  }`}>
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(notification.created_at)}
                    </div>
                    
                    {!notification.is_read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        
        {visibleNotifications.length > 0 && (
          <div className="text-center pt-4">
            <button 
              onClick={() => navigate('/dashboard/notifications')}
              className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors duration-200"
            >
              View All Notifications
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationCenter;
