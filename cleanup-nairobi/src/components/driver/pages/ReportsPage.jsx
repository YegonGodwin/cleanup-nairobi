import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Clock3,
  MapPin,
  Plus,
  RefreshCw,
  Route as RouteIcon,
  Sparkles
} from 'lucide-react';
import { reportsAPI, assignmentsAPI } from '../../../services/api';
import { Button } from '../../ui/Button';
import { Card, CardContent } from '../../ui/card';
import ReportForm from '../../reports/ReportForm';
import ReportCard from '../../reports/ReportCard';
import toast from '../../ui/Toast';

const parseReportsPayload = (response) => {
  const payload = response?.data;
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.reports)) {
    return payload.reports;
  }
  return [];
};

const getStatusTone = (status) => {
  switch (status) {
    case 'completed':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'in_progress':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'assigned':
    case 'accepted':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'cancelled':
    case 'rejected':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const formatDateTime = (value) => {
  if (!value) {
    return 'Not available';
  }

  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const ReportsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [assignments, setAssignments] = useState([]);
  const [submittedReports, setSubmittedReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [reportStatusFilter, setReportStatusFilter] = useState('all');

  const fetchReportsWorkspace = async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const [assignmentsResponse, reportsResponse] = await Promise.all([
        assignmentsAPI.getDriverTasks({ limit: 30 }),
        reportsAPI.getUserReports()
      ]);

      setAssignments(Array.isArray(assignmentsResponse?.data) ? assignmentsResponse.data : []);
      setSubmittedReports(parseReportsPayload(reportsResponse));
    } catch (err) {
      setError(err.message || 'Failed to load driver reports.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReportsWorkspace();
  }, []);

  const assignmentStats = useMemo(() => {
    const completed = assignments.filter((item) => item.status === 'completed').length;
    const active = assignments.filter((item) => ['pending', 'accepted', 'in_progress'].includes(item.status)).length;
    const mapped = assignments.filter((item) => {
      const report = item.waste_reports || item.report_details || {};
      return report.latitude && report.longitude;
    }).length;

    return {
      total: assignments.length,
      completed,
      active,
      mapped,
      completionRate: assignments.length > 0 ? Math.round((completed / assignments.length) * 100) : 0
    };
  }, [assignments]);

  const reportStats = useMemo(() => {
    const open = submittedReports.filter((report) => ['pending', 'assigned', 'in_progress'].includes(report.status)).length;
    const resolved = submittedReports.filter((report) => report.status === 'completed').length;

    return {
      total: submittedReports.length,
      open,
      resolved
    };
  }, [submittedReports]);

  const filteredSubmittedReports = useMemo(() => {
    if (reportStatusFilter === 'all') {
      return submittedReports;
    }

    return submittedReports.filter((report) => report.status === reportStatusFilter);
  }, [reportStatusFilter, submittedReports]);

  const liveAssignments = useMemo(
    () => assignments.filter((item) => ['pending', 'accepted', 'in_progress'].includes(item.status)),
    [assignments]
  );

  const handleReportCreated = () => {
    setActiveTab('submitted');
    fetchReportsWorkspace({ silent: true });
  };

  const handleRefresh = () => {
    fetchReportsWorkspace({ silent: true });
  };

  const statsCards = [
    {
      label: 'Active pickups',
      value: assignmentStats.active,
      tone: 'from-emerald-500 to-teal-500',
      icon: <ClipboardList className="w-5 h-5" />
    },
    {
      label: 'Completion rate',
      value: `${assignmentStats.completionRate}%`,
      tone: 'from-blue-500 to-cyan-500',
      icon: <CheckCircle2 className="w-5 h-5" />
    },
    {
      label: 'Field reports logged',
      value: reportStats.total,
      tone: 'from-amber-500 to-orange-500',
      icon: <MapPin className="w-5 h-5" />
    },
    {
      label: 'Mapped jobs',
      value: assignmentStats.mapped,
      tone: 'from-violet-500 to-fuchsia-500',
      icon: <RouteIcon className="w-5 h-5" />
    }
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
        <div className="flex items-center gap-3 text-slate-600">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading reports workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-700 text-white shadow-2xl">
        <div className="absolute -right-16 top-0 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-amber-300/20 blur-2xl" />
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-emerald-100">
                <Sparkles className="w-3.5 h-3.5" />
                Driver Reports
              </div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Track field issues, route pickups, and clean-up proof in one place.</h1>
              <p className="mt-3 max-w-xl text-sm text-emerald-50/90 md:text-base">
                Use this workspace to review assigned collection reports, file new issues from the road, and keep an audit trail of what you have already escalated.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setActiveTab('create')}
                className="bg-white text-emerald-800 hover:bg-emerald-50"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Field Report
              </Button>
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
                className="border-white/25 bg-white/10 text-white hover:bg-white/15"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statsCards.map((card) => (
              <div
                key={card.label}
                className={`rounded-2xl bg-gradient-to-br ${card.tone} p-4 shadow-lg shadow-black/10`}
              >
                <div className="flex items-center justify-between text-white/80">
                  <span className="text-sm font-medium">{card.label}</span>
                  {card.icon}
                </div>
                <div className="mt-4 text-3xl font-bold text-white">{card.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'submitted', label: 'My Reports' },
          { id: 'create', label: 'Create Report' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.id
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="grid gap-6 xl:grid-cols-[1.4fr,1fr]">
          <Card className="border-slate-200 shadow-sm" hover={false}>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Assigned collection reports</h2>
                  <p className="text-sm text-slate-500">What still needs attention on your route.</p>
                </div>
                <Button variant="outline" onClick={() => navigate('/driver/tasks')}>
                  Open tasks
                </Button>
              </div>

              {liveAssignments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
                  No active assignments right now.
                </div>
              ) : (
                <div className="space-y-4">
                  {liveAssignments.slice(0, 5).map((assignment) => {
                    const report = assignment.waste_reports || assignment.report_details || {};

                    return (
                      <div key={assignment.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusTone(assignment.status)}`}>
                                {(assignment.status || 'pending').replace('_', ' ')}
                              </span>
                              <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusTone(assignment.priority || report.priority || 'medium')}`}>
                                {(assignment.priority || report.priority || 'medium')} priority
                              </span>
                            </div>

                            <div>
                              <h3 className="text-lg font-semibold text-slate-900">{report.location || 'Assigned location'}</h3>
                              <p className="mt-1 text-sm text-slate-600">{report.description || 'No description provided.'}</p>
                            </div>

                            <div className="grid gap-2 text-sm text-slate-500 md:grid-cols-2">
                              <div className="flex items-center gap-2">
                                <Clock3 className="h-4 w-4 text-slate-400" />
                                Assigned {formatDateTime(assignment.assigned_at)}
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-slate-400" />
                                {report.latitude && report.longitude ? 'GPS mapped' : 'Manual location'}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 lg:flex-col">
                            <Button variant="outline" onClick={() => navigate('/driver/routes')}>
                              Route view
                            </Button>
                            <Button onClick={() => navigate('/driver/tasks')}>
                              Work item
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm" hover={false}>
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Field reporting health</h2>
                    <p className="text-sm text-slate-500">Visibility into the issues you have raised.</p>
                  </div>
                  <BarChart3 className="h-5 w-5 text-emerald-600" />
                </div>

                <div className="grid gap-3">
                  <div className="rounded-2xl bg-emerald-50 p-4">
                    <div className="text-sm text-emerald-700">Open reports</div>
                    <div className="mt-2 text-3xl font-bold text-emerald-900">{reportStats.open}</div>
                  </div>
                  <div className="rounded-2xl bg-slate-100 p-4">
                    <div className="text-sm text-slate-600">Resolved reports</div>
                    <div className="mt-2 text-3xl font-bold text-slate-900">{reportStats.resolved}</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  File a new field report when you spot blocked access, illegal dumping, overflow points, or route hazards while on shift.
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm" hover={false}>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Recent reports</h2>
                    <p className="text-sm text-slate-500">Your latest submissions from the field.</p>
                  </div>
                  <Button variant="outline" onClick={() => setActiveTab('submitted')}>
                    View all
                  </Button>
                </div>

                {submittedReports.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
                    You have not submitted any field reports yet.
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {submittedReports.slice(0, 2).map((report) => (
                      <ReportCard key={report.id} report={report} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'submitted' && (
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm" hover={false}>
            <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">My submitted reports</h2>
                <p className="text-sm text-slate-500">Filter the issues you have already logged from the field.</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {['all', 'pending', 'assigned', 'in_progress', 'completed', 'rejected'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setReportStatusFilter(status)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      reportStatusFilter === status
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {status === 'all' ? 'All' : status.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {filteredSubmittedReports.length === 0 ? (
            <Card className="border-slate-200 shadow-sm" hover={false}>
              <CardContent className="space-y-4 p-8 text-center">
                <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">No reports for this filter</h3>
                  <p className="mt-1 text-sm text-slate-500">Try a different status or log a new field report.</p>
                </div>
                <div className="flex justify-center gap-3">
                  <Button variant="outline" onClick={() => setReportStatusFilter('all')}>
                    Clear filter
                  </Button>
                  <Button onClick={() => setActiveTab('create')}>
                    Create report
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredSubmittedReports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onClick={() => toast.info('Detailed report view is not implemented yet.', {
                    description: 'The report card still shows the latest status, location, and assigned driver context.'
                  })}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'create' && (
        <div className="grid gap-6 xl:grid-cols-[1.25fr,0.75fr]">
          <ReportForm onReportCreated={handleReportCreated} />

          <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm" hover={false}>
              <CardContent className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900">What drivers should log</h2>
                <div className="space-y-3 text-sm text-slate-600">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    Overflowing bins, missed pickup points, blocked access roads, illegal dumping, and safety hazards.
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    Use GPS when possible so dispatch can route backup crews faster.
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    Add a clear description that explains what is blocking the job or what extra equipment is needed.
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm" hover={false}>
              <CardContent className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900">Shift snapshot</h2>
                <div className="grid gap-3 text-sm">
                  <div className="flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3">
                    <span className="text-emerald-800">Assignments received</span>
                    <span className="font-semibold text-emerald-900">{assignmentStats.total}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-blue-50 px-4 py-3">
                    <span className="text-blue-800">Still active</span>
                    <span className="font-semibold text-blue-900">{assignmentStats.active}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3">
                    <span className="text-amber-800">Open field reports</span>
                    <span className="font-semibold text-amber-900">{reportStats.open}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
