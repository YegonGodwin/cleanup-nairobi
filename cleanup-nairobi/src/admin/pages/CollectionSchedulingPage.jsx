import React, { useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { MapContainer, TileLayer, Polyline, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';

const localizer = momentLocalizer(moment);

const events = [
  {
    id: 1,
    title: 'Westlands Collection',
    start: new Date(2025, 10, 7, 8, 0, 0),
    end: new Date(2025, 10, 7, 10, 0, 0),
    status: 'Completed',
    zone: 'Westlands',
    vehicle: 'KBZ 123A',
    operator: 'John Doe',
  },
  {
    id: 2,
    title: 'CBD Collection',
    start: new Date(2025, 10, 7, 11, 0, 0),
    end: new Date(2025, 10, 7, 13, 0, 0),
    status: 'In Progress',
    zone: 'CBD',
    vehicle: 'KCA 456B',
    operator: 'Jane Smith',
  },
  {
    id: 3,
    title: 'Eastleigh Collection',
    start: new Date(2025, 10, 8, 9, 0, 0),
    end: new Date(2025, 10, 8, 11, 0, 0),
    status: 'Scheduled',
    zone: 'Eastleigh',
    vehicle: 'KDA 789C',
    operator: 'Peter Jones',
  },
  {
    id: 4,
    title: 'Karen Collection',
    start: new Date(2025, 10, 8, 14, 0, 0),
    end: new Date(2025, 10, 8, 16, 0, 0),
    status: 'Cancelled',
    zone: 'Karen',
    vehicle: 'KDB 101D',
    operator: 'Susan Williams',
  },
];

const CollectionSchedulingPage = () => {
  const [view, setView] = useState('calendar');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const eventStyleGetter = (event, start, end, isSelected) => {
    let backgroundColor;
    switch (event.status) {
      case 'Completed':
        backgroundColor = '#22c55e'; // green-500
        break;
      case 'In Progress':
        backgroundColor = '#3b82f6'; // blue-500
        break;
      case 'Scheduled':
        backgroundColor = '#f59e0b'; // amber-500
        break;
      case 'Cancelled':
        backgroundColor = '#ef4444'; // red-500
        break;
      default:
        backgroundColor = '#6b7280'; // gray-500
        break;
    }
    const style = {
      backgroundColor,
      borderRadius: '5px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block'
    };
    return {
      style: style
    };
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Collection Scheduling</h1>
        <div className="flex space-x-2">
          <button 
            onClick={() => setView('calendar')} 
            className={`px-4 py-2 rounded-md ${view === 'calendar' ? 'bg-emerald-500 text-white' : 'bg-gray-200'}`}>
            Calendar
          </button>
          <button 
            onClick={() => setView('list')} 
            className={`px-4 py-2 rounded-md ${view === 'list' ? 'bg-emerald-500 text-white' : 'bg-gray-200'}`}>
            List
          </button>
          <button 
            onClick={() => setView('map')} 
            className={`px-4 py-2 rounded-md ${view === 'map' ? 'bg-emerald-500 text-white' : 'bg-gray-200'}`}>
            Map
          </button>
        </div>
      </div>

      {view === 'calendar' && (
        <div className="bg-white p-6 rounded-lg shadow-md" style={{ height: '70vh' }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            eventPropGetter={eventStyleGetter}
          />
        </div>
      )}

      {view === 'list' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          {/* Filters */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex space-x-4">
              <input type="date" className="border border-gray-300 rounded-md p-2" />
              <select className="border border-gray-300 rounded-md p-2">
                <option>All Zones</option>
                <option>Westlands</option>
                <option>CBD</option>
                <option>Eastleigh</option>
                <option>Karen</option>
              </select>
              <select className="border border-gray-300 rounded-md p-2">
                <option>All Vehicles</option>
                <option>KBZ 123A</option>
                <option>KCA 456B</option>
                <option>KDA 789C</option>
                <option>KDB 101D</option>
              </select>
              <select className="border border-gray-300 rounded-md p-2">
                <option>All Statuses</option>
                <option>Completed</option>
                <option>In Progress</option>
                <option>Scheduled</option>
                <option>Cancelled</option>
              </select>
            </div>
            <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300">Clear Filters</button>
          </div>

          {/* Table */}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operator</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.map((event) => (
                <tr key={event.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{moment(event.start).format('MMM D, YYYY')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{moment(event.start).format('h:mm A')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.zone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.vehicle}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.operator}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      event.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      event.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                      event.status === 'Scheduled' ? 'bg-yellow-100 text-yellow-800' :
                      event.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {event.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link to={`/admin/collections/${event.id}`} className="text-blue-600 hover:text-blue-900 mr-3">View</Link>
                    <button className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                    <button className="text-red-600 hover:text-red-900">Cancel</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'map' && (
        <div className="bg-white p-6 rounded-lg shadow-md" style={{ height: '70vh' }}>
          <MapContainer center={[-1.286389, 36.817223]} zoom={12} style={{ height: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {events.map((event) => (
              <Polyline
                key={event.id}
                positions={[
                  [-1.286389, 36.817223],
                  [-1.292066, 36.821945],
                ]}
                color={
                  event.status === 'Completed' ? '#22c55e' :
                  event.status === 'In Progress' ? '#3b82f6' :
                  event.status === 'Scheduled' ? '#f59e0b' :
                  '#ef4444'
                }
              >
                <Popup>
                  <b>{event.title}</b><br />
                  Status: {event.status}<br />
                  Vehicle: {event.vehicle}
                </Popup>
              </Polyline>
            ))}
          </MapContainer>
        </div>
      )}

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-10 right-10 bg-green-500 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-3xl hover:bg-green-600 transition-transform transform hover:scale-110">
        +
      </button>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-3xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Schedule New Collection</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 text-xl">
                &times;
              </button>
            </div>
            <form>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="zone" className="block text-sm font-medium text-gray-700">Zone</label>
                  <select id="zone" name="zone" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                    <option>Select Zone</option>
                    <option>Westlands</option>
                    <option>CBD</option>
                    <option>Eastleigh</option>
                    <option>Karen</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="vehicle" className="block text-sm font-medium text-gray-700">Vehicle</label>
                  <select id="vehicle" name="vehicle" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                    <option>Select Vehicle</option>
                    <option>KBZ 123A</option>
                    <option>KCA 456B</option>
                    <option>KDA 789C</option>
                    <option>KDB 101D</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="operator" className="block text-sm font-medium text-gray-700">Operator</label>
                  <select id="operator" name="operator" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                    <option>Select Operator</option>
                    <option>John Doe</option>
                    <option>Jane Smith</option>
                    <option>Peter Jones</option>
                    <option>Susan Williams</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
                  <input type="date" id="date" name="date" className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md" />
                </div>
                <div>
                  <label htmlFor="time" className="block text-sm font-medium text-gray-700">Time</label>
                  <input type="time" id="time" name="time" className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md" />
                </div>
                <div>
                  <label htmlFor="volume" className="block text-sm font-medium text-gray-700">Estimated Volume (kg)</label>
                  <input type="number" id="volume" name="volume" className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md" />
                </div>
                <div className="col-span-2">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea id="notes" name="notes" rows="3" className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"></textarea>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)} className="mr-3 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300">Cancel</button>
                <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">Schedule Collection</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionSchedulingPage;
