import React, { useState, useEffect } from 'react';
import { LayoutGrid, List, Map, Plus, MoreVertical, Trash2, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';
import VehicleCard from '../components/VehicleCard';
import MapView from '../components/MapView';
import VehicleForm from '../components/VehicleForm';
import { vehiclesAPI } from '../../services/api';
import 'leaflet/dist/leaflet.css';

const VehiclesManagementPage = () => {
  const [view, setView] = useState('grid'); // 'grid', 'list', or 'map'
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await vehiclesAPI.getAll();
      const mappedVehicles = response.data.map(v => ({
        id: v.id,
        registrationNumber: v.registration_number,
        type: v.type,
        capacity: v.capacity,
        status: v.status,
        location: v.location || 'N/A',
        collectionsToday: v.collections_today || 0,
        lastUpdated: v.updated_at ? new Date(v.updated_at).toLocaleString() : 'N/A',
        position: (v.current_latitude && v.current_longitude) 
          ? [v.current_latitude, v.current_longitude] 
          : null,
        purchaseDate: v.purchase_date,
        notes: v.notes
      }));
      setVehicles(mappedVehicles);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch vehicles", err);
      setError("Failed to load vehicles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleOpenForm = (vehicle = null) => {
    setEditingVehicle(vehicle);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingVehicle(null);
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editingVehicle) {
        await vehiclesAPI.update(editingVehicle.id, formData);
      } else {
        await vehiclesAPI.create(formData);
      }
      fetchVehicles();
      handleCloseForm();
    } catch (err) {
      console.error("Failed to save vehicle", err);
      // Ideally show a toast here
    }
  };

  const handleDeleteVehicle = async (id) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await vehiclesAPI.delete(id);
        fetchVehicles();
      } catch (err) {
        console.error("Failed to delete vehicle", err);
      }
    }
  };

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

  const vehicleMarkers = vehicles
    .filter((v) => v.status === 'Active' && v.position)
    .map((v) => ({
      position: v.position,
      popup: `<b>${v.registrationNumber}</b><br>${v.location}`,
    }));

  if (loading) return <div className="p-6">Loading vehicles...</div>;

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Vehicles Management</h1>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center bg-gray-200 rounded-md p-1">
            <button
              onClick={() => setView('grid')}
              className={`px-3 py-1 rounded-md ${view === 'grid' ? 'bg-white shadow' : ''}`}
            >
              <LayoutGrid size={20} />
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1 rounded-md ${view === 'list' ? 'bg-white shadow' : ''}`}
            >
              <List size={20} />
            </button>
            <button
              onClick={() => setView('map')}
              className={`px-3 py-1 rounded-md ${view === 'map' ? 'bg-white shadow' : ''}`}
            >
              <Map size={20} />
            </button>
          </div>
          <button
            onClick={() => handleOpenForm()}
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 flex items-center"
          >
            <Plus size={20} className="mr-2" />
            Add Vehicle
          </button>
        </div>
      </div>
      
      {error && <div className="bg-red-100 text-red-800 p-4 rounded mb-4">{error}</div>}

      <div>
        {view === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <VehicleCard 
                key={vehicle.id} 
                vehicle={vehicle} 
                onEdit={() => handleOpenForm(vehicle)}
              />
            ))}
          </div>
        )}
        {view === 'list' && (
          <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 text-left">Registration Number</th>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Capacity (kg)</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Current Location</th>
                  <th className="p-3 text-left">Collections Today</th>
                  <th className="p-3 text-left">Last Updated</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="border-b">
                    <td className="p-3 font-medium">{vehicle.registrationNumber}</td>
                    <td className="p-3">{vehicle.type}</td>
                    <td className="p-3">{vehicle.capacity}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-sm ${getStatusColor(vehicle.status)}`}>
                        {vehicle.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {vehicle.status === 'Active' ? (
                        <span className="text-blue-500">
                          {vehicle.location}
                        </span>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="p-3">{vehicle.collectionsToday}</td>
                    <td className="p-3">{vehicle.lastUpdated}</td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleOpenForm(vehicle)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteVehicle(vehicle.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                        <Link to={`/admin/vehicles/${vehicle.id}`} className="p-2 rounded-full hover:bg-gray-200">
                          <MoreVertical size={20} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {view === 'map' && (
          <div className="h-[600px] bg-white p-6 rounded-lg shadow-md">
            <MapView markers={vehicleMarkers} />
          </div>
        )}
      </div>

      {isFormOpen && (
        <VehicleForm
          vehicle={editingVehicle}
          onSubmit={handleFormSubmit}
          onCancel={handleCloseForm}
        />
      )}
    </div>
  );
};

export default VehiclesManagementPage;