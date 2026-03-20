import React from 'react';
import { Bell, Trash2, Archive, ArrowLeft, ArrowRight } from 'lucide-react';

const NotificationDetail = ({ notification }) => {
  if (!notification) {
    return (
      <div className="p-6 flex justify-center items-center h-full">
        <p className="text-gray-500">Select a notification to see the details.</p>
      </div>
    );
  }

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
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{notification.title}</h2>
        <div className="flex space-x-2">
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
      <div className="flex items-center text-sm text-gray-500 mb-4">
        {getIcon(notification.type)}
        <span className="ml-2">{notification.type}</span>
        <span className="mx-2">|</span>
        <span>{new Date().toLocaleString()}</span>
      </div>
      <div className="flex-1">
        <p>{notification.message}</p>
      </div>
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h3 className="text-lg font-bold mb-2">Related Details</h3>
        <div className="text-sm text-blue-500 hover:underline cursor-pointer">
          {notification.type === 'Urgent Report' && <p>View Report Details</p>}
          {notification.type === 'Vehicle Issue' && <p>View Vehicle Details</p>}
          {notification.type === 'Collection Update' && <p>View Collection Details</p>}
          {notification.type === 'Missed Collection' && <p>View Collection Details</p>}
          {notification.type === 'User Action' && <p>View User Profile</p>}
        </div>
      </div>
      <div className="mt-6 flex space-x-2">
        <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">View Details</button>
        <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">Mark as Unread</button>
        <button className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">Delete</button>
      </div>
    </div>
  );
};

export default NotificationDetail;
