
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, Search, Menu, Sun, Moon } from 'lucide-react';
import UserMenu from './UserMenu';
import Badge from './ui/Badge';

const Topbar = ({ onMenuClick }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationCount] = useState(3); // In real app, this would come from context/API

  return (
    <header className="bg-gradient-to-r from-gray-800 to-gray-700 text-white z-40 shadow-lg flex-shrink-0">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left Section - Search */}
          <div className="flex items-center gap-4 flex-1 max-w-lg">
            <button 
              onClick={onMenuClick}
              className="lg:hidden p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-300"
            >
              <Menu className="w-5 h-5 text-gray-300" />
            </button>
            
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                type="text"
                placeholder="Search reports, collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-700 text-white border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-sm placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Center Section - Welcome */}
          <div className="hidden lg:block text-center">
            <h1 className="text-lg font-semibold text-white">
              Welcome back, {user?.fullName?.split(' ')[0] || 'Friend'}! 👋
            </h1>
          </div>

          {/* Right Section - Actions & User */}
          <div className="flex items-center gap-3">
            {/* Quick Stats */}
            <div className="hidden xl:flex items-center gap-4 mr-4">
              <div className="text-center px-3 py-1 bg-gray-600/50 rounded-lg border border-gray-500/30">
                <div className="text-sm font-semibold text-green-400">12</div>
                <div className="text-xs text-gray-300">Reports</div>
              </div>
              <div className="text-center px-3 py-1 bg-gray-600/50 rounded-lg border border-gray-500/30">
                <div className="text-sm font-semibold text-blue-400">45.5kg</div>
                <div className="text-xs text-gray-300">Collected</div>
              </div>
              <div className="text-center px-3 py-1 bg-gray-600/50 rounded-lg border border-gray-500/30">
                <div className="text-sm font-semibold text-purple-400">#3</div>
                <div className="text-xs text-gray-300">Rank</div>
              </div>
            </div>

            {/* Theme Toggle */}
            <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors group text-gray-300">
              <Sun className="w-5 h-5 text-gray-300 group-hover:text-yellow-400 transition-colors" />
            </button>

            {/* Notifications */}
            <div className="relative">
              <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors group text-gray-300">
                <Bell className="w-5 h-5 text-gray-300 group-hover:text-green-400 transition-colors" />
                {notificationCount > 0 && (
                  <div className="absolute -top-1 -right-1">
                    <Badge variant="danger" size="sm" className="min-w-[18px] h-4 flex items-center justify-center text-xs">
                      {notificationCount}
                    </Badge>
                  </div>
                )}
              </button>
            </div>

            {/* User Menu */}
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
