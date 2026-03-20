
import React from 'react';
import { Truck, MoreVertical } from 'lucide-react';
import { Link } from 'react-router-dom';

const VehicleCard = ({ vehicle, onEdit }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-200 text-green-800';
      case 'Maintenance':
        return 'bg-yellow-200 text-yellow-800';
      case 'Inactive':
        return 'bg-red-200 text-red-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          <Truck size={40} className="text-gray-500 mr-4" />
          <div>
            <h3 className="text-xl font-bold">{vehicle.registrationNumber}</h3>
            <p className="text-sm text-gray-500">{vehicle.type}</p>
          </div>
        </div>
        <button className="p-2 rounded-full hover:bg-gray-200">
          <MoreVertical size={20} />
        </button>
      </div>
      <div className="mt-4">
        <span className={`px-2 py-1 rounded-full text-sm ${getStatusColor(vehicle.status)}`}>
          {vehicle.status}
        </span>
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <p>
          <strong>Capacity:</strong> {vehicle.capacity} kg
        </p>
        <p>
          <strong>Collections Today:</strong> {vehicle.collectionsToday}
        </p>
        <p>
          <strong>Last Updated:</strong> {vehicle.lastUpdated}
        </p>
        <p>
          <strong>Location:</strong>{' '}
          {vehicle.status === 'Active' ? (
            <a href="#" className="text-blue-500 hover:underline">
              {vehicle.location}
            </a>
          ) : (
            'N/A'
          )}
        </p>
      </div>
      <div className="mt-4 flex justify-end space-x-2">
        <Link to={`/admin/vehicles/${vehicle.id}`} className="text-sm text-gray-600 hover:text-gray-900">
          View
        </Link>
        <button onClick={onEdit} className="text-sm text-blue-600 hover:text-blue-900">Edit</button>
        <button className="text-sm text-yellow-600 hover:text-yellow-900">Service Record</button>
      </div>
    </div>
  );
};

export default VehicleCard;
