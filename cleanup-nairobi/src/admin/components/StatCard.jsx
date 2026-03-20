
import React from 'react';

const StatCard = ({ icon, title, value, change, changeType }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center">
        <div className="bg-emerald-100 p-3 rounded-full">
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-emerald-900">{value}</p>
        </div>
      </div>
      {change && (
        <div className={`mt-4 flex items-center text-sm ${changeType === 'increase' ? 'text-green-500' : 'text-red-500'}`}>
          {change}
        </div>
      )}
    </div>
  );
};

export default StatCard;
