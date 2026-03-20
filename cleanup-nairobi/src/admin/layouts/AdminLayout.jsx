
import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { Home, BarChart3, Calendar, Users, Truck, MapPin, PieChart, Bell, Settings, FileText, ChevronLeft, ChevronRight, Search, Sun, Menu, X, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../components/NotificationBell';

const AdminLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    // Close mobile menu on route change
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location]);

  // Debug: Log user role to see what we're working with
  useEffect(() => {
    if (user) {
      console.log('AdminLayout - User object:', user);
      console.log('AdminLayout - User role:', user.role);
      console.log('AdminLayout - Role type:', typeof user.role);
    }
  }, [user]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl font-semibold">Loading...</div>
      </div>
    );
  }

  if (!user) {
    // This case should now be handled by ProtectedContent in App.jsx
    return null;
  }

  if (user.role !== 'Admin') {
    return <Navigate to="/dashboard" />;
  }

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    // Explicitly navigate to landing page after logout
    navigate('/', { replace: true });
  };

  const navItems = [
    { to: '/admin/dashboard', icon: <Home size={20} />, text: 'Dashboard' },
    { to: '/admin/reports', icon: <BarChart3 size={20} />, text: 'Reports' },
    { to: '/admin/collections', icon: <Calendar size={20} />, text: 'Collections' },
    { to: '/admin/users', icon: <Users size={20} />, text: 'Users' },
    { to: '/admin/vehicles', icon: <Truck size={20} />, text: 'Vehicles' },
    { to: '/admin/zones', icon: <MapPin size={20} />, text: 'Zones' },
    { to: '/admin/analytics', icon: <PieChart size={20} />, text: 'Analytics' },
    { to: '/admin/notifications', icon: <Bell size={20} />, text: 'Notifications' },
    { to: '/admin/settings', icon: <Settings size={20} />, text: 'Settings' },
    { to: '/admin/audit-logs', icon: <FileText size={20} />, text: 'Audit Logs' },
  ];

  const SidebarContent = ({ isCollapsed }) => (
    <>
      <div className="flex items-center justify-between p-4">
        {!isCollapsed && <h1 className="text-2xl font-bold text-emerald-900">CleanUp Nairobi</h1>}
        <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2 rounded-full hover:bg-gray-200 hidden md:block">
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
        <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-full hover:bg-gray-200 md:hidden">
          <X size={20} />
        </button>
      </div>
      <nav className="mt-10">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 ${
              location.pathname === item.to ? 'bg-emerald-100 text-gray-700' : ''
            }`}
          >
            {item.icon}
            {!isCollapsed && <span className="mx-4 font-medium">{item.text}</span>}
          </Link>
        ))}
      </nav>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className={`bg-white shadow-md transition-all duration-300 hidden md:flex flex-col ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <SidebarContent isCollapsed={isSidebarCollapsed} />
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity md:hidden ${
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>
      <div
        className={`fixed top-0 left-0 h-full bg-white shadow-lg z-50 w-64 transform transition-transform md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent isCollapsed={false} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex justify-between items-center p-4 bg-white border-b">
          <div className="flex items-center">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 rounded-full hover:bg-gray-100 md:hidden mr-2">
              <Menu size={24} />
            </button>
            <div className="relative hidden md:block">
              <Search size={20} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search reports, users, vehicles..." className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md" />
            </div>
          </div>
          <div className="flex items-center">
            <button className="p-2 rounded-full hover:bg-gray-100">
                <Sun size={20} />
            </button>
            <NotificationBell />
            
            {/* User Menu Dropdown */}
            <div className="relative ml-4 user-menu-container">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <img 
                  src={user.avatar_url || `https://i.pravatar.cc/150?u=${user.id}`} 
                  alt={user.full_name || 'Admin'} 
                  className="w-8 h-8 rounded-full" 
                />
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium text-gray-700">{user.full_name || 'Admin User'}</div>
                  <div className="text-xs text-gray-500">{user.role}</div>
                </div>
                <ChevronDown size={16} className="text-gray-400" />
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="text-sm font-medium text-gray-900">{user.full_name || 'Admin User'}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      // Navigate to profile or settings if needed
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <User size={16} className="mr-3" />
                    Profile Settings
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                  >
                    <LogOut size={16} className="mr-3" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200">
          <div className="container mx-auto px-6 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
