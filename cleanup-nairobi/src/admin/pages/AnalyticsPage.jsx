import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Filter, FileDown } from 'lucide-react';
import { adminAPI, reportsAPI, userAPI, vehiclesAPI } from '../../services/api';

import KeyMetrics from '../components/analytics/KeyMetrics';
import WasteCollectionTrends from '../components/analytics/WasteCollectionTrends';
import CollectionsByZone from '../components/analytics/CollectionsByZone';
import VehicleUtilization from '../components/analytics/VehicleUtilization';
import ReportsByCategory from '../components/analytics/ReportsByCategory';
import ReportStatusDistribution from '../components/analytics/ReportStatusDistribution';
import PeakActivityTimes from '../components/analytics/PeakActivityTimes';
import ZoneComparison from '../components/analytics/ZoneComparison';
import TrendAnalysis from '../components/analytics/TrendAnalysis';
import TopPerformingZones from '../components/analytics/TopPerformingZones';
import TopPerformingOperators from '../components/analytics/TopPerformingOperators';
import ChoroplethMap from '../components/analytics/ChoroplethMap';
import ReportBuilder from '../components/analytics/ReportBuilder';
import Insights from '../components/analytics/Insights';

const zoneFromLocation = (location) => {
  if (!location || typeof location !== 'string') return 'Unspecified';
  const parts = location.split(',').map((part) => part.trim()).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : parts[0] || 'Unspecified';
};

const POLL_INTERVAL_MS = 15000;

const getActivityLocation = (activity) => {
  if (activity?.target?.title) return activity.target.title;
  if (activity?.metadata?.location) return activity.metadata.location;
  return '';
};

const parseDate = (value) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const filterByWindowAndZone = (items, getDateValue, getZoneValue, rangeDays, selectedZone) => {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - Number(rangeDays));

  return items.filter((item) => {
    const dateValue = getDateValue(item);
    if (!dateValue || dateValue < start) return false;
    const zone = getZoneValue(item);
    return selectedZone === 'All Zones' || zone === selectedZone;
  });
};

const filterPreviousWindowAndZone = (items, getDateValue, getZoneValue, rangeDays, selectedZone) => {
  const now = new Date();
  const periodDays = Number(rangeDays);
  const end = new Date(now);
  end.setDate(now.getDate() - periodDays);
  const start = new Date(end);
  start.setDate(end.getDate() - periodDays);

  return items.filter((item) => {
    const dateValue = getDateValue(item);
    if (!dateValue || !(dateValue >= start && dateValue < end)) return false;
    const zone = getZoneValue(item);
    return selectedZone === 'All Zones' || zone === selectedZone;
  });
};

const fetchAllUsers = async () => {
  const pageSize = 500;
  let page = 1;
  let users = [];
  let totalPages = 1;

  do {
    const response = await userAPI.getAllUsers({ page, limit: pageSize });
    const payload = response?.data || {};
    const batch = Array.isArray(payload.users) ? payload.users : [];
    users = [...users, ...batch];
    totalPages = Number(payload.pagination?.totalPages || 1);
    page += 1;
  } while (page <= totalPages);

  return users;
};

const AnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('30');
  const [selectedZone, setSelectedZone] = useState('All Zones');
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAnalyticsData = useCallback(async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [reportsResponse, usersData, vehiclesResponse, statsResponse, activitiesResponse] = await Promise.all([
        reportsAPI.getAll({ limit: 5000, sort_by: 'created_at', sort_order: 'desc' }),
        fetchAllUsers(),
        vehiclesAPI.getAll(),
        adminAPI.getDashboardStats(),
        adminAPI.getRecentActivities({ limit: 250 }),
      ]);

      setReports(Array.isArray(reportsResponse?.data) ? reportsResponse.data : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setVehicles(Array.isArray(vehiclesResponse?.data) ? vehiclesResponse.data : []);
      setStats(statsResponse?.data || null);
      setActivities(Array.isArray(activitiesResponse?.data) ? activitiesResponse.data : []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalyticsData();
    const poll = setInterval(() => fetchAnalyticsData({ silent: true }), POLL_INTERVAL_MS);
    return () => clearInterval(poll);
  }, [fetchAnalyticsData]);

  const zones = useMemo(() => {
    const allZones = Array.from(new Set(reports.map((report) => zoneFromLocation(report.location))));
    return ['All Zones', ...allZones];
  }, [reports]);

  const filteredReports = useMemo(() => {
    return filterByWindowAndZone(
      reports,
      (report) => parseDate(report.created_at),
      (report) => zoneFromLocation(report.location),
      dateRange,
      selectedZone
    );
  }, [reports, dateRange, selectedZone]);

  const previousPeriodReports = useMemo(() => {
    return filterPreviousWindowAndZone(
      reports,
      (report) => parseDate(report.created_at),
      (report) => zoneFromLocation(report.location),
      dateRange,
      selectedZone
    );
  }, [reports, dateRange, selectedZone]);

  const filteredActivities = useMemo(() => {
    return filterByWindowAndZone(
      activities,
      (activity) => parseDate(activity.timestamp),
      (activity) => zoneFromLocation(getActivityLocation(activity)),
      dateRange,
      selectedZone
    );
  }, [activities, dateRange, selectedZone]);

  const previousPeriodActivities = useMemo(() => {
    return filterPreviousWindowAndZone(
      activities,
      (activity) => parseDate(activity.timestamp),
      (activity) => zoneFromLocation(getActivityLocation(activity)),
      dateRange,
      selectedZone
    );
  }, [activities, dateRange, selectedZone]);

  const completionRate = filteredReports.length > 0
    ? Math.round((filteredReports.filter((r) => r.status === 'completed').length / filteredReports.length) * 100)
    : 0;

  const resolutionRate = filteredReports.length > 0
    ? Math.round((filteredReports.filter((r) => ['completed', 'rejected'].includes(r.status)).length / filteredReports.length) * 100)
    : 0;

  const previousResolutionRate = previousPeriodReports.length > 0
    ? Math.round((previousPeriodReports.filter((r) => ['completed', 'rejected'].includes(r.status)).length / previousPeriodReports.length) * 100)
    : 0;

  const previousCompletionRate = previousPeriodReports.length > 0
    ? Math.round((previousPeriodReports.filter((r) => r.status === 'completed').length / previousPeriodReports.length) * 100)
    : 0;

  const pctChange = (current, previous) => {
    if (previous === 0) return current === 0 ? '0.0%' : '+100.0%';
    const change = ((current - previous) / previous) * 100;
    const prefix = change >= 0 ? '+' : '';
    return `${prefix}${change.toFixed(1)}%`;
  };

  const wasteTrendsData = useMemo(() => {
    const now = new Date();
    const buckets = [];
    for (let i = Number(dateRange) - 1; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      buckets.push({
        key: d.toISOString().slice(0, 10),
        name: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        total: 0,
        completed: 0,
        pending: 0,
      });
    }

    filteredReports.forEach((report) => {
      const key = new Date(report.created_at).toISOString().slice(0, 10);
      const bucket = buckets.find((item) => item.key === key);
      if (!bucket) return;
      bucket.total += 1;
      if (report.status === 'completed') bucket.completed += 1;
      if (report.status === 'pending') bucket.pending += 1;
    });

    return buckets.map(({ name, total, completed, pending }) => ({ name, total, completed, pending }));
  }, [filteredReports, dateRange]);

  const sparklineData = wasteTrendsData.map((item) => ({ value: item.total }));
  const sparklineCompleted = wasteTrendsData.map((item) => ({ value: item.completed }));

  const collectionsByZoneData = useMemo(() => {
    const zoneCounts = filteredReports.reduce((acc, report) => {
      const zone = zoneFromLocation(report.location);
      acc[zone] = (acc[zone] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(zoneCounts)
      .map(([name, waste]) => ({ name, waste }))
      .sort((a, b) => b.waste - a.waste)
      .slice(0, 10);
  }, [filteredReports]);

  const reportsByCategoryData = useMemo(() => {
    const counts = filteredReports.reduce((acc, report) => {
      const key = report.waste_type || 'other';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [filteredReports]);

  const reportStatusData = useMemo(() => {
    const counts = filteredReports.reduce((acc, report) => {
      const key = report.status || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({
      name: name.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      value,
    }));
  }, [filteredReports]);

  const peakActivityData = useMemo(() => {
    const hourCounts = Array.from({ length: 24 }, (_, hour) => ({ hour: `${hour}:00`, count: 0 }));
    filteredActivities.forEach((activity) => {
      if (!activity.timestamp) return;
      const hour = new Date(activity.timestamp).getHours();
      hourCounts[hour].count += 1;
    });
    return hourCounts
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .sort((a, b) => parseInt(a.hour, 10) - parseInt(b.hour, 10));
  }, [filteredActivities]);

  const zoneComparisonData = useMemo(() => {
    const byZone = filteredReports.reduce((acc, report) => {
      const zone = zoneFromLocation(report.location);
      if (!acc[zone]) {
        acc[zone] = { name: zone, total: 0, completed: 0, pending: 0 };
      }
      acc[zone].total += 1;
      if (report.status === 'completed') acc[zone].completed += 1;
      if (report.status === 'pending') acc[zone].pending += 1;
      return acc;
    }, {});

    return Object.values(byZone)
      .map((zone) => ({
        ...zone,
        rate: zone.total > 0 ? Math.round((zone.completed / zone.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredReports]);

  const topZones = zoneComparisonData.slice(0, 5);

  const vehicleUtilizationData = useMemo(() => {
    const activityByVehicle = filteredActivities.reduce((acc, activity) => {
      const vehicleNumber = activity.metadata?.vehicleNumber;
      if (!vehicleNumber) return acc;
      acc[vehicleNumber] = (acc[vehicleNumber] || 0) + 1;
      return acc;
    }, {});

    return vehicles
      .slice(0, 8)
      .map((vehicle) => ({
        name: vehicle.registration_number || vehicle.id?.slice(0, 8) || 'Vehicle',
        utilization: Math.max(Number(vehicle.collections_today || 0), Number(activityByVehicle[vehicle.registration_number] || 0)),
      }))
      .sort((a, b) => b.utilization - a.utilization);
  }, [vehicles, filteredActivities]);

  const topOperators = useMemo(() => {
    const weights = {
      ASSIGN: 1,
      ACCEPT: 2,
      START: 3,
      COMPLETE: 5,
      CANCEL: -1,
    };

    const operatorScores = filteredActivities.reduce((acc, activity) => {
      if (activity.entityType !== 'Assignment') return acc;
      const name = activity.actor?.name;
      if (!name) return acc;

      if (!acc[name]) {
        acc[name] = { name, score: 0 };
      }

      acc[name].score += weights[activity.action] ?? 0;
      return acc;
    }, {});

    const liveOperators = Object.values(operatorScores)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    if (liveOperators.length > 0) {
      return liveOperators;
    }

    return users
      .filter((user) => String(user.role || '').toLowerCase() === 'driver')
      .map((user) => ({ name: user.fullName || user.full_name || user.email, score: Number(user.points || 0) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [users, filteredActivities]);

  const uniqueActors = new Set(filteredActivities.map((activity) => activity.actor?.id || activity.actor?.name).filter(Boolean)).size;
  const previousUniqueActors = new Set(previousPeriodActivities.map((activity) => activity.actor?.id || activity.actor?.name).filter(Boolean)).size;

  const insights = useMemo(() => {
    const total = filteredReports.length;
    const pending = filteredReports.filter((report) => report.status === 'pending').length;
    const activeVehicleCount = vehicles.filter((vehicle) => String(vehicle.status || '').toLowerCase() === 'active').length;
    const bestZone = topZones[0];
    const bestOperator = topOperators[0];
    const busiestHour = peakActivityData.reduce((max, current) => (current.count > (max?.count || 0) ? current : max), null);
    const lines = [];

    lines.push(`Filtered reports: ${total} in the last ${dateRange} days.`);
    lines.push(`Completion rate is ${completionRate}% (${pctChange(completionRate, previousCompletionRate)} vs previous period).`);
    lines.push(`Resolution rate is ${resolutionRate}% (${pctChange(resolutionRate, previousResolutionRate)} vs previous period).`);
    lines.push(`${pending} reports are still pending action.`);
    lines.push(`${activeVehicleCount} of ${vehicles.length} vehicles are currently active.`);
    if (bestZone) {
      lines.push(`Top zone is ${bestZone.name} with ${bestZone.rate}% completion (${bestZone.completed}/${bestZone.total}).`);
    }
    if (bestOperator) {
      lines.push(`Top operator signal: ${bestOperator.name} with a live score of ${bestOperator.score}.`);
    }
    if (busiestHour && busiestHour.count > 0) {
      lines.push(`Peak system activity is around ${busiestHour.hour} with ${busiestHour.count} events in the selected window.`);
    }
    if (lastUpdated) {
      lines.push(`Last live sync completed at ${lastUpdated.toLocaleTimeString()}.`);
    }
    return lines;
  }, [filteredReports, dateRange, completionRate, previousCompletionRate, resolutionRate, previousResolutionRate, vehicles, topZones, topOperators, peakActivityData, lastUpdated]);

  const totalWasteCollected = filteredReports.filter((report) => report.status === 'completed').length;
  const collectionEfficiency = completionRate;
  const engagementTotal = uniqueActors || stats?.users?.total || users.length;
  const previousCompletedCount = previousPeriodReports.filter((report) => report.status === 'completed').length;
  const driverCount = stats?.users?.drivers ?? users.filter((user) => String(user.role || '').toLowerCase() === 'driver').length;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Analytics & Reports</h1>
        <div className="flex items-center space-x-2">
          <select
            className="p-2 border border-gray-300 rounded-md"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 3 months</option>
          </select>
          <select
            className="p-2 border border-gray-300 rounded-md"
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
          >
            {zones.map((zone) => (
              <option key={zone} value={zone}>{zone}</option>
            ))}
          </select>
          <button
            className="p-2 border border-gray-300 rounded-md flex items-center"
            onClick={() => fetchAnalyticsData({ silent: true })}
            title={lastUpdated ? `Last synced at ${lastUpdated.toLocaleTimeString()}` : 'Refresh live analytics'}
          >
            <Filter size={16} className="mr-2" />
            Live
          </button>
          <button
            className="p-2 bg-blue-500 text-white rounded-md flex items-center"
            onClick={() => {
              const payload = {
                generatedAt: new Date().toISOString(),
                dateRange,
                zone: selectedZone,
                lastUpdated: lastUpdated?.toISOString() || null,
                totals: {
                  reports: filteredReports.length,
                  completionRate,
                  resolutionRate,
                  pending: filteredReports.filter((report) => report.status === 'pending').length,
                  activeActors: uniqueActors,
                },
              };
              const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'analytics-export.json';
              link.click();
              URL.revokeObjectURL(url);
            }}
          >
            <FileDown size={16} className="mr-2" />
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KeyMetrics
          title="Total Waste Collected"
          value={loading ? 'Loading...' : `${totalWasteCollected}`}
          trend={pctChange(totalWasteCollected, previousCompletedCount)}
          breakdown={`${selectedZone} | ${dateRange} days`}
          sparklineData={sparklineCompleted}
        />
        <KeyMetrics
          title="Collection Efficiency"
          value={loading ? 'Loading...' : `${collectionEfficiency}%`}
          trend={pctChange(collectionEfficiency, previousCompletionRate)}
          breakdown={`Completed: ${filteredReports.filter((report) => report.status === 'completed').length}`}
          sparklineData={sparklineData}
        />
        <KeyMetrics
          title="Report Resolution Rate"
          value={loading ? 'Loading...' : `${resolutionRate}%`}
          trend={pctChange(resolutionRate, previousResolutionRate)}
          breakdown={`Pending: ${filteredReports.filter((report) => report.status === 'pending').length}`}
          sparklineData={sparklineCompleted}
        />
        <KeyMetrics
          title="User Engagement"
          value={loading ? 'Loading...' : `${engagementTotal}`}
          trend={pctChange(engagementTotal, previousUniqueActors)}
          breakdown={`Drivers: ${driverCount}`}
          sparklineData={sparklineData}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <WasteCollectionTrends data={wasteTrendsData} />
        <CollectionsByZone data={collectionsByZoneData} />
        <VehicleUtilization data={vehicleUtilizationData} />
        <ReportsByCategory data={reportsByCategoryData} />
        <ReportStatusDistribution data={reportStatusData} />
        <PeakActivityTimes data={peakActivityData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <ZoneComparison data={zoneComparisonData} />
        <TrendAnalysis data={wasteTrendsData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <TopPerformingZones zones={topZones} />
        <TopPerformingOperators operators={topOperators} />
      </div>

      <div className="mt-6">
        <ChoroplethMap zones={zoneComparisonData} />
      </div>

      <div className="mt-6">
        <ReportBuilder
          dateRange={dateRange}
          zone={selectedZone}
          filteredReports={filteredReports}
          collectionsByZone={collectionsByZoneData}
          reportsByCategory={reportsByCategoryData}
          reportStatusDistribution={reportStatusData}
          peakActivityTimes={peakActivityData}
          topZones={topZones}
          topOperators={topOperators}
        />
      </div>

      <div className="mt-6">
        <Insights insights={insights} />
      </div>
    </div>
  );
};

export default AnalyticsPage;

