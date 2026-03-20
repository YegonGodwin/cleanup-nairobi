
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', waste: 4000 },
  { name: 'Feb', waste: 3000 },
  { name: 'Mar', waste: 2000 },
  { name: 'Apr', waste: 2780 },
  { name: 'May', waste: 1890 },
  { name: 'Jun', waste: 2390 },
  { name: 'Jul', waste: 3490 },
];

const MonthlyTrendChart = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Monthly Waste Trends</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="waste" stroke="#8884d8" activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlyTrendChart;
