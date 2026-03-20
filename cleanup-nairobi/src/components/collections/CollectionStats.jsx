
import React from 'react';
import StatCard from '../dashboard/StatCard';
import { FaBox, FaCalendarCheck, FaHistory } from 'react-icons/fa';

const CollectionStats = ({ collections }) => {
  const totalCollections = collections.length;
  const upcomingCollections = collections.filter(c => c.status === 'Scheduled').length;
  const recentActivity = collections.slice(0, 3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
      <StatCard icon={<FaBox className="text-green-500" />} title="Total Collections" value={totalCollections} />
      <StatCard icon={<FaCalendarCheck className="text-blue-500" />} title="Upcoming Collections" value={upcomingCollections} />
      <StatCard icon={<FaHistory className="text-yellow-500" />} title="Recent Activity" value={`${recentActivity.length} recent`} />
    </div>
  );
};

export default CollectionStats;
