
import React, { useEffect, useMemo, useState } from 'react';
import StatCard from '../components/StatCard';
import { Trash2, AlertTriangle, Truck, Target } from 'lucide-react';
import MapView from '../components/MapView';
import RecentActivityFeed from '../components/RecentActivityFeed';
import QuickActions from '../components/QuickActions';
import CollectionTrendsChart from '../components/CollectionTrendsChart';
import ReportsByCategoryChart from '../components/ReportsByCategoryChart';
import { adminAPI, reportsAPI, vehiclesAPI } from '../../services/api';

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [reports, setReports] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsResponse, activitiesResponse, reportsResponse, vehiclesResponse] = await Promise.all([
          adminAPI.getDashboardStats(),
          adminAPI.getRecentActivities({ limit: 12 }),
          reportsAPI.getAll({ limit: 250 }),
          vehiclesAPI.getAll(),
        ]);

        setStats(statsResponse?.data || null);
        setActivities(Array.isArray(activitiesResponse?.data) ? activitiesResponse.data : []);
        setReports(Array.isArray(reportsResponse?.data) ? reportsResponse.data : []);
        setVehicles(Array.isArray(vehiclesResponse?.data) ? vehiclesResponse.data : []);
      } catch (error) {
        console.error('Failed to load admin dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    const poll = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(poll);
  }, []);

  const reportStats = stats?.reports || {};
  const vehicleStats = stats?.vehicles || {};
  
  const totalReports = reportStats.total ?? reports.length;
  const pendingReports = reportStats.pending ?? reports.filter((report) => report.status === 'pending').length;
  const completedReports = reportStats.completed ?? reports.filter((report) => report.status === 'completed').length;
  
  const totalVehicles = vehicleStats.total ?? vehicles.length;
  const activeVehicles = vehicleStats.active ?? vehicles.filter((vehicle) => String(vehicle.status || '').toLowerCase() === 'active').length;
  const inactiveVehicles = Math.max(0, totalVehicles - activeVehicles);
  
  const completionRate = totalReports > 0 ? Math.round((completedReports / totalReports) * 100) : 0;

  const mapMarkers = useMemo(() => {
    return reports
      .map((report) => {
        const lat = Number(report.latitude);
        const lng = Number(report.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          return null;
        }

        return {
          position: [lat, lng],
          popup: `${report.location || 'Reported Location'} (${report.status || 'pending'})`,
        };
      })
      .filter(Boolean);
  }, [reports]);

  const collectionTrendsData = useMemo(() => {
    if (stats?.collectionTrends) {
      return stats.collectionTrends;
    }
    
    // Fallback logic if backend doesn't provide it
    const today = new Date();
    const buckets = [];
    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      buckets.push({
        key: date.toISOString().slice(0, 10),
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        waste: 0,
      });
    }

    reports.forEach((report) => {
      if (!report.created_at) return;
      const key = new Date(report.created_at).toISOString().slice(0, 10);
      const bucket = buckets.find((item) => item.key === key);
      if (bucket) bucket.waste += 1;
    });

    return buckets.map(({ name, waste }) => ({ name, waste }));
  }, [reports, stats?.collectionTrends]);

  const reportsByCategoryData = useMemo(() => {
    if (reportStats.byCategory) {
      return reportStats.byCategory;
    }

    // Fallback logic
    const counts = reports.reduce((acc, report) => {
      const key = report.waste_type || 'other';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [reports, reportStats.byCategory]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Trash2 size={24} className="text-emerald-500" />}
          title="Total Reports"
          value={loading ? 'Loading...' : `${totalReports} total`}
          change={loading ? '' : `${completedReports} completed`}
          changeType="increase"
        />
        <StatCard
          icon={<AlertTriangle size={24} className="text-amber-500" />}
          title="Pending Reports"
          value={loading ? 'Loading...' : `${pendingReports} pending`}
          change={loading ? '' : `${Math.max(0, totalReports - pendingReports - completedReports)} in progress/assigned`}
        />
        <StatCard
          icon={<Truck size={24} className="text-blue-500" />}
          title="Active Vehicles"
          value={loading ? 'Loading...' : `${activeVehicles} of ${totalVehicles} active`}
          change={loading ? '' : `${inactiveVehicles} inactive`}
        />
        <StatCard
          icon={<Target size={24} className="text-green-500" />}
          title="Collection Rate"
          value={loading ? 'Loading...' : `${completionRate}% completed`}
          change={loading ? '' : `${completedReports} completed reports`}
          changeType="increase"
        />
      </div>
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md h-96">
          <MapView markers={mapMarkers} />
        </div>
        <div className="lg:col-span-1">
          <RecentActivityFeed activities={activities} loading={loading} />
        </div>
      </div>
      <div className="mt-8">
        <QuickActions />
      </div>
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CollectionTrendsChart data={collectionTrendsData} loading={loading} />
        <ReportsByCategoryChart data={reportsByCategoryData} loading={loading} />
      </div>
    </>
  );
};

export default DashboardPage;
