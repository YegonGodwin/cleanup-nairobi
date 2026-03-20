import React, { useEffect, useMemo, useState } from 'react';
import {
  BellRing,
  CheckCircle2,
  ClipboardCopy,
  Headphones,
  Mail,
  RefreshCw,
  Search,
  ShieldAlert,
  Truck
} from 'lucide-react';
import { assignmentsAPI, driversAPI, notificationsAPI } from '../../../services/api';
import { Button } from '../../ui/Button';
import { Card, CardContent } from '../../ui/card';
import { useAuth } from '../../../context/AuthContext';
import toast from '../../ui/Toast';

const SUPPORT_EMAIL = 'support@cleanupnairobi.com';

const HELP_TOPICS = [
  {
    title: 'What should I do if a pickup location is blocked?',
    answer: 'Open a field report with the exact location, describe what is blocking access, and mention whether a smaller vehicle or enforcement support is needed.'
  },
  {
    title: 'When do I escalate a safety hazard?',
    answer: 'Escalate immediately when there is fire, hazardous waste, road collapse risk, aggressive crowd activity, or a spill that needs emergency response.'
  },
  {
    title: 'How do I prove a task was completed?',
    answer: 'Complete the task from your task workflow after collection, then log a field report only if you need to capture extra cleanup evidence or a follow-up issue.'
  },
  {
    title: 'What details help dispatch fastest?',
    answer: 'Share the task location, urgency, access constraints, vehicle status, and whether the route can continue or needs reassignment.'
  }
];

const parseNotificationsPayload = (response) => {
  const payload = response?.data;
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.notifications)) {
    return payload.notifications;
  }
  return [];
};

