
import React from 'react';

const ProfileSettings = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Column 1: Profile Card */}
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4">Admin Profile</h3>
          <div className="flex flex-col items-center">
            <img
              src="https://i.pravatar.cc/150?u=a042581f4e29026704d"
              alt="Admin"
              className="w-32 h-32 rounded-full mb-4"
            />
            <button className="text-sm text-blue-600 hover:underline mb-4">Upload new avatar</button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                defaultValue="Admin User"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                defaultValue="admin@cleanup.com"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="text"
                defaultValue="+254 700 000 000"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <span className="inline-block mt-1 px-3 py-1 bg-red-200 text-red-800 rounded-full text-sm">
                Super Admin
              </span>
            </div>
            <button className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600">
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* Column 2: Password & Preferences */}
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4">Change Password</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Password</label>
              <input
                type="password"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">New Password</label>
              <input
                type="password"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
              <input
                type="password"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              />
            </div>
            <button className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600">
              Update Password
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4">Preferences</h3>
          <div className="space-y-4">
            {/* Preferences fields will go here */}
            <p className="text-gray-500">Preference settings coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
