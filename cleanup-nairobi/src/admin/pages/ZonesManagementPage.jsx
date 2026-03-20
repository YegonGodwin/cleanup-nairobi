import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin, Plus, Edit2, Trash2, Search, BarChart2,
  CheckCircle, Clock, AlertTriangle, Truck, X, Save
} from 'lucide-react';
import { reportsAPI, driversAPI, vehiclesAPI } from '../../services/api';
import MapView from '../components/MapView';

// Nairobi zones with coordinates
const DEFAULT_ZONES = [
  { id: 'westlands',    name: 'Westlands',       lat: -1.2676, lng: 36.8108, color: '#10b981' },
  { id: 'cbd',          name: 'CBD',              lat: -1.2833, lng: 36.8167, color: '#3b82f6' },
  { id: 'eastlands',    name: 'Eastlands',        lat: -1.2800, lng: 36.8600, color: '#f59e0b' },
  { id: 'southb',       name: 'South B/C',        lat: -1.3100, lng: 36.8300, color: '#ef4444' },
  { id: 'karen',        name: 'Karen',            lat: -1.3200, lng: 36.7100, color: '#8b5cf6' },
  { id: 'kasarani',     name: 'Kasarani',         lat: -1.2200, lng: 36.8900, color: '#ec4899' },
  { id: 'embakasi',     name: 'Embakasi',         lat: -1.3200, lng: 36.9000, color: '#14b8a6' },
  { id: 'langata',      name: 'Lang\'ata',        lat: -1.3500, lng: 36.7500, color: '#f97316' },
];

const zoneFromLocation = (location) => {
  if (!location || typeof location !== 'string') return 'Unspecified';
  const parts = location.split(',').map((p) => p.trim()).filter(Boolean);
  return parts[0] || 'Unspecified';
};

const STATUS_COLORS = {
  pending:     'bg-yellow-100 text-yellow-800',
  assigned:    'bg-blue-100 text-blue-800',
  in_progress: 'bg-indigo-100 text-indigo-800',
  completed:   'bg-green-100 text-green-800',
  rejected:    'bg-red-100 text-red-800',
};

