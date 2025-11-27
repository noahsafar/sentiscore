import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAppContext, appActions } from '@/store/AppContext';
import { Entry, DashboardData } from '@/types';
import Layout from '@/components/Layout';
import VoiceRecorder from '@/components/VoiceRecorder';
import MoodChart from '@/components/MoodChart';
import EntryCard from '@/components/EntryCard';
import InsightCard from '@/components/InsightCard';
import QuickStats from '@/components/QuickStats';
import { CalendarIcon, ChartBarIcon, MicrophoneIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

export default function Dashboard() {
  const router = useRouter();
  const { state, dispatch } = useAppContext();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('month');

  useEffect(() => {
    if (!state.user) {
      router.push('/login');
      return;
    }

    loadDashboardData();
  }, [state.user]);

  const loadDashboardData = async () => {
    try {
      dispatch(appActions.setLoading(true));

      // Load entries
      const entriesResponse = await fetch('http://localhost:8000/api/entries?limit=10');
      if (entriesResponse.ok) {
        const { data } = await entriesResponse.json();
        dispatch(appActions.setEntries(data.data || []));
      }

      // Load insights
      const insightsResponse = await fetch('http://localhost:8000/api/insights?limit=5');
      if (insightsResponse.ok) {
        const { data } = await insightsResponse.json();
        dispatch(appActions.setInsights(data.insights || []));
      }

      // Load dashboard stats
      const statsResponse = await fetch('http://localhost:8000/api/dashboard/stats');
      if (statsResponse.ok) {
        const { data } = await statsResponse.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      dispatch(appActions.setError('Failed to load dashboard data'));
    } finally {
      dispatch(appActions.setLoading(false));
    }
  };

  const handleVoiceRecording = async (recording: Blob, transcript: string) => {
    console.log('🎤 handleVoiceRecording called with transcript:', transcript);
    try {
      dispatch(appActions.setRecordingState('processing'));

      // Get today's date (no time component) for comparison
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to midnight for accurate date comparison

      // Check if there's already an entry for today
      const todayEntry = state.entries?.find(entry => {
        const entryDate = new Date(entry.date);
        entryDate.setHours(0, 0, 0, 0); // Also set to midnight
        return entryDate.getTime() === today.getTime();
      });

      const formData = new FormData();
      formData.append('audio', recording, 'recording.webm');
      formData.append('transcript', transcript);
      formData.append('date', new Date().toISOString());

      if (todayEntry) {
        // Replace existing entry
        console.log('🔄 Replacing today\'s entry...');
        console.log('📝 Existing entry ID:', todayEntry.id);
        console.log('📝 Existing date:', todayEntry.date);
        console.log('📝 New transcript:', transcript);

        const response = await fetch(`http://localhost:8000/api/entries/${todayEntry.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transcript,
            date: new Date().toISOString(),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update entry');
        }

        const { data } = await response.json();
        console.log('✅ Entry replaced:', data);
        toast.success('Today\'s entry has been replaced!');
        dispatch(appActions.updateEntry(data));
      } else {
        // Create new entry
        console.log('📤 Creating new entry for today...');
        console.log('📝 Transcript:', transcript);

        const response = await fetch('http://localhost:8000/api/entries', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to save entry');
        }

        const { data } = await response.json();
        console.log('✅ New entry saved:', data);
        toast.success('Daily entry saved successfully!');
        dispatch(appActions.addEntry(data));
      }

      // Reload all dashboard data after adding/replacing entry
      await loadDashboardData();
    } catch (error) {
      console.error('❌ Failed to save entry:', error);
      dispatch(appActions.setError('Failed to save your journal entry'));
    } finally {
      dispatch(appActions.setRecordingState('idle'));
    }
  };

  const hasEntryToday = state.entries && state.entries.some(entry => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);

    return entryDate.getTime() === today.getTime();
  });

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {state.user?.name || 'there'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {hasEntryToday
              ? "Daily entry complete! Record again to replace today's entry."
              : "How are you feeling today? Let's record your daily check-in."}
          </p>
        </div>

        {/* Quick Stats */}
        {dashboardData && (
          <QuickStats
            currentStreak={dashboardData.currentStreak}
            longestStreak={dashboardData.longestStreak}
            totalEntries={dashboardData.totalEntries}
            averageMood={dashboardData.averageMood}
          />
        )}

        {/* Voice Recorder Section */}
        <div className="mb-8">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <MicrophoneIcon className="h-6 w-6 text-primary-500 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {hasEntryToday ? "Replace Today's Entry" : "Daily Check-in"}
                </h2>
              </div>
              {hasEntryToday && (
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                  ✓ Recorded
                </span>
              )}
            </div>
            {hasEntryToday ? (
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400">
                  You've completed your daily check-in. Would you like to record a new entry?
                </p>
                <button
                  onClick={() => {
                    if (confirm('This will replace today\'s entry. Continue?')) {
                      // Remove today's entry and enable recording
                      const todayEntry = state.entries.find(
                        entry => new Date(entry.date).toDateString() === new Date().toDateString()
                      );
                      if (todayEntry) {
                        dispatch(appActions.deleteEntry(todayEntry.id));
                      }
                    }
                  }}
                  className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <MicrophoneIcon className="h-4 w-4 mr-2" />
                  Re-record Today's Entry
                </button>
              </div>
            ) : (
              <VoiceRecorder
                onRecordingComplete={handleVoiceRecording}
                disabled={state.recordingState === 'processing'}
                hasEntryToday={hasEntryToday}
              />
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mood Chart - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <ChartBarIcon className="h-6 w-6 text-primary-500 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Mood Trends
                  </h2>
                </div>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as any)}
                  className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                >
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="year">Last Year</option>
                  <option value="all">All Time</option>
                </select>
              </div>
              <MoodChart
                entries={state.entries}
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
              />
            </div>
          </div>

          {/* Insights Column */}
          <div className="lg:col-span-1">
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center mb-4">
                <ArrowTrendingUpIcon className="h-6 w-6 text-primary-500 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Insights
                </h2>
              </div>
              <div className="space-y-4">
                {state.insights.length > 0 ? (
                  state.insights.slice(0, 3).map((insight) => (
                    <InsightCard
                      key={insight.id}
                      insight={insight}
                      onViewDetails={() => router.push(`/insights/${insight.id}`)}
                      onDismiss={() => {
                        // TODO: Implement dismiss insight
                      }}
                    />
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    Keep journaling to unlock insights about your mood patterns!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Entries */}
        <div className="mt-12">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <CalendarIcon className="h-6 w-6 text-primary-500 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Recent Entries
                </h2>
              </div>
              <button
                onClick={() => router.push('/entries')}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View All
              </button>
            </div>
            <div className="space-y-4">
              {state.entries.length > 0 ? (
                state.entries.slice(0, 5).map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    showFullTranscript={false}
                    onEdit={() => dispatch(appActions.setSelectedEntry(entry))}
                    onDelete={async () => {
                      // TODO: Implement delete confirmation
                      try {
                        await fetch(`http://localhost:8000/api/entries/${entry.id}`, {
                          method: 'DELETE',
                        });
                        dispatch(appActions.deleteEntry(entry.id));
                      } catch (error) {
                        console.error('Failed to delete entry:', error);
                      }
                    }}
                  />
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No entries yet. Start by recording your first check-in!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}