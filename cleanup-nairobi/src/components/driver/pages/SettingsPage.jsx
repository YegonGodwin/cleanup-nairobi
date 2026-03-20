import React, { useEffect, useMemo, useState } from 'react';
import {
  BellRing,
  CheckCircle2,
  Lock,
  LogOut,
  MonitorSmartphone,
  RefreshCw,
  ShieldCheck,
  UserCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { Button } from '../../ui/Button';
import { Card, CardContent } from '../../ui/card';
import FormField from '../../ui/FormField';
import toast from '../../ui/Toast';

const NOTIFICATION_PREFS_KEY = 'cleanup-driver-notification-preferences';
const WORKSPACE_PREFS_KEY = 'cleanup-driver-workspace-preferences';

const defaultNotificationPrefs = {
  taskAssignments: true,
  routeChanges: true,
  safetyAlerts: true,
  issueUpdates: true,
  dailyDigest: false
};

const defaultWorkspacePrefs = {
  compactView: false,
  autoRefresh: true,
  soundAlerts: true,
  showWelcomeBanner: true
};

const getStoredJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
};

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const [profileData, setProfileData] = useState({
    fullName: '',
    phone: '',
    location: '',
    avatarUrl: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [notificationPrefs, setNotificationPrefs] = useState(defaultNotificationPrefs);
  const [workspacePrefs, setWorkspacePrefs] = useState(defaultWorkspacePrefs);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  useEffect(() => {
    setProfileData({
      fullName: user?.full_name || '',
      phone: user?.phone || '',
      location: user?.location || '',
      avatarUrl: user?.avatar_url || ''
    });
  }, [user]);

  useEffect(() => {
    setNotificationPrefs(getStoredJSON(NOTIFICATION_PREFS_KEY, defaultNotificationPrefs));
    setWorkspacePrefs(getStoredJSON(WORKSPACE_PREFS_KEY, defaultWorkspacePrefs));
  }, []);

  const memberSince = useMemo(() => {
    if (!user?.created_at) {
      return 'Unknown';
    }

    return new Date(user.created_at).toLocaleDateString([], {
      year: 'numeric',
      month: 'long'
    });
  }, [user]);

  const handleProfileChange = (name, value) => {
    setProfileData((current) => ({ ...current, [name]: value }));
  };

  const handlePasswordChange = (name, value) => {
    setPasswordData((current) => ({ ...current, [name]: value }));
    setPasswordErrors((current) => ({ ...current, [name]: '' }));
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setProfileSaving(true);

    const result = await updateUser({
      fullName: profileData.fullName.trim(),
      phone: profileData.phone.trim(),
      location: profileData.location.trim(),
      avatarUrl: profileData.avatarUrl.trim()
    });

    setProfileSaving(false);

    if (result.success) {
      toast.success('Profile updated', {
        description: 'Driver contact details were saved successfully.'
      });
      return;
    }

    toast.error(result.error || 'Failed to update your profile.');
  };

  const validatePasswordForm = () => {
    const nextErrors = {};

    if (!passwordData.currentPassword) {
      nextErrors.currentPassword = 'Current password is required.';
    }
    if (!passwordData.newPassword) {
      nextErrors.newPassword = 'New password is required.';
    } else if (passwordData.newPassword.length < 8) {
      nextErrors.newPassword = 'Use at least 8 characters.';
    }
    if (passwordData.confirmPassword !== passwordData.newPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    setPasswordErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    if (!validatePasswordForm()) {
      return;
    }

    try {
      setPasswordSaving(true);
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordErrors({});
      toast.success('Password changed', {
        description: 'Use the new password the next time you sign in.'
      });
    } catch (err) {
      setPasswordErrors({ form: err.message || 'Failed to change password.' });
    } finally {
      setPasswordSaving(false);
    }
  };

  const togglePreference = (group, key) => {
    if (group === 'notifications') {
      const updated = { ...notificationPrefs, [key]: !notificationPrefs[key] };
      setNotificationPrefs(updated);
      localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(updated));
      toast.success('Notification preference saved', {
        description: 'This preference is currently stored on this device.'
      });
      return;
    }

    const updated = { ...workspacePrefs, [key]: !workspacePrefs[key] };
    setWorkspacePrefs(updated);
    localStorage.setItem(WORKSPACE_PREFS_KEY, JSON.stringify(updated));
    toast.success('Workspace preference saved');
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-800 to-emerald-800 p-6 text-white shadow-2xl md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
              <ShieldCheck className="w-3.5 h-3.5" />
              Driver Settings
            </div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Control account security, alerts, and how the driver workspace behaves.</h1>
            <p className="mt-3 text-sm text-slate-200 md:text-base">
              Server-backed account changes are saved immediately. Workspace and alert display preferences are stored locally until the backend preference endpoints are added.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
            <UserCircle2 className="h-10 w-10 text-emerald-200" />
            <div>
              <div className="text-sm text-slate-200">Signed in as</div>
              <div className="font-semibold">{user?.full_name || 'Driver'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.78fr,1.22fr]">
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm" hover={false}>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                  <UserCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{user?.full_name || 'Driver'}</h2>
                  <p className="text-sm text-slate-500">{user?.email || 'No email available'}</p>
                </div>
              </div>

              <div className="grid gap-3 text-sm">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="text-slate-500">Role</div>
                  <div className="mt-1 font-semibold text-slate-900">{user?.role || 'Driver'}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="text-slate-500">Points earned</div>
                  <div className="mt-1 font-semibold text-slate-900">{user?.points ?? 0}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="text-slate-500">Member since</div>
                  <div className="mt-1 font-semibold text-slate-900">{memberSince}</div>
                </div>
              </div>

              <Button variant="outline" onClick={handleLogout} className="w-full justify-center">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm" hover={false}>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <MonitorSmartphone className="h-5 w-5 text-emerald-600" />
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Workspace behavior</h2>
                  <p className="text-sm text-slate-500">Stored on this device.</p>
                </div>
              </div>

              {[
                ['compactView', 'Use compact cards for dense route views'],
                ['autoRefresh', 'Refresh live task widgets automatically'],
                ['soundAlerts', 'Play sound cues for new alerts'],
                ['showWelcomeBanner', 'Keep dashboard welcome banner visible']
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => togglePreference('workspace', key)}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-left hover:bg-slate-50"
                >
                  <span className="text-sm font-medium text-slate-700">{label}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${workspacePrefs[key] ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {workspacePrefs[key] ? 'On' : 'Off'}
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm" hover={false}>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-3">
                <UserCircle2 className="h-5 w-5 text-emerald-600" />
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Profile</h2>
                  <p className="text-sm text-slate-500">Update the details dispatch uses to reach you.</p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    label="Full name"
                    name="fullName"
                    value={profileData.fullName}
                    onChange={handleProfileChange}
                  />
                  <FormField
                    label="Phone"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    label="Location"
                    name="location"
                    value={profileData.location}
                    onChange={handleProfileChange}
                  />
                  <FormField
                    label="Avatar URL"
                    name="avatarUrl"
                    value={profileData.avatarUrl}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={profileSaving}>
                    {profileSaving ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save profile'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm" hover={false}>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <BellRing className="h-5 w-5 text-emerald-600" />
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Driver notifications</h2>
                  <p className="text-sm text-slate-500">These alert toggles are saved locally for now.</p>
                </div>
              </div>

              {[
                ['taskAssignments', 'New task assignments'],
                ['routeChanges', 'Route changes or re-ordering'],
                ['safetyAlerts', 'Safety and hazard alerts'],
                ['issueUpdates', 'Updates on submitted field reports'],
                ['dailyDigest', 'Daily shift summary']
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => togglePreference('notifications', key)}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-left hover:bg-slate-50"
                >
                  <span className="text-sm font-medium text-slate-700">{label}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${notificationPrefs[key] ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {notificationPrefs[key] ? 'Enabled' : 'Disabled'}
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm" hover={false}>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-emerald-600" />
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Security</h2>
                  <p className="text-sm text-slate-500">Change your password from the live authentication endpoint.</p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <FormField
                  label="Current password"
                  name="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  error={passwordErrors.currentPassword}
                  touched={Boolean(passwordErrors.currentPassword)}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    label="New password"
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    error={passwordErrors.newPassword}
                    touched={Boolean(passwordErrors.newPassword)}
                    helpText="Use at least 8 characters."
                  />
                  <FormField
                    label="Confirm password"
                    name="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    error={passwordErrors.confirmPassword}
                    touched={Boolean(passwordErrors.confirmPassword)}
                  />
                </div>

                {passwordErrors.form && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {passwordErrors.form}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button type="submit" disabled={passwordSaving}>
                    {passwordSaving ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Change password'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4" />
              <p>Profile and password updates are persisted server-side. Notification and workspace toggles are currently stored in the browser because matching backend preference endpoints are not implemented yet.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
