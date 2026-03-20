import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  Download,
  Filter,
  RefreshCw,
  Search,
  Shield,
  Wifi,
  WifiOff
} from 'lucide-react';
import LogDetailModal from '../components/LogDetailModal';
import { adminAPI } from '../../services/api';

const POLL_INTERVAL_MS = 15000;

const formatRelativeTime = (value) => {
  if (!value) return 'Just now';

  const timestamp = new Date(value);
  const diffMs = Date.now() - timestamp.getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const formatDateTime = (value) => {
  if (!value) return 'N/A';

  return new Date(value).toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const getActionTone = (action) => {
  switch (String(action || '').toUpperCase()) {
    case 'CREATE':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'ASSIGN':
    case 'START':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'COMPLETE':
    case 'ACCEPT':
    case 'JOIN':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'CANCEL':
    case 'DELETE':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const getStatusTone = (status) => {
  switch (String(status || '').toLowerCase()) {
    case 'completed':
    case 'active':
    case 'accepted':
      return 'text-emerald-700 bg-emerald-50';
    case 'pending':
    case 'assigned':
    case 'in_progress':
      return 'text-amber-700 bg-amber-50';
    case 'cancelled':
    case 'rejected':
    case 'inactive':
      return 'text-rose-700 bg-rose-50';
    default:
      return 'text-slate-600 bg-slate-100';
  }
};

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLive, setIsLive] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    action: 'all',
    entityType: 'all'
  });

  const fetchLogs = async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');
      const response = await adminAPI.getRecentActivities({ limit: 150 });
      setLogs(Array.isArray(response?.data) ? response.data : []);
      setLastUpdated(new Date());
      setIsLive(true);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setError(err.message || 'Failed to load audit logs.');
      setIsLive(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const poll = setInterval(() => {
      fetchLogs({ silent: true });
    }, POLL_INTERVAL_MS);

    return () => clearInterval(poll);
  }, []);

  const entityOptions = useMemo(() => {
    const values = Array.from(new Set(logs.map((log) => log.entityType).filter(Boolean)));
    return ['all', ...values];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return logs.filter((log) => {
      if (filters.action !== 'all' && String(log.action || '').toUpperCase() !== filters.action) {
        return false;
      }

      if (filters.entityType !== 'all' && log.entityType !== filters.entityType) {
        return false;
      }

      if (!search) {
        return true;
      }

      const haystack = [
        log.description,
        log.actor?.name,
        log.actor?.email,
        log.target?.title,
        log.target?.subtitle,
        log.entityId,
        log.entityType,
        log.action,
        log.status
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(search);
    });
  }, [filters, logs]);

  const stats = useMemo(() => {
    const creates = logs.filter((log) => log.action === 'CREATE').length;
    const assignments = logs.filter((log) => ['ASSIGN', 'ACCEPT', 'START', 'COMPLETE', 'CANCEL'].includes(log.action)).length;
    const reports = logs.filter((log) => log.entityType === 'Report').length;
    const liveWindow = logs.filter((log) => Date.now() - new Date(log.timestamp).getTime() <= 3600000).length;

    return { creates, assignments, reports, liveWindow };
  }, [logs]);

  const handleFilterChange = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const handleExport = () => {
    const headers = ['timestamp', 'action', 'entityType', 'entityId', 'actor', 'actorEmail', 'target', 'status', 'description'];
    const rows = filteredLogs.map((log) => [
      formatDateTime(log.timestamp),
      log.action || '',
      log.entityType || '',
      log.entityId || '',
      log.actor?.name || '',
      log.actor?.email || '',
      log.target?.title || '',
      log.status || '',
      (log.description || '').replace(/\n/g, ' ')
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit-logs-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-800 to-cyan-700 p-6 text-white shadow-2xl md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
              <Shield className="h-3.5 w-3.5" />
              Admin Audit Stream
            </div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Live audit visibility across reports, assignments, users, and event activity.</h1>
            <p className="mt-3 text-sm text-slate-200 md:text-base">
              This view auto-refreshes every 15 seconds so operations changes show up without a manual page reload.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium ${isLive ? 'border-emerald-300/40 bg-emerald-400/15 text-emerald-50' : 'border-rose-300/40 bg-rose-400/15 text-rose-50'}`}>
              {isLive ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              {isLive ? 'Live polling on' : 'Live polling interrupted'}
            </div>
            <button
              onClick={() => fetchLogs({ silent: true })}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh now
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Events in feed</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{logs.length}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Create actions</div>
          <div className="mt-2 text-3xl font-bold text-emerald-700">{stats.creates}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Assignment actions</div>
          <div className="mt-2 text-3xl font-bold text-blue-700">{stats.assignments}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Last hour</div>
          <div className="mt-2 text-3xl font-bold text-amber-700">{stats.liveWindow}</div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Audit logs</h2>
            <p className="mt-1 text-sm text-slate-500">
              {lastUpdated ? `Last updated ${formatRelativeTime(lastUpdated)}` : 'Waiting for first sync'}
            </p>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(event) => handleFilterChange('search', event.target.value)}
                placeholder="Search actor, entity, ID, or description"
                className="w-full rounded-2xl border border-slate-300 py-2 pl-10 pr-4 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200 lg:w-80"
              />
            </div>

            <div className="flex gap-3">
              <div className="relative">
                <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  value={filters.action}
                  onChange={(event) => handleFilterChange('action', event.target.value)}
                  className="rounded-2xl border border-slate-300 py-2 pl-10 pr-8 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                >
                  <option value="all">All actions</option>
                  <option value="CREATE">Create</option>
                  <option value="ASSIGN">Assign</option>
                  <option value="ACCEPT">Accept</option>
                  <option value="START">Start</option>
                  <option value="COMPLETE">Complete</option>
                  <option value="CANCEL">Cancel</option>
                  <option value="JOIN">Join</option>
                </select>
              </div>

              <select
                value={filters.entityType}
                onChange={(event) => handleFilterChange('entityType', event.target.value)}
                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
              >
                {entityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === 'all' ? 'All entities' : option}
                  </option>
                ))}
              </select>

              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3 p-6">
            {[1, 2, 3, 4, 5].map((row) => (
              <div key={row} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-10 text-center">
            <Activity className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900">No audit events match the current filters</h3>
            <p className="mt-1 text-sm text-slate-500">Broaden the filters or wait for the next live refresh.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1080px] w-full">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Actor</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Entity</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-t border-slate-100 hover:bg-cyan-50/40">
                    <td className="px-6 py-4 align-top">
                      <div className="font-medium text-slate-900">{formatDateTime(log.timestamp)}</div>
                      <div className="mt-1 text-xs text-slate-500">{formatRelativeTime(log.timestamp)}</div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="font-medium text-slate-900">{log.actor?.name || 'System'}</div>
                      <div className="mt-1 text-xs text-slate-500">{log.actor?.email || 'No email'}</div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getActionTone(log.action)}`}>
                        {log.action || 'UPDATE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="font-medium text-slate-900">{log.entityType || 'Activity'}</div>
                      <div className="mt-1 text-xs text-slate-500">{log.entityId || 'N/A'}</div>
                      {log.target?.title && (
                        <div className="mt-2 text-sm text-slate-600">{log.target.title}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 align-top">
                      <p className="max-w-md text-sm text-slate-700">{log.description || 'No description provided.'}</p>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusTone(log.status)}`}>
                        {String(log.status || 'n/a').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <AlertCircle className="h-4 w-4" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
};

export default AuditLogsPage;
