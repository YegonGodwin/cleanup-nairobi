import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const KeyMetrics = ({ title, value, trend, breakdown, sparklineData = [] }) => {
  const data = Array.isArray(sparklineData) && sparklineData.length > 0
    ? sparklineData
    : [{ value: 0 }, { value: 0 }];
  const trendText = trend || '0%';
  const isPositive = String(trendText).trim().startsWith('+');

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
      <p className="text-3xl font-bold mt-2">{value}</p>
      <div className="flex justify-between items-center mt-2">
        <span className={`text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {trendText}
        </span>
        <div className="w-1/2 h-10">
          <ResponsiveContainer>
            <LineChart data={data}>
              <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-2">{breakdown}</p>
    </div>
  );
};

export default KeyMetrics;
