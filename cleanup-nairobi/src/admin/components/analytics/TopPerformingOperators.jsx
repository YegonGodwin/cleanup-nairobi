import React from 'react';

const TopPerformingOperators = ({ operators = [] }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Top Performing Operators</h3>
      {operators.length === 0 ? (
        <p className="text-sm text-gray-500">No operator metrics available.</p>
      ) : (
        <div className="space-y-3">
          {operators.map((operator, idx) => (
            <div key={operator.name} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800">{idx + 1}. {operator.name}</span>
              <span className="text-xs text-blue-600 font-semibold">{operator.score} pts</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopPerformingOperators;
