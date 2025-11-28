import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import InsightCard from '@/components/InsightCard';
import { useAppContext } from '@/store/AppContext';
import { Insight } from '@/types';
import { LightBulbIcon, FunnelIcon } from '@heroicons/react/24/outline';

export default function Insights() {
  const { state } = useAppContext();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/insights');
      const { data } = await response.json();
      setInsights(data.insights || []);
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismissInsight = async (insightId: string) => {
    setInsights(insights.filter(i => i.id !== insightId));
    try {
      await fetch(`/api/insights/${insightId}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to dismiss insight:', error);
    }
  };

  const handleViewDetails = (insightId: string) => {
    // Navigate to insight details or open modal
    console.log('View insight details:', insightId);
  };

  const filteredInsights = filter === 'all'
    ? insights
    : insights.filter(insight => insight.type === filter);

  const insightTypes = [
    { value: 'all', label: 'All Insights' },
    { value: 'pattern', label: 'Patterns' },
    { value: 'trend', label: 'Trends' },
    { value: 'anomaly', label: 'Anomalies' },
    { value: 'improvement', label: 'Improvements' },
    { value: 'warning', label: 'Warnings' },
    { value: 'advice', label: 'Advice' },
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Insights
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Discover patterns and trends in your mood journal
          </p>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {insightTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredInsights.length === 0 ? (
          <div className="text-center py-12">
            <LightBulbIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No insights yet
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {filter === 'all'
                ? 'Keep journaling to generate insights about your mood patterns'
                : `No ${filter} insights found. Try a different filter or continue journaling.`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInsights.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                onViewDetails={handleViewDetails}
                onDismiss={handleDismissInsight}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}