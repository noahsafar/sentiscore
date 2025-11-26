import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import MoodChart from '@/components/MoodChart';
import { useAppContext } from '@/store/AppContext';
import { ChartBarIcon, CalendarIcon, FireIcon, FaceSmileIcon } from '@heroicons/react/24/outline';

export default function Analytics() {
  const { state } = useAppContext();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('month');
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics?range=${timeRange}`);
      const { data } = await response.json();
      setChartData(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const timeRanges = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
    { value: 'all', label: 'All Time' },
  ];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Analytics
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track your mood patterns and progress over time
              </p>
            </div>

            {/* Time Range Selector */}
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {timeRanges.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass rounded-xl p-6 hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Current Streak
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {chartData?.currentStreak || 0}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">days</p>
                </div>
                <FireIcon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </div>

            <div className="glass rounded-xl p-6 hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Entries
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {chartData?.totalEntries || 0}
                  </p>
                </div>
                <CalendarIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>

            <div className="glass rounded-xl p-6 hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Average Mood
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {chartData?.averageMood?.overall ? chartData.averageMood.overall.toFixed(1) : '0.0'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">/10</p>
                </div>
                <FaceSmileIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>

            <div className="glass rounded-xl p-6 hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    This Month
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {chartData?.averageMood?.thisMonth ? chartData.averageMood.thisMonth.toFixed(1) : '0.0'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">/10</p>
                </div>
                <ChartBarIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : chartData ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mood Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Mood Trends
              </h2>
              <MoodChart
                entries={chartData?.entries || []}
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
                showAverage={true}
              />
            </div>

            {/* Mood Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Mood Breakdown
              </h2>
              <div className="space-y-3">
                {Object.entries(chartData.averageMoods || {}).map(([mood, value]) => (
                  <div key={mood} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                      {mood.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: `${(value as number) * 10}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {(value as number).toFixed(1)}/10
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Patterns */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recent Patterns
              </h2>
              <div className="space-y-3">
                {chartData.patterns?.length > 0 ? (
                  chartData.patterns.map((pattern: any, index: number) => (
                    <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {pattern.title}
                      </p>
                      <p>{pattern.description}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Not enough data to detect patterns yet
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No data available
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Start journaling to see your analytics here
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}