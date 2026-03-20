import React, { useState, useEffect } from "react";
import StatCard from "../components/StatCard";
import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
  MoreVertical,
  Edit,
  Trash2,
  Truck,
} from "lucide-react";
import UserDetailModal from "../components/UserDetailModal";
import UserForm from "../components/UserForm";
import { userAPI, authAPI, driversAPI } from "../../services/api";
import toast from "react-hot-toast";

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("All");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching users..."); // Debug log
      const response = await userAPI.getAllUsers();
      console.log("Full API Response:", response); // Debug log
      console.log("Response data:", response.data); // Debug log

      if (response && response.data) {
        setUsers(response.data.users || []);
        setPagination(response.data.pagination || null);
        console.log("Users set:", response.data.users); // Debug log
      } else {
        console.warn("Unexpected response structure:", response);
        setUsers([]);
        setPagination(null);
      }
      setLoading(false);
    } catch (err) {
      console.error("Fetch users error:", err); // Debug log
      console.error("Error details:", err.message, err.stack); // More debug info
      setError(err.message);
      setUsers([]); // Ensure users is always an array
      setLoading(false);
      toast.error(`Failed to fetch users: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleViewUser = (user) => {
    setSelectedUser(user);
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
  };

  const handleOpenUserForm = (user = null) => {
    setEditingUser(user);
    setIsUserFormOpen(true);
    setSelectedUser(null);
  };

  const handlePromoteToDriver = (user) => {
    setEditingUser({ ...user, role: "Driver" });
    setIsUserFormOpen(true);
    setSelectedUser(null);
  };

  const handleCloseUserForm = () => {
    setIsUserFormOpen(false);
    setEditingUser(null);
  };

  const handleCreateOrUpdateUser = async (userData) => {
    try {
      if (editingUser) {
        await userAPI.updateUserRole(editingUser.id, { role: userData.role });
        toast.success("User updated successfully!");
      } else {
        // Check if creating a driver
        if (userData.role === 'Driver') {
          // For drivers, we need additional fields and use the driver creation endpoint
          const driverData = {
            fullName: userData.fullName,
            email: userData.email,
            password: userData.password,
            phone: userData.phone,
            vehicleId: userData.vehicleId, // Pass the vehicle ID
            vehicleNumber: userData.vehicleNumber || 'TBD-' + Date.now(), // Temporary vehicle number if not provided
            vehicleType: userData.vehicleType || 'Truck', // Default vehicle type
            licenseNumber: userData.licenseNumber || 'LIC-' + Date.now(), // Temporary license if not provided
          };
          
          console.log('Creating driver with data:', driverData); // Debug log
          await driversAPI.create(driverData);
          toast.success("Driver created successfully!");
        } else {
          // For regular users, use the standard registration endpoint
          const registrationData = {
            fullName: userData.fullName,
            email: userData.email,
            password: userData.password,
            phone: userData.phone,
            location: userData.zone || 'Nairobi', // Map zone to location with default
            role: userData.role?.toLowerCase() || 'user' // Convert to lowercase for backend
          };
          
          console.log('Sending registration data:', registrationData); // Debug log
          await authAPI.register(registrationData);
          toast.success("User created successfully!");
        }
      }
      fetchUsers();
    } catch (err) {
      console.error('Registration error:', err); // Debug log
      toast.error(
        `Failed to ${editingUser ? "update" : "create"} user: ${err.message}`
      );
    } finally {
      handleCloseUserForm();
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await userAPI.deleteUser(userId);
        fetchUsers();
        toast.success("User deleted successfully!");
      } catch (err) {
        toast.error(`Failed to delete user: ${err.message}`);
      }
    }
  };

  const totalUsers = pagination ? pagination.total : 0;
  const activeUsers = Array.isArray(users)
    ? users.filter((user) => user.status === "Active").length
    : 0;
  const blockedUsers = Array.isArray(users)
    ? users.filter((user) => user.status === "Blocked").length
    : 0;
  const drivers = Array.isArray(users)
    ? users.filter((user) => user.role === "driver").length
    : 0;

  const filteredUsers = Array.isArray(users)
    ? activeTab === "All"
      ? users
      : users.filter((user) => user.role === "driver")
    : [];

  if (loading) return <div className="text-center py-8">Loading users...</div>;
  if (error)
    return <div className="text-center py-8 text-red-500">Error: {error}</div>;

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => handleOpenUserForm()}
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
          >
            Add User
          </button>
          <button className="bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-800">
            Export Users
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          icon={<Users size={24} className="text-blue-500" />}
          title="Total Users"
          value={totalUsers}
        />
        <StatCard
          icon={<UserCheck size={24} className="text-green-500" />}
          title="Active Users"
          value={activeUsers}
        />
        <StatCard
          icon={<Truck size={24} className="text-purple-500" />}
          title="Drivers"
          value={drivers}
        />
        <StatCard
          icon={<UserX size={24} className="text-red-500" />}
          title="Blocked Users"
          value={blockedUsers}
        />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("All")}
              className={`${
                activeTab === "All"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              All Users
            </button>
            <button
              onClick={() => setActiveTab("Drivers")}
              className={`${
                activeTab === "Drivers"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Drivers
            </button>
          </nav>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left">User</th>
                <th className="p-3 text-left">Contact</th>
                <th className="p-3 text-left">Role</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b">
                  <td className="p-3 flex items-center">
                    <img
                      src={
                        user.avatar || "https://i.pravatar.cc/150?u=" + user.id
                      }
                      alt={user.fullName}
                      className="w-10 h-10 rounded-full mr-4"
                    />
                    <span className="font-medium">{user.fullName}</span>
                  </td>
                  <td className="p-3">
                    <div>{user.email}</div>
                    <div>{user.phone}</div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${
                        user.role === "admin"
                          ? "bg-red-200 text-red-800"
                          : user.role === "driver"
                          ? "bg-purple-200 text-purple-800"
                          : user.role === "Operator"
                          ? "bg-blue-200 text-blue-800"
                          : "bg-green-200 text-green-800"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${
                        user.status === "Active"
                          ? "bg-green-200 text-green-800"
                          : "bg-red-200 text-red-800"
                      }`}
                    >
                      {user.status || "N/A"}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="relative flex items-center space-x-2">
                      {user.role !== "Driver" && (
                        <button
                          className="p-2 rounded-full hover:bg-gray-200 text-purple-600"
                          onClick={() => handlePromoteToDriver(user)}
                          title="Promote to Driver"
                        >
                          <Truck size={20} />
                        </button>
                      )}
                      <button
                        className="p-2 rounded-full hover:bg-gray-200"
                        onClick={() => handleOpenUserForm(user)}
                        title="Edit User"
                      >
                        <Edit size={20} />
                      </button>
                      <button
                        className="p-2 rounded-full hover:bg-gray-200 text-red-600"
                        onClick={() => handleDeleteUser(user.id)}
                        title="Delete User"
                      >
                        <Trash2 size={20} />
                      </button>
                      <button
                        className="p-2 rounded-full hover:bg-gray-200"
                        onClick={() => handleViewUser(user)}
                        title="View Details"
                      >
                        <MoreVertical size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <UserDetailModal
        user={selectedUser}
        onClose={handleCloseModal}
        onUserUpdate={fetchUsers}
        onUserDelete={fetchUsers}
      />
      {isUserFormOpen && (
        <UserForm
          user={editingUser}
          onCancel={handleCloseUserForm}
          onSubmit={handleCreateOrUpdateUser}
        />
      )}
    </div>
  );
};

export default UserManagementPage;
