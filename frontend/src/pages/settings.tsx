import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useAppContext } from '@/store/AppContext';
import {
  CogIcon,
  BellIcon,
  MoonIcon,
  ShieldCheckIcon,
  ArrowDownTrayIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

export default function Settings() {
  const { state } = useAppContext();
  const [preferences, setPreferences] = useState({
    theme: 'light' as 'light' | 'dark' | 'auto',
    language: 'en',
    notifications: {
      dailyReminder: true,
      reminderTime: '09:00',
      emailNotifications: false,
      insights: true,
      weeklyReport: true,
      monthlyReport: false,
    },
    privacy: {
      dataRetention: 12,
      shareInsights: false,
      anonymizeData: true,
    },
  });

  useEffect(() => {
    if (state.user && state.user.preferences) {
      setPreferences({
        theme: state.user.preferences.theme || 'light',
        language: state.user.preferences.language || 'en',
        notifications: {
          dailyReminder: state.user.preferences.notifications?.dailyReminder ?? true,
          reminderTime: state.user.preferences.notifications?.reminderTime || '09:00',
          emailNotifications: state.user.preferences.notifications?.emailNotifications ?? false,
          insights: state.user.preferences.notifications?.insights ?? true,
          weeklyReport: state.user.preferences.notifications?.weeklyReport ?? true,
          monthlyReport: state.user.preferences.notifications?.monthlyReport ?? false,
        },
        privacy: {
          dataRetention: state.user.preferences.privacy?.dataRetention || 12,
          shareInsights: state.user.preferences.privacy?.shareInsights ?? false,
          anonymizeData: state.user.preferences.privacy?.anonymizeData ?? true,
        },
      });
    }
  }, [state.user]);

  const handleSavePreferences = async () => {
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        toast.success('Preferences saved successfully!');
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    }
  };

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/user/export');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mood-journal-export.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('Data exported successfully!');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        const response = await fetch('/api/user/account', {
          method: 'DELETE',
        });
        if (response.ok) {
          localStorage.clear();
          window.location.href = '/login';
        } else {
          throw new Error('Failed to delete account');
        }
      } catch (error) {
        console.error('Error deleting account:', error);
        toast.error('Failed to delete account');
      }
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
          Settings
        </h1>

        {/* Appearance */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <MoonIcon className="h-5 w-5 text-gray-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Appearance
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Theme
                </label>
                <select
                  value={preferences.theme}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      theme: e.target.value as 'light' | 'dark' | 'auto',
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Language
                </label>
                <select
                  value={preferences.language}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      language: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <BellIcon className="h-5 w-5 text-gray-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notifications
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Daily Reminder
                </label>
                <input
                  type="checkbox"
                  checked={preferences.notifications.dailyReminder}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      notifications: {
                        ...preferences.notifications,
                        dailyReminder: e.target.checked,
                      },
                    })
                  }
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </div>

              {preferences.notifications.dailyReminder && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reminder Time
                  </label>
                  <input
                    type="time"
                    value={preferences.notifications.reminderTime}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        notifications: {
                          ...preferences.notifications,
                          reminderTime: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Notifications
                </label>
                <input
                  type="checkbox"
                  checked={preferences.notifications.emailNotifications}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      notifications: {
                        ...preferences.notifications,
                        emailNotifications: e.target.checked,
                      },
                    })
                  }
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Privacy */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <ShieldCheckIcon className="h-5 w-5 text-gray-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Privacy
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data Retention (months)
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={preferences.privacy.dataRetention}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      privacy: {
                        ...preferences.privacy,
                        dataRetention: parseInt(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Share Insights for Research
                </label>
                <input
                  type="checkbox"
                  checked={preferences.privacy.shareInsights}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      privacy: {
                        ...preferences.privacy,
                        shareInsights: e.target.checked,
                      },
                    })
                  }
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Data Management
            </h2>

            <div className="space-y-3">
              <button
                onClick={handleExportData}
                className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                Export Data
              </button>

              <button
                onClick={handleDeleteAccount}
                className="flex items-center px-4 py-2 border border-red-300 dark:border-red-600 rounded-lg text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <TrashIcon className="h-5 w-5 mr-2" />
                Delete Account
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSavePreferences}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </Layout>
  );
}