import React from 'react';
import { Card, CardContent } from '../ui/Card';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Sun, Moon, Cloud } from 'lucide-react';

const WelcomeSection = ({ className = '' }) => {
  const { user } = useAuth();
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good Morning', icon: <Sun className="w-5 h-5 text-yellow-500" /> };
    if (hour < 17) return { text: 'Good Afternoon', icon: <Cloud className="w-5 h-5 text-blue-500" /> };
    return { text: 'Good Evening', icon: <Moon className="w-5 h-5 text-purple-500" /> };
  };

  const greeting = getGreeting();
  const firstName = user?.fullName?.split(' ')[0] || 'Friend';

  // Sample user stats - in real app, these would come from API
  const userStats = {
    reportsSubmitted: 12,
    wasteCollected: 45.5,
    streakDays: 7,
    level: 'Eco Warrior'
  };

  return (
    <Card className={`bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-green-200 ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              {greeting.icon}
              <h1 className="text-2xl font-bold text-gray-900">
                {greeting.text}, {firstName}!
              </h1>
            </div>
            
            <p className="text-gray-700 mb-4 leading-relaxed">
              Ready to make a positive impact today? Your efforts are helping keep Nairobi clean and green.
            </p>
            
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-full px-3 py-1.5 border border-green-200">
                <Sparkles className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700">
                  {userStats.streakDays} day streak
                </span>
              </div>
              
              <Badge variant="success" className="bg-green-100/80 backdrop-blur-sm">
                {userStats.level}
              </Badge>
              
              <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-full px-3 py-1.5 border border-green-200">
                <span className="text-sm font-medium text-gray-700">
                  {userStats.wasteCollected}kg collected
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex-shrink-0 ml-6 hidden md:block">
            <div className="relative">
              <Avatar 
                src={user?.avatar} 
                fallback={firstName.charAt(0)}
                size="xl"
                className="border-4 border-white shadow-lg"
              />
              <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1.5 shadow-lg">
                <Sparkles className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-green-200/50">
          <div className="text-center">
            <div className="text-xl font-bold text-green-700">{userStats.reportsSubmitted}</div>
            <div className="text-xs text-gray-600">Reports Submitted</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-green-700">{userStats.wasteCollected}kg</div>
            <div className="text-xs text-gray-600">Waste Collected</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-green-700">{userStats.streakDays}</div>
            <div className="text-xs text-gray-600">Day Streak</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WelcomeSection;