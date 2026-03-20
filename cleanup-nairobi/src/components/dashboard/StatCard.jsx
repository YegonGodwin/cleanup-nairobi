
import React from 'react';

const StatCard = ({ icon, title, value, change }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center">
        <div className="bg-green-100 p-3 rounded-full">
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-gray-500">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
      {change && <p className="text-sm text-gray-500 mt-2">{change}</p>}
    </div>
  );
};

export default StatCard;
