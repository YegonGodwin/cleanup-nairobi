
import React from 'react';

const QuickActionButton = ({ icon, label }) => {
  return (
    <button className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col items-center justify-center">
      <div className="bg-green-100 p-4 rounded-full mb-4">
        {icon}
      </div>
      <span className="font-semibold">{label}</span>
    </button>
  );
};

export default QuickActionButton;
