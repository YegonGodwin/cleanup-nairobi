
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';

const VehicleDetailPage = () => {
  const { id } = useParams();

  // Dummy data for now
  const vehicle = {
    id: id,
    registrationNumber: 'KDA 123A',
    type: 'Truck',
    capacity: 3000,
    status: 'Active',
    purchaseDate: '2022-01-15',
    odometer: 45000,
    photoUrl: 'https://via.placeholder.com/400x300.png?text=Vehicle+KDA+123A',
    location: 'Kibera',
    operator: 'John Doe',
    currentCollection: 'Collection #54321',
    collectionsToday: 4,
    wasteCollectedToday: 12000,
    distanceTraveled: 80,
    hoursOperated: 6,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Link to="/admin/vehicles" className="flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft size={20} className="mr-2" />
          Back to Vehicles
        </Link>
        <div className="flex space-x-4">
          <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center">
            <Edit size={20} className="mr-2" />
            Edit
          </button>
          <button className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 flex items-center">
            <Trash2 size={20} className="mr-2" />
            Delete
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mr-4">{vehicle.registrationNumber}</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            vehicle.status === 'Active' ? 'bg-green-200 text-green-800' :
            vehicle.status === 'Maintenance' ? 'bg-yellow-200 text-yellow-800' :
            'bg-red-200 text-red-800'
          }`}>
            {vehicle.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Vehicle Info</h3>
              <p><strong>Type:</strong> {vehicle.type}</p>
              <p><strong>Capacity:</strong> {vehicle.capacity} kg</p>
              <p><strong>Purchase Date:</strong> {vehicle.purchaseDate}</p>
              <p><strong>Odometer:</strong> {vehicle.odometer} km</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Current Status</h3>
              <p><strong>Location:</strong> {vehicle.location}</p>
              <p><strong>Operator:</strong> {vehicle.operator}</p>
              <p><strong>Current Collection:</strong> {vehicle.currentCollection}</p>
            </div>
          </div>

          {/* Middle Column */}
          <div className="md:col-span-1">
            <img src={vehicle.photoUrl} alt={vehicle.registrationNumber} className="rounded-lg w-full" />
          </div>

          {/* Right Column */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Today's Activity</h3>
              <p><strong>Collections:</strong> {vehicle.collectionsToday}</p>
              <p><strong>Waste Collected:</strong> {vehicle.wasteCollectedToday} kg</p>
              <p><strong>Distance Traveled:</strong> {vehicle.distanceTraveled} km</p>
              <p><strong>Hours Operated:</strong> {vehicle.hoursOperated} hours</p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4">Maintenance Records</h3>
          {/* Maintenance records table will go here */}
        </div>

        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4">Collection History (Last 30 days)</h3>
          {/* Collection history chart will go here */}
        </div>
      </div>
    </div>
  );
};

export default VehicleDetailPage;
