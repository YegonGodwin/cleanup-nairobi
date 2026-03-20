
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import FormField from '../components/ui/FormField';
import { Button } from '../components/ui/Button';
import { notificationsAPI, authAPI } from '../services/api';
import { 
  FaBell, 
  FaLock, 
  FaCog, 
  FaShieldAlt, 
  FaGlobe, 
  FaMoon, 
  FaSun,
  FaCheck,
  FaExclamationTriangle
} from 'react-icons/fa';

const Settings = () => {
  const { user } = useAuth();
  
  // Notification States
  const [notifPrefs, setNotifPrefs] = useState({
    email: true,
    sms: false,
    push: true,
    marketing: false
  });
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  // Password Change States
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // App Settings States
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const fetchPrefs = async () => {
      setLoadingNotifs(true);
      try {
        const response = await notificationsAPI.getPreferences();
        if (response.success && response.data) {
          setNotifPrefs(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch notification preferences:', error);
      } finally {
        setLoadingNotifs(false);
      }
    };

    fetchPrefs();
  }, []);

  const handleNotifToggle = async (name) => {
    const newPrefs = { ...notifPrefs, [name]: !notifPrefs[name] };
    setNotifPrefs(newPrefs);
    
    try {
      await notificationsAPI.updatePreferences(newPrefs);
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      // Revert on failure
      setNotifPrefs(notifPrefs);
    }
  };

  const handlePasswordChange = (name, value) => {
    setPasswordData(prev => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) {
      setPasswordErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[name];
        return newErrs;
      });
    }
    setPasswordSuccess(false);
  };

  const validatePasswordForm = () => {
    const errors = {};
    if (!passwordData.currentPassword) errors.currentPassword = 'Current password is required';
    if (!passwordData.newPassword) errors.newPassword = 'New password is required';
    if (passwordData.newPassword.length < 8) errors.newPassword = 'Password must be at least 8 characters';
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;

    setChangingPassword(true);
    try {
      const result = await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (result.success) {
        setPasswordSuccess(true);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      setPasswordErrors({ form: error.message || 'Failed to change password' });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account security, notifications, and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Navigation / Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-8 border-none shadow-lg overflow-hidden">
            <nav className="flex flex-col">
              <a href="#notifications" className="flex items-center gap-3 p-4 text-green-700 bg-green-50 font-medium border-l-4 border-green-500">
                <FaBell /> Notifications
              </a>
              <a href="#security" className="flex items-center gap-3 p-4 text-gray-600 hover:bg-gray-50 transition-colors border-l-4 border-transparent">
                <FaLock /> Security
              </a>
              <a href="#appearance" className="flex items-center gap-3 p-4 text-gray-600 hover:bg-gray-50 transition-colors border-l-4 border-transparent">
                <FaCog /> Appearance
              </a>
              <a href="#privacy" className="flex items-center gap-3 p-4 text-gray-600 hover:bg-gray-50 transition-colors border-l-4 border-transparent">
                <FaShieldAlt /> Privacy
              </a>
            </nav>
          </Card>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Notifications Section */}
          <section id="notifications" className="scroll-mt-8">
            <Card className="border-none shadow-xl">
              <CardHeader>
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <FaBell />
                  <span className="text-xs font-bold uppercase tracking-wider">Communication</span>
                </div>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose how you want to be notified about waste collections and reports.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="font-semibold text-gray-900">Email Notifications</p>
                    <p className="text-sm text-gray-500">Receive updates and weekly summaries via email.</p>
                  </div>
                  <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input 
                      type="checkbox" 
                      name="email" 
                      id="email-toggle"
                      checked={notifPrefs.email}
                      onChange={() => handleNotifToggle('email')}
                      className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                    />
                    <label 
                      htmlFor="email-toggle" 
                      className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors ${notifPrefs.email ? 'bg-green-500' : 'bg-gray-300'}`}
                    ></label>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="font-semibold text-gray-900">SMS Alerts</p>
                    <p className="text-sm text-gray-500">Get urgent alerts about collection delays via text.</p>
                  </div>
                  <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input 
                      type="checkbox" 
                      name="sms" 
                      id="sms-toggle"
                      checked={notifPrefs.sms}
                      onChange={() => handleNotifToggle('sms')}
                      className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                    />
                    <label 
                      htmlFor="sms-toggle" 
                      className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors ${notifPrefs.sms ? 'bg-green-500' : 'bg-gray-300'}`}
                    ></label>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="font-semibold text-gray-900">Push Notifications</p>
                    <p className="text-sm text-gray-500">Enable real-time updates in your browser or app.</p>
                  </div>
                  <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input 
                      type="checkbox" 
                      name="push" 
                      id="push-toggle"
                      checked={notifPrefs.push}
                      onChange={() => handleNotifToggle('push')}
                      className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                    />
                    <label 
                      htmlFor="push-toggle" 
                      className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors ${notifPrefs.push ? 'bg-green-500' : 'bg-gray-300'}`}
                    ></label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Security Section */}
          <section id="security" className="scroll-mt-8">
            <Card className="border-none shadow-xl">
              <CardHeader>
                <div className="flex items-center gap-2 text-red-600 mb-1">
                  <FaShieldAlt />
                  <span className="text-xs font-bold uppercase tracking-wider">Security</span>
                </div>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your password to keep your account secure.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={onPasswordSubmit} className="space-y-4">
                  <FormField
                    label="Current Password"
                    name="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    error={passwordErrors.currentPassword}
                    touched={true}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      label="New Password"
                      name="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      error={passwordErrors.newPassword}
                      touched={true}
                      helpText="At least 8 characters"
                    />
                    <FormField
                      label="Confirm New Password"
                      name="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      error={passwordErrors.confirmPassword}
                      touched={true}
                    />
                  </div>

                  {passwordErrors.form && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-md flex items-center gap-2 text-sm">
                      <FaExclamationTriangle /> {passwordErrors.form}
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="p-3 bg-green-50 text-green-700 rounded-md flex items-center gap-2 text-sm animate-bounce">
                      <FaCheck /> Password updated successfully!
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-100 flex justify-end">
                    <Button 
                      type="submit" 
                      variant="primary" 
                      loading={changingPassword}
                      className="px-8"
                    >
                      Update Password
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </section>

          {/* Appearance Section */}
          <section id="appearance" className="scroll-mt-8">
            <Card className="border-none shadow-xl">
              <CardHeader>
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <FaCog />
                  <span className="text-xs font-bold uppercase tracking-wider">Visual</span>
                </div>
                <CardTitle>Appearance & Preferences</CardTitle>
                <CardDescription>Customize how Clean-up Nairobi looks on your device.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg text-gray-500">
                      {darkMode ? <FaMoon /> : <FaSun />}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Dark Mode</p>
                      <p className="text-sm text-gray-500">Reduce glare and improve battery life.</p>
                    </div>
                  </div>
                  <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input 
                      type="checkbox" 
                      name="darkMode" 
                      id="darkmode-toggle"
                      checked={darkMode}
                      onChange={() => setDarkMode(!darkMode)}
                      className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                    />
                    <label 
                      htmlFor="darkmode-toggle" 
                      className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors ${darkMode ? 'bg-indigo-500' : 'bg-gray-300'}`}
                    ></label>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg text-gray-500">
                      <FaGlobe />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Language</p>
                      <p className="text-sm text-gray-500">Select your preferred display language.</p>
                    </div>
                  </div>
                  <select 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block p-2.5"
                  >
                    <option value="en">English</option>
                    <option value="sw">Swahili</option>
                    <option value="fr">French</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .toggle-checkbox:checked {
          right: 0;
          border-color: transparent;
        }
        .toggle-checkbox {
          right: 1.5rem;
          transition: all 0.3s;
          border-color: #D1D5DB;
        }
      `}} />
    </div>
  );
};

export default Settings;
