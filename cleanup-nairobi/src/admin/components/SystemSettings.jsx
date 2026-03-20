
import React from 'react';

const SystemSettings = () => {
  return (
    <div className="space-y-8">
      {/* General Settings */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-4">General Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">System Name</label>
            <input
              type="text"
              defaultValue="Nairobi Waste Management"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">System Email</label>
            <input
              type="email"
              defaultValue="contact@cleanup.com"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Support Phone</label>
            <input
              type="text"
              defaultValue="+254 20 123 4567"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
            />
          </div>
        </div>
        <div className="mt-6">
          <button className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600">
            Save General Settings
          </button>
        </div>
      </div>

      {/* Collection Settings */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-4">Collection Settings</h3>
        {/* Collection settings fields will go here */}
        <p className="text-gray-500">Collection settings coming soon.</p>
      </div>

      {/* Report Settings */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-4">Report Settings</h3>
        {/* Report settings fields will go here */}
        <p className="text-gray-500">Report settings coming soon.</p>
      </div>

      {/* Notification Settings */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-4">Notification Settings</h3>
        {/* Notification settings fields will go here */}
        <p className="text-gray-500">Notification settings coming soon.</p>
      </div>
    </div>
  );
};

export default SystemSettings;
