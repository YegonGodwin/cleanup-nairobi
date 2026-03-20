import React, { useState } from 'react';
import { 
  Plus, Navigation, AlertTriangle, Phone, Camera, 
  MessageSquare, X, Zap 
} from 'lucide-react';

const FloatingActionButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      id: 'navigate',
      icon: Navigation,
      label: 'Start Navigation',
      color: 'from-emerald-500 to-emerald-600',
      action: () => console.log('Navigate')
    },
    {
      id: 'report',
      icon: AlertTriangle,
      label: 'Report Issue',
      color: 'from-red-500 to-red-600',
      action: () => console.log('Report Issue')
    },
    {
      id: 'call',
      icon: Phone,
      label: 'Call Dispatch',
      color: 'from-blue-500 to-blue-600',
      action: () => console.log('Call Dispatch')
    },
    {
      id: 'photo',
      icon: Camera,
      label: 'Take Photo',
      color: 'from-purple-500 to-purple-600',
      action: () => console.log('Take Photo')
    }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Action buttons */}
      <div className={`absolute bottom-16 right-0 space-y-3 transition-all duration-300 ${
        isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}>
        {actions.map((action, index) => {
          const IconComponent = action.icon;
          return (
            <div
              key={action.id}
              className="flex items-center space-x-3"
              style={{ 
                transitionDelay: isOpen ? `${index * 50}ms` : '0ms' 
              }}
            >
              <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-white/20">
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  {action.label}
                </span>
              </div>
              <button
                onClick={action.action}
                className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-full shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-all duration-200 transform hover:scale-110`}
              >
                <IconComponent className="w-5 h-5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full shadow-xl flex items-center justify-center text-white transition-all duration-300 transform hover:scale-110 ${
          isOpen ? 'rotate-45' : 'rotate-0'
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Plus className="w-6 h-6" />
        )}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default FloatingActionButton;