const formatDateTime = (value) => {
  if (!value) {
    return 'Just now';
  }

  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const SupportPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [draft, setDraft] = useState({
    category: 'route_issue',
    urgency: 'normal',
    preferredChannel: 'email',
    summary: '',
    details: ''
  });

  const fetchSupportContext = async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const [notificationsResponse, assignmentsResponse, vehicleResponse] = await Promise.all([
        notificationsAPI.getAll({ limit: 6 }),
        assignmentsAPI.getDriverTasks({ limit: 20 }),
        driversAPI.getAssignedVehicle()
      ]);

      setNotifications(parseNotificationsPayload(notificationsResponse));
      setAssignments(Array.isArray(assignmentsResponse?.data) ? assignmentsResponse.data : []);
      setVehicle(vehicleResponse?.data || null);
    } catch (err) {
      setError(err.message || 'Failed to load support data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSupportContext();
  }, []);

  const activeAssignment = useMemo(
    () => assignments.find((item) => ['in_progress', 'accepted', 'pending'].includes(item.status)) || null,
    [assignments]
  );

  const unreadNotifications = useMemo(
    () => notifications.filter((item) => !item.is_read),
    [notifications]
  );

  const filteredTopics = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return HELP_TOPICS;
    }

    return HELP_TOPICS.filter((topic) =>
      topic.title.toLowerCase().includes(query) || topic.answer.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const supportBrief = useMemo(() => {
    const report = activeAssignment?.waste_reports || activeAssignment?.report_details || {};

    return [
      `Driver: ${user?.full_name || 'Unknown driver'}`,
      `Email: ${user?.email || 'Not available'}`,
      `Vehicle: ${vehicle?.registration_number || 'No assigned vehicle'}`,
      `Category: ${draft.category.replace('_', ' ')}`,
      `Urgency: ${draft.urgency}`,
      `Preferred channel: ${draft.preferredChannel}`,
      `Current task: ${report.location || 'No active task selected'}`,
      `Summary: ${draft.summary || 'No summary provided'}`,
      `Details: ${draft.details || 'No extra details provided'}`,
      `Generated: ${new Date().toLocaleString()}`
    ].join('\n');
  }, [activeAssignment, draft, user, vehicle]);

  const handleDraftChange = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleCopyBrief = async () => {
    try {
      await navigator.clipboard.writeText(supportBrief);
      toast.success('Support brief copied', {
        description: 'You can paste it into email, WhatsApp, or radio logs.'
      });
    } catch (err) {
      toast.error('Clipboard unavailable', {
        description: 'Copying failed in this browser context.'
      });
    }
  };

  const handleEmailSupport = () => {
    const subject = encodeURIComponent(`[Driver Support] ${draft.summary || 'Operational support request'}`);
    const body = encodeURIComponent(supportBrief);
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };

  const handleMarkNotificationAsRead = async (notificationId) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      setNotifications((current) =>
        current.map((item) => (item.id === notificationId ? { ...item, is_read: true } : item))
      );
    } catch (err) {
      toast.error(err.message || 'Failed to update notification.');
    }
  };

  const handleMarkVisibleRead = async () => {
    const unreadIds = unreadNotifications.map((item) => item.id).filter(Boolean);
    if (unreadIds.length === 0) {
      toast.info('No unread alerts to clear.');
      return;
    }

    try {
      await notificationsAPI.markMultipleAsRead(unreadIds);
      setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));
      toast.success('Alerts marked as read');
    } catch (err) {
      toast.error(err.message || 'Failed to update alerts.');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
        <div className="flex items-center gap-3 text-slate-600">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading support workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] bg-gradient-to-br from-orange-500 via-amber-500 to-emerald-500 p-6 text-slate-950 shadow-2xl md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
              <Headphones className="w-3.5 h-3.5" />
              Driver Support
            </div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Escalate route problems with the right operational context attached.</h1>
            <p className="mt-3 text-sm text-slate-900/75 md:text-base">
              Support is most effective when it includes your current task, vehicle state, and a concise description of what is blocking progress. This page builds that brief for you.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => fetchSupportContext({ silent: true })}
            disabled={refreshing}
            className="border-black/15 bg-white/30 text-slate-900 hover:bg-white/40"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh context
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-200 shadow-sm" hover={false}>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <Truck className="h-4 w-4 text-emerald-600" />
              Vehicle status
            </div>
            <div className="text-2xl font-bold text-slate-900">{vehicle?.registration_number || 'Unassigned'}</div>
            <div className="text-sm text-slate-500">{vehicle?.type || 'No vehicle linked to this driver yet.'}</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm" hover={false}>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              Active escalation context
            </div>
            <div className="text-2xl font-bold text-slate-900">{activeAssignment ? 'Live task found' : 'No active task'}</div>
            <div className="text-sm text-slate-500">
              {activeAssignment
                ? (activeAssignment.waste_reports || activeAssignment.report_details || {}).location || 'Current task'
                : 'Your next support request will not include route-specific context unless you add it manually.'}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm" hover={false}>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <BellRing className="h-4 w-4 text-blue-600" />
              Unread alerts
            </div>
            <div className="text-2xl font-bold text-slate-900">{unreadNotifications.length}</div>
            <div className="text-sm text-slate-500">Recent notifications that may affect your shift.</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <Card className="border-slate-200 shadow-sm" hover={false}>
          <CardContent className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Compose support brief</h2>
              <p className="text-sm text-slate-500">Build a dispatch-ready message with operational context.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
                <select
                  value={draft.category}
                  onChange={(event) => handleDraftChange('category', event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  <option value="route_issue">Route issue</option>
                  <option value="vehicle_problem">Vehicle problem</option>
                  <option value="safety_hazard">Safety hazard</option>
                  <option value="access_blocked">Access blocked</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Urgency</label>
                <select
                  value={draft.urgency}
                  onChange={(event) => handleDraftChange('urgency', event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Preferred channel</label>
                <select
                  value={draft.preferredChannel}
                  onChange={(event) => handleDraftChange('preferredChannel', event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  <option value="email">Email</option>
                  <option value="radio">Radio</option>
                  <option value="phone">Phone</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Summary</label>
              <input
                type="text"
                value={draft.summary}
                onChange={(event) => handleDraftChange('summary', event.target.value)}
                placeholder="Example: Access road blocked by parked trucks"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Details</label>
              <textarea
                rows={6}
                value={draft.details}
                onChange={(event) => handleDraftChange('details', event.target.value)}
                placeholder="Describe the blockage, risk, or support required."
                className="w-full rounded-2xl border border-slate-300 px-3 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            <div className="rounded-2xl bg-slate-900 p-4 text-sm text-slate-100">
              <div className="mb-2 flex items-center gap-2 font-semibold text-white">
                <Mail className="h-4 w-4 text-emerald-300" />
                Generated support brief
              </div>
              <pre className="whitespace-pre-wrap font-sans text-slate-200">{supportBrief}</pre>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={handleCopyBrief}>
                <ClipboardCopy className="mr-2 h-4 w-4" />
                Copy brief
              </Button>
              <Button variant="outline" onClick={handleEmailSupport}>
                <Mail className="mr-2 h-4 w-4" />
                Email support
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm" hover={false}>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Recent alerts</h2>
                  <p className="text-sm text-slate-500">Read these before escalating.</p>
                </div>
                <Button variant="outline" onClick={handleMarkVisibleRead}>
                  Mark visible read
                </Button>
              </div>

              {notifications.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
                  No recent alerts for this driver.
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${notification.is_read ? 'bg-slate-300' : 'bg-emerald-500'}`} />
                            <h3 className="font-semibold text-slate-900">{notification.title || 'Driver alert'}</h3>
                          </div>
                          <p className="text-sm text-slate-600">{notification.message || 'No message provided.'}</p>
                          <p className="text-xs text-slate-400">{formatDateTime(notification.created_at)}</p>
                        </div>

                        {!notification.is_read && (
                          <button
                            type="button"
                            onClick={() => handleMarkNotificationAsRead(notification.id)}
                            className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm" hover={false}>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Search className="h-5 w-5 text-emerald-600" />
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Support topics</h2>
                  <p className="text-sm text-slate-500">Quick answers for common driver issues.</p>
                </div>
              </div>

              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search blocked road, safety, proof of work..."
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />

              <div className="space-y-3">
                {filteredTopics.map((topic) => (
                  <div key={topic.title} className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                      <div>
                        <h3 className="font-semibold text-slate-900">{topic.title}</h3>
                        <p className="mt-1 text-sm text-slate-600">{topic.answer}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredTopics.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                    No help topics matched that search.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
