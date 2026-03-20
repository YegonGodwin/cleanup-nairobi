import React from 'react';
import { Bell, Trash2 } from 'lucide-react';

const NotificationList = ({ onSelectNotification }) => {
  const notifications = [
    { id: 1, type: 'Urgent Report', title: 'New urgent waste report', message: 'A new urgent waste report has been submitted in Zone 5.', timestamp: '5 mins ago', read: false },
    { id: 2, type: 'Vehicle Issue', title: 'Vehicle breakdown', message: 'Vehicle T-04 has broken down near Westlands.', timestamp: '30 mins ago', read: false },
    { id: 3, type: 'Collection Update', title: 'Collection completed', message: 'Collection for Zone 2 has been successfully completed.', timestamp: '1 hour ago', read: true },
    { id: 4, type: 'Missed Collection', title: 'Missed collection', message: 'Scheduled collection for Zone 3 was not completed on time.', timestamp: '3 hours ago', read: false },
    { id: 5, type: 'User Action', title: 'New user registered', message: 'A new driver has registered: John Doe.', timestamp: '1 day ago', read: true },
    { id: 6, type: 'System Alert', title: 'System maintenance', message: 'Scheduled system maintenance will occur at 2 AM.', timestamp: '2 days ago', read: true },
  ];

  const getIcon = (type) => {
    switch (type) {
      case 'Urgent Report':
        return <Bell className="text-red-500" />;
      case 'Vehicle Issue':
        return <Trash2 className="text-orange-500" />;
      case 'Collection Update':
        return <Bell className="text-green-500" />;
      case 'Missed Collection':
        return <Bell className="text-yellow-500" />;
      case 'User Action':
        return <Bell className="text-blue-500" />;
      case 'System Alert':
        return <Bell className="text-gray-500" />;
      default:
        return <Bell className="text-gray-500" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Notifications</h2>
          <button className="text-sm text-blue-500">Mark all as read</button>
        </div>
        <div className="mt-4 flex space-x-2">
          <select className="w-full p-2 border border-gray-300 rounded-md">
            <option>All</option>
            <option>Unread</option>
            <option>Read</option>
          </select>
          <select className="w-full p-2 border border-gray-300 rounded-md">
            <option>All Types</option>
            <option>Urgent Reports</option>
            <option>Vehicle Issues</option>
            <option>Collection Updates</option>
            <option>System</option>
          </select>
        </div>
        <div className="mt-2">
          <input type="date" className="w-full p-2 border border-gray-300 rounded-md" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            onClick={() => onSelectNotification(notification)}
            className={`p-4 border-b border-gray-200 hover:bg-green-50 cursor-pointer flex items-start ${
              !notification.read ? 'font-bold' : ''
            }`}
          >
            {!notification.read && <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 mr-3"></div>}
            <div className="flex-shrink-0 mr-3">{getIcon(notification.type)}</div>
            <div className="flex-1">
              <div className="flex justify-between">
                <h3 className="text-sm font-bold">{notification.title}</h3>
                <span className="text-xs text-gray-500">{notification.timestamp}</span>
              </div>
              <p className="text-sm truncate">{notification.message}</p>
            </div>
            <button className="ml-2 p-1 text-gray-400 hover:text-red-500 opacity-0 hover:opacity-100">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationList;
