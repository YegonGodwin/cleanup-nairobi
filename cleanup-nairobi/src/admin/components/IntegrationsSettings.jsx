
import React from 'react';

const IntegrationsSettings = () => {
  return (
    <div className="space-y-8">
      {/* Africa's Talking */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-4">Africa's Talking (SMS/Voice)</h3>
        <div className="flex items-center mb-4">
          <span className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
            Connected
          </span>
          <span className="ml-4 text-sm text-gray-500">Last sync: 5 mins ago</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">API Key</label>
            <input
              type="password"
              defaultValue="************"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              defaultValue="cleanupnairobi"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
            />
          </div>
        </div>
        <div className="mt-6 flex space-x-4">
          <button className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600">
            Test Connection
          </button>
          <button className="text-red-600 hover:underline">Disconnect</button>
        </div>
      </div>

      {/* Email Service */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-4">Email Service (SMTP)</h3>
        {/* Email service settings will go here */}
        <p className="text-gray-500">Email service settings coming soon.</p>
      </div>

      {/* Map Provider */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-4">Map Provider</h3>
        {/* Map provider settings will go here */}
        <p className="text-gray-500">Map provider settings coming soon.</p>
      </div>

      {/* M-PESA and WhatsApp (Future) */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-4">Future Integrations</h3>
        <div className="flex items-center space-x-8">
            <p className="text-gray-500">M-PESA and WhatsApp Business API integrations are coming soon.</p>
        </div>
      </div>
    </div>
  );
};

export default IntegrationsSettings;
