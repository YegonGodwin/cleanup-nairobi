import { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Trash2, 
  Filter, 
  Search,
  RefreshCw,
  Eye,
  EyeOff,
  MapPin,
  User,
  Truck,
  Trophy,
  Settings,
  MoreVertical
} from 'lucide-react';
import { notificationsAPI } from '../../services/api';
import { useApiState } from '../../hooks/useApiState';
import Badge from '../../components/ui/Badge';
import { Card } from '../../components/ui/card';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [counts, setCounts] = useState({ total: 0, unread: 0, read: 0 });
  const [filters, setFilters] = useState({
    type: 'all',
    priority: 'all',
    status: 'all',
    search: ''
  });
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // API state management
  const {
    loading,
    error,
    execute: fetchNotifications,
    retry
  } = useApiState({
    showToast: true,
    retryable: true,
    onSuccess: (response) => {
      // Handle the nested response structure from backend
      if (response.data && response.data.notifications) {
        setNotifications(response.data.notifications);
      } else if (response.data && Array.isArray(response.data)) {
        setNotifications(response.data);
      }
      
      if (response.data && response.data.counts) {
        setCounts(response.data.counts);
      }
    }
  });

  const {
    loading: actionLoading,
    execute: executeAction
  } = useApiState({
    showToast: true,
    onSuccess: () => {
      // Refresh data after actions
      loadNotifications();
    }
  });

  // Separate function to load notifications
  const loadNotifications = () => {
    fetchNotifications(async () => {
      try {
        const [notifsResponse, countsResponse] = await Promise.all([
          notificationsAPI.getNotifications(),
          notificationsAPI.getCounts()
        ]);
        
        return {
          data: {
            notifications: notifsResponse.data?.notifications || notifsResponse.data || [],
            counts: countsResponse.data || { total: 0, unread: 0, read: 0 }
          }
        };
      } catch (error) {
        console.error('Error loading notifications:', error);
        throw error;
      }
    });
  };

  // Load notifications on component mount
  useEffect(() => {
    loadNotifications();
  }, []);

  // Filter notifications based on current filters
  useEffect(() => {
    let filtered = [...notifications];

    // Filter by type
    if (filters.type !== 'all') {
      filtered = filtered.filter(notif => notif.type === filters.type);
    }

    // Filter by priority
    if (filters.priority !== 'all') {
      filtered = filtered.filter(notif => notif.priority === filters.priority);
    }

    // Filter by read status
    if (filters.status !== 'all') {
      const isRead = filters.status === 'read';
      filtered = filtered.filter(notif => notif.is_read === isRead);
    }

    // Filter by search term
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(notif => 
        notif.title.toLowerCase().includes(searchTerm) ||
        notif.message.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredNotifications(filtered);
  }, [notifications, filters]);

  // Handle notification actions
  const handleMarkAsRead = async (notificationId) => {
    await executeAction(() => notificationsAPI.markAsRead(notificationId));
  };

  const handleMarkMultipleAsRead = async () => {
    if (selectedNotifications.length === 0) return;
    await executeAction(() => notificationsAPI.markMultipleAsRead(selectedNotifications));
    setSelectedNotifications([]);
  };

  const handleDeleteNotification = async (notificationId) => {
    await executeAction(() => notificationsAPI.deleteNotification(notificationId));
  };

  const handleSelectNotification = (notificationId) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type, priority) => {
    const iconClass = `w-5 h-5 ${getPriorityColor(priority)}`;
    
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
      case 'system_alert':
        return <Settings className={iconClass} />;
      default:
        return <Bell className={iconClass} />;
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-blue-600';
      case 'low':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  // Get priority badge
  const getPriorityBadge = (priority) => {
    const variants = {
      urgent: 'danger',
      high: 'warning',
      medium: 'info',
      low: 'secondary'
    };
    return <Badge variant={variants[priority] || 'secondary'} size="sm">{priority}</Badge>;
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

  // Parse metadata safely
  const parseMetadata = (metadata) => {
    try {
      return typeof metadata === 'string' ? JSON.parse(metadata) : metadata || {};
    } catch {
      return {};
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">Stay updated with real-time system activities</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadNotifications}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Notifications</p>
              <p className="text-2xl font-bold text-gray-900">{counts.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unread</p>
              <p className="text-2xl font-bold text-orange-600">{counts.unread}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <EyeOff className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Read</p>
              <p className="text-2xl font-bold text-green-600">{counts.read}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="report_created">New Reports</option>
                  <option value="task_accepted">Task Accepted</option>
                  <option value="task_started">Task Started</option>
                  <option value="task_completed">Task Completed</option>
                  <option value="task_overdue">Overdue Tasks</option>
                  <option value="driver_joined">New Drivers</option>
                  <option value="system_alert">System Alerts</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Bulk Actions */}
      {selectedNotifications.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {selectedNotifications.length} notification{selectedNotifications.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkMultipleAsRead}
                disabled={actionLoading}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Mark as Read
              </button>
              <button
                onClick={() => setSelectedNotifications([])}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Notifications List */}
      <Card>
        {loading && notifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Failed to load notifications</p>
            <button
              onClick={retry}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No notifications found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {/* Select All Header */}
            <div className="p-4 bg-gray-50 flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedNotifications.length === filteredNotifications.length}
                onChange={handleSelectAll}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Select All ({filteredNotifications.length})
              </span>
            </div>

            {/* Notifications */}
            {filteredNotifications.map((notification) => {
              const metadata = parseMetadata(notification.metadata);
              return (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !notification.is_read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedNotifications.includes(notification.id)}
                      onChange={() => handleSelectNotification(notification.id)}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />

                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type, notification.priority)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`text-sm font-medium ${
                              !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </h3>
                            {getPriorityBadge(notification.priority)}
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {notification.message}
                          </p>
                          
                          {/* Metadata */}
                          {metadata.location && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                              <MapPin className="w-3 h-3" />
                              <span>{metadata.location}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{formatTimeAgo(notification.created_at)}</span>
                            {metadata.driver_name && (
                              <span>Driver: {metadata.driver_name}</span>
                            )}
                            {metadata.task_duration && (
                              <span>Duration: {metadata.task_duration}min</span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {!notification.is_read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              disabled={actionLoading}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Mark as read"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteNotification(notification.id)}
                            disabled={actionLoading}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete notification"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default NotificationsPage;