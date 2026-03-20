
import React from 'react';

const NewsFeed = () => {
  const newsItems = [
    {
      title: 'Community Cleanup Day',
      description: 'Join us this Saturday for a community-wide cleanup event.',
      date: 'Oct 26, 2023',
    },
    {
      title: 'New Recycling Bins Available',
      description: 'New recycling bins have been installed in the downtown area.',
      date: 'Oct 24, 2023',
    },
    {
      title: 'Waste Reduction Workshop',
      description: 'Learn how to reduce your household waste in our online workshop.',
      date: 'Oct 22, 2023',
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Community News & Events</h2>
      <div>
        {newsItems.map((item, index) => (
          <div key={index} className="mb-4 pb-4 border-b last:border-b-0">
            <h3 className="font-semibold">{item.title}</h3>
            <p className="text-gray-600">{item.description}</p>
            <p className="text-sm text-gray-400 mt-1">{item.date}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewsFeed;
