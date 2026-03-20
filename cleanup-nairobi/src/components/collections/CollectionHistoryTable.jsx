
import React, { useState } from 'react';
import { FaEdit, FaTrash, FaCheck } from 'react-icons/fa';

const CollectionHistoryTable = ({ collections, onEdit, onDelete, onMarkAsComplete }) => {
  const [filter, setFilter] = useState('All');
  const [sort, setSort] = useState('date-desc');

  const filteredCollections = collections.filter(c => filter === 'All' || c.status === filter);

  const sortedCollections = [...filteredCollections].sort((a, b) => {
    if (sort === 'date-desc') return new Date(b.date) - new Date(a.date);
    if (sort === 'date-asc') return new Date(a.date) - new Date(b.date);
    if (sort === 'amount-desc') return b.amount - a.amount;
    if (sort === 'amount-asc') return a.amount - b.amount;
    return 0;
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Collection History</h2>
        <div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="mr-2 p-2 border rounded">
            <option value="All">All</option>
            <option value="Completed">Completed</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Missed">Missed</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="p-2 border rounded">
            <option value="date-desc">Date (Newest)</option>
            <option value="date-asc">Date (Oldest)</option>
            <option value="amount-desc">Amount (High-Low)</option>
            <option value="amount-asc">Amount (Low-High)</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="p-2">Date</th>
              <th className="p-2">Waste Type</th>
              <th className="p-2">Amount (kg)</th>
              <th className="p-2">Status</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedCollections.map(collection => (
              <tr key={collection.id} className="border-b">
                <td className="p-2">{collection.date}</td>
                <td className="p-2">{collection.wasteType}</td>
                <td className="p-2">{collection.amount}</td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded-full text-sm ${collection.status === 'Completed' ? 'bg-green-200 text-green-800' : collection.status === 'Scheduled' ? 'bg-blue-200 text-blue-800' : 'bg-red-200 text-red-800'}`}>
                    {collection.status}
                  </span>
                </td>
                <td className="p-2 flex items-center">
                  {collection.status === 'Scheduled' && <button onClick={() => onMarkAsComplete(collection.id)} className="text-green-500 mr-2"><FaCheck /></button>}
                  <button onClick={() => onEdit(collection)} className="text-blue-500 mr-2"><FaEdit /></button>
                  <button onClick={() => onDelete(collection.id)} className="text-red-500"><FaTrash /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CollectionHistoryTable;
