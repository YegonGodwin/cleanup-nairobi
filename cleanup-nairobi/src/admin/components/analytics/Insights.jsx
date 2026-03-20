import React from 'react';

const Insights = ({ insights = [] }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Insights</h3>
      {insights.length === 0 ? (
        <p className="text-sm text-gray-500">No insights generated yet.</p>
      ) : (
        <ul className="space-y-2">
          {insights.map((insight, idx) => (
            <li key={`${insight}-${idx}`} className="text-sm text-gray-700">
              {insight}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Insights;