// ── Zone Form Modal ──────────────────────────────────────────────────────────
const ZoneFormModal = ({ zone, onSave, onClose }) => {
  const [form, setForm] = useState(
    zone || { name: '', lat: '', lng: '', color: '#10b981', description: '' }
  );

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave({ ...form, id: form.id || form.name.toLowerCase().replace(/\s+/g, '-') });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">{zone ? 'Edit Zone' : 'Add Zone'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zone Name *</label>
            <input name="name" value={form.name} onChange={handleChange} required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="e.g. Westlands" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
              <input name="lat" type="number" step="any" value={form.lat} onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="-1.2676" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
              <input name="lng" type="number" step="any" value={form.lng} onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="36.8108" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={2}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="Brief description of this zone..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <div className="flex items-center gap-3">
              <input type="color" name="color" value={form.color} onChange={handleChange}
                className="h-9 w-16 rounded border border-gray-300 cursor-pointer" />
              <span className="text-sm text-gray-500">{form.color}</span>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
            <button type="submit"
              className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700 flex items-center gap-2">
              <Save size={14} /> Save Zone
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Zone Detail Panel ────────────────────────────────────────────────────────
const ZoneDetailPanel = ({ zone, reports, drivers, vehicles, onClose }) => {
  const zoneReports = reports.filter((r) => zoneFromLocation(r.location) === zone.name);
  const total = zoneReports.length;
  const completed = zoneReports.filter((r) => r.status === 'completed').length;
  const pending = zoneReports.filter((r) => r.status === 'pending').length;
  const inProgress = zoneReports.filter((r) => ['assigned', 'in_progress'].includes(r.status)).length;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const wasteBreakdown = zoneReports.reduce((acc, r) => {
    const key = r.waste_type || 'other';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const recentReports = [...zoneReports]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-end md:items-center justify-center z-50">
      <div className="bg-white rounded-t-2xl md:rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="w-4 h-4 rounded-full" style={{ backgroundColor: zone.color }} />
            <h2 className="text-lg font-semibold text-gray-800">{zone.name}</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Reports', value: total, icon: <BarChart2 size={16} />, color: 'text-blue-600 bg-blue-50' },
              { label: 'Completed', value: completed, icon: <CheckCircle size={16} />, color: 'text-green-600 bg-green-50' },
              { label: 'Pending', value: pending, icon: <Clock size={16} />, color: 'text-yellow-600 bg-yellow-50' },
              { label: 'In Progress', value: inProgress, icon: <Truck size={16} />, color: 'text-indigo-600 bg-indigo-50' },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50 rounded-lg p-3 text-center">
                <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full mb-2 ${s.color}`}>{s.icon}</div>
                <div className="text-xl font-bold text-gray-800">{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Completion rate bar */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 font-medium">Completion Rate</span>
              <span className="font-semibold text-emerald-600">{rate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-emerald-500 h-2.5 rounded-full transition-all" style={{ width: `${rate}%` }} />
            </div>
          </div>

          {/* Waste type breakdown */}
          {Object.keys(wasteBreakdown).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Waste Type Breakdown</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(wasteBreakdown).map(([type, count]) => (
                  <span key={type} className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-700 capitalize">
                    {type}: <strong>{count}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recent reports */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Reports</h3>
            {recentReports.length === 0 ? (
              <p className="text-sm text-gray-400">No reports in this zone yet.</p>
            ) : (
              <div className="space-y-2">
                {recentReports.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                    <div>
                      <p className="font-medium text-gray-800 truncate max-w-xs">{r.description || r.location}</p>
                      <p className="text-xs text-gray-400 mt-0.5 capitalize">{r.waste_type || 'unknown'} · {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-600'}`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ────────────────────────────────────────────────────────────────
const ZonesManagementPage = () => {
  const [reports, setReports] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zones, setZones] = useState(DEFAULT_ZONES);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('grid'); // 'grid' | 'map'
  const [formOpen, setFormOpen] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [detailZone, setDetailZone] = useState(null);
  const [sortBy, setSortBy] = useState('reports'); // 'reports' | 'name' | 'rate'

  useEffect(() => {
    const load = async () => {
      try {
        const [rRes, dRes, vRes] = await Promise.all([
          reportsAPI.getAll({ limit: 500 }),
          driversAPI.getAll(),
          vehiclesAPI.getAll(),
        ]);
        setReports(Array.isArray(rRes?.data) ? rRes.data : rRes?.reports || []);
        setDrivers(Array.isArray(dRes?.data) ? dRes.data : []);
        setVehicles(Array.isArray(vRes?.data) ? vRes.data : []);
      } catch (err) {
        console.error('Failed to load zones data:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Enrich zones with live report stats
  const enrichedZones = useMemo(() => {
    return zones.map((zone) => {
      const zoneReports = reports.filter((r) => zoneFromLocation(r.location) === zone.name);
      const total = zoneReports.length;
      const completed = zoneReports.filter((r) => r.status === 'completed').length;
      const pending = zoneReports.filter((r) => r.status === 'pending').length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { ...zone, total, completed, pending, rate };
    });
  }, [zones, reports]);

  // Zones derived from actual report locations (not in the managed list)
  const discoveredZones = useMemo(() => {
    const managed = new Set(zones.map((z) => z.name.toLowerCase()));
    const counts = {};
    reports.forEach((r) => {
      const name = zoneFromLocation(r.location);
      if (name !== 'Unspecified' && !managed.has(name.toLowerCase())) {
        counts[name] = (counts[name] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [zones, reports]);

  const filteredZones = useMemo(() => {
    let list = enrichedZones.filter((z) =>
      z.name.toLowerCase().includes(search.toLowerCase())
    );
    if (sortBy === 'reports') list = [...list].sort((a, b) => b.total - a.total);
    else if (sortBy === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === 'rate') list = [...list].sort((a, b) => b.rate - a.rate);
    return list;
  }, [enrichedZones, search, sortBy]);

  const mapMarkers = useMemo(() =>
    enrichedZones
      .filter((z) => z.lat && z.lng)
      .map((z) => ({
        position: [Number(z.lat), Number(z.lng)],
        popup: `<b>${z.name}</b><br>${z.total} reports · ${z.rate}% completed`,
      })),
    [enrichedZones]
  );

  const totalReports = enrichedZones.reduce((s, z) => s + z.total, 0);
  const totalCompleted = enrichedZones.reduce((s, z) => s + z.completed, 0);
  const totalPending = enrichedZones.reduce((s, z) => s + z.pending, 0);
  const avgRate = enrichedZones.length > 0
    ? Math.round(enrichedZones.reduce((s, z) => s + z.rate, 0) / enrichedZones.length)
    : 0;

  const handleSaveZone = (zoneData) => {
    setZones((prev) => {
      const exists = prev.find((z) => z.id === zoneData.id);
      return exists ? prev.map((z) => (z.id === zoneData.id ? zoneData : z)) : [...prev, zoneData];
    });
    setFormOpen(false);
    setEditingZone(null);
  };

  const handleDeleteZone = (id) => {
    if (window.confirm('Remove this zone from the managed list?')) {
      setZones((prev) => prev.filter((z) => z.id !== id));
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Zones Management</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor and manage waste collection zones across Nairobi</p>
        </div>
        <button
          onClick={() => { setEditingZone(null); setFormOpen(true); }}
          className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 flex items-center gap-2 text-sm"
        >
          <Plus size={16} /> Add Zone
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Zones', value: zones.length, icon: <MapPin size={20} />, bg: 'bg-emerald-50', color: 'text-emerald-600' },
          { label: 'Total Reports', value: loading ? '…' : totalReports, icon: <BarChart2 size={20} />, bg: 'bg-blue-50', color: 'text-blue-600' },
          { label: 'Pending Reports', value: loading ? '…' : totalPending, icon: <AlertTriangle size={20} />, bg: 'bg-yellow-50', color: 'text-yellow-600' },
          { label: 'Avg Completion', value: loading ? '…' : `${avgRate}%`, icon: <CheckCircle size={20} />, bg: 'bg-green-50', color: 'text-green-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
            <div className={`p-3 rounded-full ${s.bg} ${s.color}`}>{s.icon}</div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search zones..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>
        <select
          value={sortBy} onChange={(e) => setSortBy(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          <option value="reports">Sort: Most Reports</option>
          <option value="rate">Sort: Completion Rate</option>
          <option value="name">Sort: Name</option>
        </select>
        <div className="flex items-center bg-gray-200 rounded-md p-1">
          <button onClick={() => setView('grid')} className={`px-3 py-1 rounded text-sm ${view === 'grid' ? 'bg-white shadow' : ''}`}>Grid</button>
          <button onClick={() => setView('map')} className={`px-3 py-1 rounded text-sm ${view === 'map' ? 'bg-white shadow' : ''}`}>Map</button>
        </div>
      </div>

      {/* Map view */}
      {view === 'map' && (
        <div className="bg-white rounded-lg shadow mb-6 overflow-hidden" style={{ height: 480 }}>
          <MapView markers={mapMarkers} />
        </div>
      )}

      {/* Grid view */}
      {view === 'grid' && (
        loading ? (
          <div className="text-center py-16 text-gray-400">Loading zone data...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-8">
            {filteredZones.map((zone) => (
              <div key={zone.id} className="bg-white rounded-xl shadow hover:shadow-md transition-shadow p-5 flex flex-col gap-3">
                {/* Zone header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: zone.color }} />
                    <h3 className="font-semibold text-gray-800 truncate">{zone.name}</h3>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingZone(zone); setFormOpen(true); }}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDeleteZone(zone.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-50 rounded-lg py-2">
                    <p className="text-lg font-bold text-gray-800">{zone.total}</p>
                    <p className="text-xs text-gray-400">Reports</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg py-2">
                    <p className="text-lg font-bold text-yellow-700">{zone.pending}</p>
                    <p className="text-xs text-yellow-500">Pending</p>
                  </div>
                  <div className="bg-green-50 rounded-lg py-2">
                    <p className="text-lg font-bold text-green-700">{zone.completed}</p>
                    <p className="text-xs text-green-500">Done</p>
                  </div>
                </div>

                {/* Completion bar */}
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Completion</span>
                    <span className="font-semibold text-emerald-600">{zone.rate}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{ width: `${zone.rate}%`, backgroundColor: zone.color }}
                    />
                  </div>
                </div>

                {/* Coords */}
                {zone.lat && zone.lng && (
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <MapPin size={11} /> {Number(zone.lat).toFixed(4)}, {Number(zone.lng).toFixed(4)}
                  </p>
                )}

                <button
                  onClick={() => setDetailZone(zone)}
                  className="mt-auto text-xs text-emerald-600 hover:text-emerald-800 font-medium text-left"
                >
                  View details →
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {/* Discovered zones (from reports, not yet managed) */}
      {discoveredZones.length > 0 && (
        <div className="bg-white rounded-xl shadow p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <AlertTriangle size={15} className="text-amber-500" />
            Unmanaged Locations ({discoveredZones.length})
            <span className="text-xs font-normal text-gray-400">— locations found in reports but not yet added as zones</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {discoveredZones.map(({ name, count }) => (
              <button
                key={name}
                onClick={() => {
                  setEditingZone({ name, lat: '', lng: '', color: '#10b981', description: '' });
                  setFormOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-xs text-amber-800 hover:bg-amber-100 transition-colors"
              >
                <Plus size={11} /> {name} ({count})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {formOpen && (
        <ZoneFormModal
          zone={editingZone}
          onSave={handleSaveZone}
          onClose={() => { setFormOpen(false); setEditingZone(null); }}
        />
      )}
      {detailZone && (
        <ZoneDetailPanel
          zone={enrichedZones.find((z) => z.id === detailZone.id) || detailZone}
          reports={reports}
          drivers={drivers}
          vehicles={vehicles}
          onClose={() => setDetailZone(null)}
        />
      )}
    </div>
  );
};

export default ZonesManagementPage;
