import React, { useState, useEffect } from 'react';
import {
  Navigation, Bell, MapPin, Clock, CheckCircle, AlertTriangle,
  Truck, Fuel, Settings, Phone, MessageSquare, Star, TrendingUp,
  Route, Package, Users, ChevronDown, LogOut, User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { driversAPI } from '../../services/api';
import DriverMap from './dashboard-components/DriverMap';
import TaskList from './dashboard-components/TaskList';
import VehicleStatus from './dashboard-components/VehicleStatus';
import DriverStats from './dashboard-components/DriverStats';
import Notifications from './dashboard-components/Notifications';

const DriverDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [unreadCount, setUnreadCount] = useState(0);
  const [vehicle, setVehicle] = useState(null);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch assigned vehicle
  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const response = await driversAPI.getAssignedVehicle();
        let vehicleData = response.data;
        if (Array.isArray(vehicleData)) {
            vehicleData = vehicleData[0];
        }
        setVehicle(vehicleData);
      } catch (err) {
        console.error('Error fetching vehicle:', err);
      }
    };
    fetchVehicle();
  }, []);

  // Mock data - in real app, this would come from API
  const driverData = {
    name: user?.full_name || 'Driver',
    avatar: user?.avatar_url || `https://i.pravatar.cc/150?u=${user?.id}`,
    employeeId: 'DRV-001',
    rating: 4.8,
    totalDeliveries: 1247,
    vehicleAssigned: vehicle?.registration_number || 'N/A',
  };

  const todayStats = {
    assignedTasks: 8,
    completedTasks: 5,
    pendingTasks: 3,
    totalDistance: '47.2 km',
    workingHours: '6h 15m',
    efficiency: 92,
  };

  const currentAssignments = [
    {
      id: 1,
      type: 'waste_collection',
      location: 'Westlands Shopping Mall',
      address: 'Waiyaki Way, Westlands',
      priority: 'high',
      estimatedTime: '15 min',
      status: 'in_progress',
      reportedBy: 'Mall Management',
      description: 'Large waste accumulation near food court',
      coordinates: { lat: -1.2634, lng: 36.8047 }
    },
    {
      id: 2,
      type: 'scheduled_pickup',
      location: 'Kilimani Residential Area',
      address: 'Kindaruma Road, Kilimani',
      priority: 'medium',
      estimatedTime: '25 min',
      status: 'pending',
      scheduledTime: '2:30 PM',
      description: 'Weekly residential waste collection',
      coordinates: { lat: -1.2921, lng: 36.7872 }
    },
    {
      id: 3,
      type: 'emergency_cleanup',
      location: 'Uhuru Park',
      address: 'Uhuru Highway, CBD',
      priority: 'urgent',
      estimatedTime: '30 min',
      status: 'assigned',
      reportedBy: 'City Council',
      description: 'Post-event cleanup required',
      coordinates: { lat: -1.2921, lng: 36.8219 }
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleDutyStatus = () => {
    setIsOnDuty(!isOnDuty);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_progress': return <Clock className="w-5 h-5 text-blue-500" />;
      case 'assigned': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Modern Header */}
      <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Left: Logo & Driver Info */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">CleanUp Driver</h1>
                  <p className="text-sm text-gray-500">
                    {currentTime.toLocaleDateString()} • {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>

            {/* Center: Duty Status */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isOnDuty ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-sm font-medium text-gray-700">
                  {isOnDuty ? 'On Duty' : 'Off Duty'}
                </span>
              </div>
              <button
                onClick={toggleDutyStatus}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${isOnDuty
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  }`}
              >
                {isOnDuty ? 'End Shift' : 'Start Shift'}
              </button>
            </div>

            {/* Right: Actions & Profile */}
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <MessageSquare className="w-6 h-6" />
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <img
                    src={driverData.avatar}
                    alt={driverData.name}
                    className="w-8 h-8 rounded-full border-2 border-emerald-500"
                  />
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium text-gray-900">{driverData.name}</div>
                    <div className="text-xs text-gray-500">{driverData.employeeId}</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="text-sm font-medium text-gray-900">{driverData.name}</div>
                      <div className="text-sm text-gray-500">{user?.email}</div>
                    </div>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                      <User className="w-4 h-4 mr-3" />
                      Profile Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{todayStats.completedTasks}/{todayStats.assignedTasks}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-emerald-600 h-2 rounded-full"
                  style={{ width: `${(todayStats.completedTasks / todayStats.assignedTasks) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Distance Covered</p>
                <p className="text-2xl font-bold text-gray-900">{todayStats.totalDistance}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Route className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Working Hours</p>
                <p className="text-2xl font-bold text-gray-900">{todayStats.workingHours}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Efficiency</p>
                <p className="text-2xl font-bold text-gray-900">{todayStats.efficiency}%</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Current Assignments */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Assignments */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Current Assignments</h2>
                  <span className="bg-emerald-100 text-emerald-800 text-sm font-medium px-3 py-1 rounded-full">
                    {currentAssignments.length} Active
                  </span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {currentAssignments.map((assignment) => (
                  <div key={assignment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {getStatusIcon(assignment.status)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium text-gray-900">{assignment.location}</h3>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full border ${getPriorityColor(assignment.priority)}`}>
                              {assignment.priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{assignment.address}</p>
                          <p className="text-sm text-gray-500">{assignment.description}</p>
                          <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {assignment.estimatedTime}
                            </span>
                            {assignment.reportedBy && (
                              <span className="flex items-center">
                                <Users className="w-4 h-4 mr-1" />
                                {assignment.reportedBy}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Navigation className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                          <Phone className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Map Component */}
            <DriverMap />
          </div>

          {/* Right Column: Vehicle Status, Performance, etc. */}
          <div className="space-y-6">
            {/* Vehicle Status */}
            <VehicleStatus vehicleInfo={{
              model: vehicle?.type || 'N/A',
              plate: vehicle?.registration_number || 'N/A',
              status: vehicle?.status || 'N/A',
              capacity: vehicle?.capacity ? `${vehicle.capacity} tons` : 'N/A',
              fuelLevel: '85%',
              lastMaintenance: vehicle?.updated_at ? new Date(vehicle.updated_at).toLocaleDateString() : 'N/A'
            }} />

            {/* Performance Metrics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Driver Rating</span>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="font-medium">{driverData.rating}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Deliveries</span>
                  <span className="font-medium">{driverData.totalDeliveries.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">This Week</span>
                  <span className="font-medium text-emerald-600">+12%</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-center space-x-2 bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition-colors">
                  <Navigation className="w-5 h-5" />
                  <span>Start Navigation</span>
                </button>
                <button className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Report Issue</span>
                </button>
                <button className="w-full flex items-center justify-center space-x-2 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors">
                  <Phone className="w-5 h-5" />
                  <span>Contact Dispatch</span>
                </button>
              </div>
            </div>

            {/* Notifications */}
            <Notifications
              onViewTask={(taskId) => {
                // Navigate to tasks page or show task details
                navigate('/driver/tasks');
              }}
              onUnreadCountChange={setUnreadCount}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DriverDashboard;
