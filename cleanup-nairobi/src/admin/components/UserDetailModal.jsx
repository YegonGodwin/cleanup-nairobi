
import React, { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { userAPI, authAPI } from '../../services/api';
import toast from 'react-hot-toast';

const UserDetailModal = ({ user, onClose, onUserUpdate, onUserDelete }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [editableUser, setEditableUser] = useState(user);
  const [reasonForBlocking, setReasonForBlocking] = useState('');

  useEffect(() => {
    setEditableUser(user);
  }, [user]);

  if (!user) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditableUser((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSaveProfile = async () => {
    try {
      // Assuming only role and status can be updated via admin panel for now
      await userAPI.updateUserRole(editableUser.id, { role: editableUser.role, status: editableUser.status });
      // If other profile details are editable, you'd call authAPI.updateProfile here
      toast.success('User profile updated successfully!');
      onUserUpdate();
    } catch (err) {
      toast.error(`Failed to update user profile: ${err.message}`);
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = editableUser.status === 'Active' ? 'Blocked' : 'Active';
    try {
      await userAPI.updateUserRole(editableUser.id, { status: newStatus });
      setEditableUser((prev) => ({ ...prev, status: newStatus }));
      toast.success(`User status changed to ${newStatus}!`);
      onUserUpdate();
    } catch (err) {
      toast.error(`Failed to change user status: ${err.message}`);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm(`Are you sure you want to delete ${user.fullName}'s account? This action cannot be undone.`)) {
      try {
        await userAPI.deleteUser(user.id);
        toast.success('User account deleted successfully!');
        onUserDelete();
        onClose();
      } catch (err) {
        toast.error(`Failed to delete user account: ${err.message}`);
      }
    }
  };

  const handleResetPassword = () => {
    // Placeholder for reset password logic
    toast.info('Password reset functionality not yet implemented.');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold">User Details</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200">
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-1/4 border-r flex flex-col">
            <div className="p-6 text-center">
              <img
                src={editableUser.avatar || 'https://i.pravatar.cc/150?u=' + editableUser.id}
                alt={editableUser.fullName}
                className="w-24 h-24 rounded-full mx-auto mb-4"
              />
              <h3 className="text-xl font-semibold">{editableUser.fullName}</h3>
              <p className="text-gray-500">{editableUser.email}</p>
            </div>
            <nav className="py-4 flex-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full text-left px-6 py-3 ${
                  activeTab === 'profile' ? 'bg-gray-100 font-semibold' : ''
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`w-full text-left px-6 py-3 ${
                  activeTab === 'activity' ? 'bg-gray-100 font-semibold' : ''
                }`}
              >
                Activity
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`w-full text-left px-6 py-3 ${
                  activeTab === 'reports' ? 'bg-gray-100 font-semibold' : ''
                }`}
              >
                Reports History
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full text-left px-6 py-3 ${
                  activeTab === 'settings' ? 'bg-gray-100 font-semibold' : ''
                }`}
              >
                Settings
              </button>
            </nav>
          </div>

          <div className="w-3/4 p-6 overflow-y-auto">
            {activeTab === 'profile' && (
              <div>
                <h3 className="text-xl font-bold mb-4">Profile</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={editableUser.fullName || ''}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={editableUser.email || ''}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      type="text"
                      name="phone"
                      value={editableUser.phone || ''}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <select
                      name="role"
                      value={editableUser.role || 'Citizen'}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    >
                      <option>Citizen</option>
                      <option>Operator</option>
                      <option>Manager</option>
                      <option>Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Zone</label>
                    <input
                      type="text"
                      name="zone"
                      value={editableUser.zone || ''}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Status</span>
                    <div className="flex items-center">
                      <span className="mr-2">{editableUser.status === 'Active' ? 'Active' : 'Blocked'}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={editableUser.status === 'Active'}
                          onChange={handleToggleStatus}
                        />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveProfile}
                      className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div>
                <h3 className="text-xl font-bold mb-4">Activity</h3>
                {/* Activity content goes here */}
                <p>Last 20 actions timeline for {user.fullName}.</p>
              </div>
            )}

            {activeTab === 'reports' && (
              <div>
                <h3 className="text-xl font-bold mb-4">Reports History</h3>
                {/* Reports history content goes here */}
                <p>All reports submitted by {user.fullName}.</p>
              </div>
            )}

            {activeTab === 'settings' && (
              <div>
                <h3 className="text-xl font-bold mb-4">Settings</h3>
                <div className="space-y-4">
                  <div>
                    <button
                      onClick={handleResetPassword}
                      className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
                    >
                      Reset Password
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Block/Unblock Account</span>
                    <button
                      onClick={handleToggleStatus}
                      className={`px-4 py-2 rounded-md ${
                        editableUser.status === 'Active'
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                    >
                      {editableUser.status === 'Active' ? 'Block Account' : 'Unblock Account'}
                    </button>
                  </div>
                  {editableUser.status === 'Blocked' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Reason for blocking</label>
                      <textarea
                        value={reasonForBlocking}
                        onChange={(e) => setReasonForBlocking(e.target.value)}
                        rows="3"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                        placeholder="Enter reason for blocking this account..."
                      ></textarea>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Delete Account</span>
                    <button
                      onClick={handleDeleteAccount}
                      className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
