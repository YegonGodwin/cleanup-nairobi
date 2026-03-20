import React from 'react';
import { X } from 'lucide-react';

const BroadcastNotificationModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Send Broadcast Notification</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={24} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="recipients" className="block text-sm font-medium text-gray-700">Recipients</label>
            <select id="recipients" className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
              <option>All Admins</option>
              <option>Specific Roles</option>
              <option>Specific Users</option>
            </select>
          </div>
          <div>
            <label htmlFor="notification-type" className="block text-sm font-medium text-gray-700">Notification Type</label>
            <select id="notification-type" className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
              <option>System Alert</option>
              <option>Urgent Report</option>
              <option>Vehicle Issue</option>
              <option>Collection Update</option>
            </select>
          </div>
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
            <input type="text" id="title" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
            <textarea id="message" rows="4" className="mt-1 block w-full p-2 border border-gray-300 rounded-md"></textarea>
          </div>
          <div className="flex items-center">
            <input type="checkbox" id="schedule" />
            <label htmlFor="schedule" className="ml-2">Schedule for later</label>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 mr-2">Cancel</button>
          <button className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">Send Notification</button>
        </div>
      </div>
    </div>
  );
};

export default BroadcastNotificationModal;