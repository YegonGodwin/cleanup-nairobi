import React from 'react';
import { CheckCircle, Clock, MoreVertical } from 'lucide-react';

const TaskList = ({ stops }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Today's Tasks</h2>
      <ul className="space-y-4">
        {stops.map((stop) => (
          <li key={stop.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              {stop.status === 'Completed' ? (
                <CheckCircle size={20} className="text-green-500 mr-3" />
              ) : (
                <Clock size={20} className="text-yellow-500 mr-3" />
              )}
              <div>
                <p className="font-semibold text-gray-800">{stop.location}</p>
                <p className="text-sm text-gray-500">{stop.time}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  stop.status === 'Completed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {stop.status}
              </button>
              <button className="text-gray-400 hover:text-gray-600">
                <MoreVertical size={20} />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <button className="w-full mt-4 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition">
        View All Tasks
      </button>
    </div>
  );
};

export default TaskList;
