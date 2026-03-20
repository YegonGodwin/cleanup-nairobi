import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Badge from '../ui/Badge';
import { Bell, X, Check, AlertCircle, Info, CheckCircle, Clock } from 'lucide-react';

const NotificationCenter = ({ notifications = [], className = '' }) => {
  const [dismissedNotifications, setDismissedNotifications] = useState(new Set());

  const getNotificationIcon = (type) => {
    const iconClasses = "w-4 h-4";
    switch (type) {
      case 'success':
        return <CheckCircle className={`${iconClasses} text-green-500`} />;
      case 'warning':
        return <AlertCircle className={`${iconClasses} text-yellow-500`} />;
      case 'error':
        return <AlertCircle className={`${iconClasses} text-red-500`} />;
      case 'info':
        return <Info className={`${iconClasses} text-blue-500`} />;
      default:
        return <Bell className={`${iconClasses} text-gray-500`} />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'danger';
      case 'info':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const formatTimeAgo = (timestamp) => {
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

  const markAsRead = (id) => {
    // In real app, this would make an API call
    console.log('Marking notification as read:', id);
  };

  // Sample notifications if none provided
  const sampleNotifications = [
    {
      id: 1,
      type: 'success',
      title: 'Report Completed',
      message: 'Your waste report from Uhuru Park has been successfully collected!',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      read: false,
      actionable: true
    },
    {
      id: 2,
      type: 'info',
      title: 'New Collection Schedule',
      message: 'Collection in your area has been scheduled for tomorrow at 9:00 AM.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: false,
      actionable: false
    },
    {
      id: 3,
      type: 'warning',
      title: 'Goal Reminder',
      message: 'You\'re 5kg away from reaching your monthly recycling goal!',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      read: true,
      actionable: true
    },
    {
      id: 4,
      type: 'success',
      title: 'Achievement Unlocked',
      message: 'Congratulations! You\'ve earned the "Eco Champion" badge.',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      read: true,
      actionable: false
    }
  ];

  const displayNotifications = notifications.length > 0 ? notifications : sampleNotifications;
  const visibleNotifications = displayNotifications.filter(n => !dismissedNotifications.has(n.id));
  const unreadCount = visibleNotifications.filter(n => !n.read).length;

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
          <button className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
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
                notification.read 
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
                      notification.read ? 'text-gray-700' : 'text-gray-900'
                    }`}>
                      {notification.title}
                    </h4>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={getNotificationColor(notification.type)} 
                        size="sm"
                      >
                        {notification.type}
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
                    notification.read ? 'text-gray-600' : 'text-gray-700'
                  }`}>
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(notification.timestamp)}
                    </div>
                    
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                  
                  {notification.actionable && !notification.read && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <button className="text-sm bg-green-50 text-green-700 px-3 py-1 rounded-md hover:bg-green-100 transition-colors">
                        Take Action
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        
        {visibleNotifications.length > 0 && (
          <div className="text-center pt-4">
            <button className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors duration-200">
              View All Notifications
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationCenter;