import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, Navigate, useNavigate } from 'react-router-dom';
import {
  Home, MapPin, CheckSquare, Route, Truck, Settings, Phone,
  Bell, User, LogOut, ChevronLeft, ChevronRight, Menu, X,
  ChevronDown, Clock
} from 'lucide-react';
import NotificationBell from '../NotificationBell';
import { useAuth } from '../../../context/AuthContext';
import { assignmentsAPI } from '../../../services/api';

const DriverLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [activeTaskCount, setActiveTaskCount] = useState(0);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Close mobile menu on route change
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isUserMenuOpen && !event.target.closest('.user-menu-container')) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  useEffect(() => {
    const fetchTaskCount = async () => {
      try {
        const response = await assignmentsAPI.getDriverTasks({ limit: 100 });
        const tasks = Array.isArray(response.data) ? response.data : [];
        const count = tasks.filter((task) => !['completed', 'cancelled'].includes(task.status)).length;
        setActiveTaskCount(count);
      } catch (error) {
        console.error('Failed to fetch driver task count:', error);
      }
    };

    fetchTaskCount();
    const poll = setInterval(fetchTaskCount, 30000);
    return () => clearInterval(poll);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-emerald-50 to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-gray-700">Loading Dashboard...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (user.role !== 'Driver') {
    return <Navigate to="/dashboard" />;
  }

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    navigate('/', { replace: true });
  };

  const toggleDutyStatus = () => {
    setIsOnDuty(!isOnDuty);
  };

  const navItems = [
    { to: '/driver/dashboard', icon: <Home size={20} />, text: 'Dashboard', badge: null },
    { to: '/driver/tasks', icon: <CheckSquare size={20} />, text: 'My Tasks', badge: activeTaskCount > 0 ? String(activeTaskCount) : null },
    { to: '/driver/routes', icon: <Route size={20} />, text: 'Routes', badge: null },
    { to: '/driver/reports', icon: <MapPin size={20} />, text: 'Reports', badge: null },
    { to: '/driver/vehicle', icon: <Truck size={20} />, text: 'Vehicle', badge: null },
    { to: '/driver/support', icon: <Phone size={20} />, text: 'Support', badge: null },
    { to: '/driver/settings', icon: <Settings size={20} />, text: 'Settings', badge: null },
  ];

  const SidebarContent = ({ isCollapsed }) => (
    <>
      {/* Logo/Brand */}
      <div className="flex items-center justify-between p-4 border-b border-emerald-200">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-emerald-900">CleanUp Driver</h1>
              <p className="text-xs text-emerald-600">Waste Management</p>
            </div>
          </div>
        )}
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
          className="p-2 rounded-lg hover:bg-emerald-100 transition-colors hidden md:block"
        >
          {isCollapsed ? <ChevronRight size={18} className="text-emerald-600" /> : <ChevronLeft size={18} className="text-emerald-600" />}
        </button>
        <button 
          onClick={() => setIsMobileMenuOpen(false)} 
          className="p-2 rounded-lg hover:bg-emerald-100 transition-colors md:hidden"
        >
          <X size={18} className="text-emerald-600" />
        </button>
      </div>

      {/* Driver Status */}
      {!isCollapsed && (
        <div className="p-4 border-b border-emerald-200">
          <div className="bg-emerald-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-emerald-800">Status</span>
              <div className={`w-2 h-2 rounded-full ${isOnDuty ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            </div>
            <div className="text-xs text-emerald-600 mb-2">
              {isOnDuty ? 'On Duty' : 'Off Duty'}
            </div>
            <button
              onClick={toggleDutyStatus}
              className={`w-full text-xs py-2 px-3 rounded-md font-medium transition-colors ${
                isOnDuty 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {isOnDuty ? 'End Shift' : 'Start Shift'}
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                location.pathname === item.to 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800'
              }`}
            >
              <span className={`${location.pathname === item.to ? 'text-white' : 'text-emerald-600 group-hover:text-emerald-700'}`}>
                {item.icon}
              </span>
              {!isCollapsed && (
                <>
                  <span className="ml-3 flex-1">{item.text}</span>
                  {item.badge && (
                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full font-medium ${
                      location.pathname === item.to 
                        ? 'bg-white text-emerald-600' 
                        : 'bg-emerald-200 text-emerald-800'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          ))}
        </div>
      </nav>

      {/* Driver Info at Bottom */}
      {!isCollapsed && (
        <div className="p-4 border-t border-emerald-200">
          <div className="flex items-center space-x-3 p-3 bg-emerald-50 rounded-lg">
            <img 
              src={user.avatar_url || `https://i.pravatar.cc/150?u=${user.id}`} 
              alt={user.full_name}
              className="w-10 h-10 rounded-full border-2 border-emerald-300"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-emerald-900 truncate">
                {user.full_name || 'Driver'}
              </div>
              <div className="flex items-center space-x-1 text-xs text-emerald-600">
                <CheckSquare className="w-3 h-3" />
                <span>{activeTaskCount} active tasks</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-emerald-50">
      {/* Desktop Sidebar */}
      <div className={`bg-white shadow-xl border-r border-emerald-200 transition-all duration-300 hidden md:flex flex-col ${
        isSidebarCollapsed ? 'w-20' : 'w-72'
      }`}>
        <SidebarContent isCollapsed={isSidebarCollapsed} />
      </div>

      {/* Mobile Sidebar Overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity md:hidden ${
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>

      {/* Mobile Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white shadow-xl z-50 w-72 transform transition-transform md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent isCollapsed={false} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              {/* Left: Mobile menu + Time */}
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => setIsMobileMenuOpen(true)} 
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors md:hidden"
                >
                  <Menu size={20} className="text-gray-600" />
                </button>
                <div className="hidden sm:block">
                  <div className="text-sm font-medium text-gray-900">
                    {currentTime.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
              </div>

              {/* Center: Duty Status (Mobile) */}
              <div className="md:hidden">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isOnDuty ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span className="text-sm font-medium text-gray-700">
                    {isOnDuty ? 'On Duty' : 'Off Duty'}
                  </span>
                </div>
              </div>

              {/* Right: Notifications + User Menu */}
              <div className="flex items-center space-x-3">
                <NotificationBell />

                {/* User Menu */}
                <div className="relative user-menu-container">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <img 
                      src={user.avatar_url || `https://i.pravatar.cc/150?u=${user.id}`} 
                      alt={user.full_name}
                      className="w-8 h-8 rounded-full border-2 border-emerald-500"
                    />
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-medium text-gray-900">{user.full_name || 'Driver'}</div>
                      <div className="text-xs text-gray-500">{user.role}</div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="text-sm font-medium text-gray-900">{user.full_name || 'Driver'}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                      <Link
                        to="/driver/settings"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <User className="w-4 h-4 mr-3" />
                        Profile Settings
                      </Link>
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

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gradient-to-br from-gray-50 to-emerald-50">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DriverLayout;
