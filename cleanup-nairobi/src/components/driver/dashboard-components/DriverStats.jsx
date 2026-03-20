import React from 'react';

const DriverStats = ({ summary }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Daily Summary</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-50 p-4 rounded-lg">
          <p className="text-sm text-emerald-800">Collections</p>
          <p className="text-2xl font-bold text-emerald-900">{summary.collections}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-yellow-800">Pending</p>
          <p className="text-2xl font-bold text-yellow-900">{summary.pending}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">Distance</p>
          <p className="text-2xl font-bold text-blue-900">{summary.distance}</p>
        </div>
        <div className="bg-indigo-50 p-4 rounded-lg">
          <p className="text-sm text-indigo-800">Time</p>
          <p className="text-2xl font-bold text-indigo-900">{summary.time}</p>
        </div>
      </div>
    </div>
  );
};

export default DriverStats;
