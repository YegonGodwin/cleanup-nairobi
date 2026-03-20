import React from 'react';
import { X } from 'lucide-react';

const NotificationSettingsModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Notification Settings</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={24} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Channels</h3>
            <div className="flex items-center justify-between">
              <label htmlFor="email-notifications">Email Notifications</label>
              <input type="checkbox" id="email-notifications" className="toggle-checkbox" />
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="sms-notifications">SMS Notifications</label>
              <input type="checkbox" id="sms-notifications" className="toggle-checkbox" />
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="push-notifications">Push Notifications</label>
              <input type="checkbox" id="push-notifications" className="toggle-checkbox" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Preferences</h3>
            <div className="flex items-center">
              <input type="checkbox" id="urgent-reports" defaultChecked disabled />
              <label htmlFor="urgent-reports" className="ml-2">Urgent reports (always on)</label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="all-new-reports" />
              <label htmlFor="all-new-reports" className="ml-2">All new reports</label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="vehicle-issues" defaultChecked />
              <label htmlFor="vehicle-issues" className="ml-2">Vehicle issues</label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="missed-collections" defaultChecked />
              <label htmlFor="missed-collections" className="ml-2">Missed collections</label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="user-registrations" />
              <label htmlFor="user-registrations" className="ml-2">User registrations</label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="system-alerts" defaultChecked />
              <label htmlFor="system-alerts" className="ml-2">System alerts</label>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Quiet Hours</h3>
            <div className="flex space-x-2">
              <input type="time" className="w-full p-2 border border-gray-300 rounded-md" />
              <input type="time" className="w-full p-2 border border-gray-300 rounded-md" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="notification-sound">Notification Sound</label>
            <input type="checkbox" id="notification-sound" className="toggle-checkbox" defaultChecked />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 mr-2">Cancel</button>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Save Settings</button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettingsModal;