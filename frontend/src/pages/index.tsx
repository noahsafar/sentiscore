import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAppContext, appActions } from '@/store/AppContext';
import { Entry, DashboardData } from '@/types';
import Layout from '@/components/Layout';
import MoodChart from '@/components/MoodChart';
import InsightCard from '@/components/InsightCard';
import QuickStats from '@/components/QuickStats';
import VoiceRecorder from '@/components/VoiceRecorder';
import { ChartBarIcon, MicrophoneIcon, ArrowTrendingUpIcon, ChevronDownIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { saveOrReplaceTodayEntry, findTodayEntry } from '@/utils/entryHelpers';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const router = useRouter();
  const { state, dispatch } = useAppContext();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('month');
  const [selectedInsightIndex, setSelectedInsightIndex] = useState(0);

  useEffect(() => {
    if (!state.user) {
      router.push('/login');
      return;
    }

    loadDashboardData();
  }, [state.user]); // Load data when component mounts or user changes

  // Always refresh data when component mounts (handles page refresh and navigation)
  useEffect(() => {
    if (state.user) {
      loadDashboardData();
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Additional effect to refresh data when component becomes visible (handles navigation)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && state.user) {
        loadDashboardData();
      }
    };

    const handleFocus = () => {
      if (state.user) {
        loadDashboardData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [state.user]);

  const loadDashboardData = async () => {
    try {
      dispatch(appActions.setLoading(true));

      // Load entries
      const entriesResponse = await fetch('http://localhost:8000/api/entries?limit=10');
      if (entriesResponse.ok) {
        const { data } = await entriesResponse.json();
        dispatch(appActions.setEntries(data.entries || []));
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

      // Use centralized function to save or replace today's entry
      const result = await saveOrReplaceTodayEntry(
        state.entries || [],
        transcript,
        recording
      );

      // Update the app state
      if (result.wasReplaced) {
        dispatch(appActions.updateEntry(result.entry));
        toast.success('Today\'s entry has been replaced!');
      } else {
        dispatch(appActions.addEntry(result.entry));
        toast.success('Daily entry saved successfully!');
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

  const hasEntryToday = findTodayEntry(state.entries) !== null;

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

        {/* Voice Check-in Section */}
        <div className="mb-8 mt-8">
          <div className="glass rounded-2xl p-6">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-4">
                <MicrophoneIcon className="h-6 w-6 text-primary-500 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {hasEntryToday ? "Replace Today's Entry" : "Daily Check-in"}
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Take a moment to reflect on how you're feeling
              </p>
              {hasEntryToday && (
                <div className="inline-flex items-center space-x-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-4 py-2 rounded-full">
                  <CheckCircleIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">Check-in complete for today</span>
                </div>
              )}
            </div>

            <VoiceRecorder
              onRecordingComplete={handleVoiceRecording}
              hasEntryToday={hasEntryToday}
            />
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
            <div className="glass rounded-2xl p-6 h-full flex flex-col">
              <div className="flex items-center mb-4">
                <ArrowTrendingUpIcon className="h-6 w-6 text-primary-500 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Insights
                </h2>
              </div>

              {state.insights.length > 0 ? (
                <>
                  {/* Selected Insight Content */}
                  <div className="flex-1 min-h-0 overflow-y-auto">
                    <div className="h-full">
                      <InsightCard
                        insight={state.insights[selectedInsightIndex]}
                        onViewDetails={() => router.push(`/insights/${state.insights[selectedInsightIndex].id}`)}
                        onDismiss={() => {
                          // TODO: Implement dismiss insight
                        }}
                      />
                    </div>
                  </div>

                  {/* Elegant dot indicators */}
                  <div className="flex justify-center space-x-3 mt-4">
                    {state.insights.slice(0, 3).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedInsightIndex(index)}
                        className={`group relative transition-all duration-200 ${
                          selectedInsightIndex === index ? 'scale-125' : 'hover:scale-110'
                        }`}
                      >
                        <div className={`h-3 w-3 rounded-full transition-all duration-200 ${
                          selectedInsightIndex === index
                            ? 'bg-primary-600 shadow-lg shadow-primary-500/50'
                            : 'bg-gray-300 dark:bg-gray-600 group-hover:bg-gray-400 dark:group-hover:bg-gray-500'
                        }`} />
                        {selectedInsightIndex === index && (
                          <div className="absolute inset-0 h-3 w-3 rounded-full bg-primary-400 animate-ping opacity-75"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <ArrowTrendingUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Keep journaling to unlock insights about your mood patterns!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}