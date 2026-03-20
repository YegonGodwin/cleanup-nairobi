
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  User, 
  Package, 
  FileText, 
  Settings,
  Recycle,
  Leaf
} from 'lucide-react';

const Sidebar = () => {
  const navigationItems = [
    {
      to: "/dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
      label: "Dashboard",
      end: true
    },
    {
      to: "/dashboard/reports",
      icon: <FileText className="w-5 h-5" />,
      label: "Reports"
    },
    {
      to: "/dashboard/collections",
      icon: <Package className="w-5 h-5" />,
      label: "Collections"
    },
    {
      to: "/dashboard/profile",
      icon: <User className="w-5 h-5" />,
      label: "Profile"
    },
    {
      to: "/dashboard/settings",
      icon: <Settings className="w-5 h-5" />,
      label: "Settings"
    }
  ];

  return (
    <aside className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white w-full h-full flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500 rounded-lg">
            <Recycle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">CleanUp</h1>
            <p className="text-sm text-green-400">Nairobi</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                      {item.icon}
                    </span>
                    {item.label}
                    {isActive && (
                      <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse" />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-gray-700">
        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Leaf className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-green-400">Eco Impact</span>
          </div>
          <p className="text-xs text-gray-400 mb-2">
            You've helped collect <span className="text-green-400 font-semibold">45.5kg</span> of waste this month!
          </p>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-gradient-to-r from-green-400 to-emerald-400 h-2 rounded-full w-3/4"></div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
