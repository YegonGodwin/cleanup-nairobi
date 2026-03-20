
import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, Plus, RefreshCw, Users, Trash2 } from 'lucide-react';
import { eventsAPI, reportsAPI } from '../services/api';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  assigned: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const formatDate = (dateValue) => {
  if (!dateValue) return 'N/A';
  return new Date(dateValue).toLocaleString();
};

const getArrayData = (response, key) => {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.[key])) return response.data[key];
  if (Array.isArray(response?.[key])) return response[key];
  return [];
};

const Collections = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [joiningEventId, setJoiningEventId] = useState(null);
  const [pickupRequests, setPickupRequests] = useState([]);
  const [events, setEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState({
    location: '',
    wasteType: 'mixed',
    estimatedWeight: '',
    preferredDate: '',
    notes: '',
  });

  const fetchCollectionsData = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const [requestsResponse, eventsResponse, myEventsResponse] = await Promise.all([
        reportsAPI.getUserReports(),
        eventsAPI.getAll({ status: 'upcoming', limit: 25 }),
        eventsAPI.getMyEvents(),
      ]);

      setPickupRequests(getArrayData(requestsResponse, 'reports'));
      setEvents(getArrayData(eventsResponse, 'events'));
      setMyEvents(getArrayData(myEventsResponse, 'events'));
    } catch (error) {
      console.error('Failed to load collections workflow data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCollectionsData();
    const poll = setInterval(() => fetchCollectionsData(true), 30000);
    return () => clearInterval(poll);
  }, []);

  const joinedEventIds = useMemo(() => new Set(myEvents.map((event) => event.id)), [myEvents]);

  const filteredRequests = useMemo(() => {
    if (statusFilter === 'all') return pickupRequests;
    return pickupRequests.filter((request) => request.status === statusFilter);
  }, [pickupRequests, statusFilter]);

  const stats = useMemo(() => {
    const total = pickupRequests.length;
    const active = pickupRequests.filter((request) => ['pending', 'assigned', 'in_progress'].includes(request.status)).length;
    const completed = pickupRequests.filter((request) => request.status === 'completed').length;
    return {
      total,
      active,
      completed,
      joinedEvents: myEvents.length,
    };
  }, [pickupRequests, myEvents]);

  const handleJoinLeaveEvent = async (eventId, hasJoined) => {
    try {
      setJoiningEventId(eventId);
      if (hasJoined) {
        await eventsAPI.leave(eventId);
      } else {
        await eventsAPI.join(eventId);
      }
      await fetchCollectionsData(true);
    } catch (error) {
      console.error('Failed to update event participation:', error);
    } finally {
      setJoiningEventId(null);
    }
  };

  const handleCreatePickupRequest = async (event) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      const descriptionParts = [
        formState.notes || 'Pickup request submitted via Collections page.',
        formState.estimatedWeight ? `Estimated weight: ${formState.estimatedWeight} kg.` : null,
        formState.preferredDate ? `Preferred date: ${formState.preferredDate}.` : null,
      ].filter(Boolean);

      await reportsAPI.create({
        location: formState.location,
        description: descriptionParts.join(' '),
        waste_type: formState.wasteType,
      });

      setFormState({
        location: '',
        wasteType: 'mixed',
        estimatedWeight: '',
        preferredDate: '',
        notes: '',
      });
      setIsModalOpen(false);
      await fetchCollectionsData(true);
    } catch (error) {
      console.error('Failed to create pickup request:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-24 bg-gray-100 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Collections Workflow</h1>
          <p className="text-sm text-gray-600">Schedule waste pickup requests and join community cleanup collections.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchCollectionsData(true)}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
          >
            <Plus size={16} />
            New Pickup Request
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-4 border">
          <p className="text-sm text-gray-500">Total Requests</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border">
          <p className="text-sm text-gray-500">Active Pickups</p>
          <p className="text-2xl font-bold text-blue-700">{stats.active}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border">
          <p className="text-sm text-gray-500">Completed Pickups</p>
          <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border">
          <p className="text-sm text-gray-500">Joined Events</p>
          <p className="text-2xl font-bold text-purple-700">{stats.joinedEvents}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl shadow border">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Pickup Requests</h2>
              <p className="text-sm text-gray-500">Track the status of your submitted collection requests.</p>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 border rounded-lg text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3">Location</th>
                  <th className="text-left px-4 py-3">Waste Type</th>
                  <th className="text-left px-4 py-3">Created</th>
                  <th className="text-left px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      No pickup requests found for this filter.
                    </td>
                  </tr>
                )}
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="border-t">
                    <td className="px-4 py-3">{request.location || 'N/A'}</td>
                    <td className="px-4 py-3 capitalize">{request.waste_type || 'mixed'}</td>
                    <td className="px-4 py-3">{formatDate(request.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[request.status] || 'bg-gray-100 text-gray-700'}`}>
                        {(request.status || 'unknown').replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border p-4">
          <h2 className="text-lg font-semibold text-gray-900">Community Collections</h2>
          <p className="text-sm text-gray-500 mb-4">Join upcoming cleanup events in your area.</p>
          <div className="space-y-3 max-h-[560px] overflow-auto pr-1">
            {events.length === 0 && (
              <p className="text-sm text-gray-500">No upcoming events available.</p>
            )}
            {events.map((event) => {
              const hasJoined = joinedEventIds.has(event.id);
              return (
                <div key={event.id} className="border rounded-lg p-3">
                  <h3 className="font-semibold text-gray-900">{event.title}</h3>
                  <p className="text-sm text-gray-600">{event.location}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Calendar size={12} />{event.date || 'TBD'}</span>
                    <span className="flex items-center gap-1"><Clock size={12} />{event.start_time || 'TBD'}</span>
                    <span className="flex items-center gap-1"><Users size={12} />{event.max_participants || 0} spots</span>
                  </div>
                  <div className="mt-3">
                    <button
                      onClick={() => handleJoinLeaveEvent(event.id, hasJoined)}
                      disabled={joiningEventId === event.id}
                      className={`px-3 py-2 rounded-lg text-xs font-medium ${
                        hasJoined
                          ? 'bg-red-50 text-red-700 hover:bg-red-100'
                          : 'bg-green-50 text-green-700 hover:bg-green-100'
                      }`}
                    >
                      {joiningEventId === event.id ? 'Updating...' : hasJoined ? 'Leave Event' : 'Join Event'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Create Pickup Request</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                <Trash2 size={16} />
              </button>
            </div>
            <form onSubmit={handleCreatePickupRequest} className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Location</label>
                <input
                  value={formState.location}
                  onChange={(e) => setFormState((prev) => ({ ...prev, location: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                  placeholder="e.g. Kilimani, Nairobi"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Waste Type</label>
                  <select
                    value={formState.wasteType}
                    onChange={(e) => setFormState((prev) => ({ ...prev, wasteType: e.target.value }))}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="plastic">Plastic</option>
                    <option value="organic">Organic</option>
                    <option value="metal">Metal</option>
                    <option value="glass">Glass</option>
                    <option value="paper">Paper</option>
                    <option value="electronic">Electronic</option>
                    <option value="hazardous">Hazardous</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Estimated Weight (kg)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formState.estimatedWeight}
                    onChange={(e) => setFormState((prev) => ({ ...prev, estimatedWeight: e.target.value }))}
                    className="w-full p-2 border rounded-lg"
                    placeholder="e.g. 5"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Preferred Date (optional)</label>
                <input
                  type="date"
                  value={formState.preferredDate}
                  onChange={(e) => setFormState((prev) => ({ ...prev, preferredDate: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formState.notes}
                  onChange={(e) => setFormState((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                  rows={3}
                  placeholder="Add pickup instructions, landmarks, or special handling details."
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Collections;
