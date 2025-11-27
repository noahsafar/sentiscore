import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { Entry } from '@/types';
import { getDateRange, isEntryInDateRange } from '@/utils/helpers';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale
);

interface MoodChartProps {
  entries: Entry[];
  timeRange: 'week' | 'month' | 'year' | 'all';
  onTimeRangeChange: (range: 'week' | 'month' | 'year' | 'all') => void;
  showAverage?: boolean;
}

export default function MoodChart({
  entries,
  timeRange,
  onTimeRangeChange,
  showAverage = true,
}: MoodChartProps) {
  // Filter entries based on time range
  const filteredEntries = useMemo(() => {
    if (timeRange === 'all') return entries;
    const range = getDateRange(timeRange);
    return entries.filter(entry => isEntryInDateRange(entry, range));
  }, [entries, timeRange]);

  // Prepare chart data
  const chartData = useMemo(() => {
    // Filter out entries with invalid dates and sort the rest
    const validEntries = filteredEntries.filter(entry => {
      const date = new Date(entry.date);
      return !isNaN(date.getTime());
    });

    const sortedEntries = [...validEntries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return {
      labels: sortedEntries.map(entry => new Date(entry.date)),
      datasets: [
        {
          label: 'Overall Mood',
          data: sortedEntries.map(entry => entry.moodScores.overall),
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: 'rgb(99, 102, 241)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        },
        {
          label: 'Happiness',
          data: sortedEntries.map(entry => entry.moodScores.happiness),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
          fill: false,
          pointRadius: 3,
          pointHoverRadius: 5,
          borderDash: [5, 5],
        },
        {
          label: 'Stress',
          data: sortedEntries.map(entry => 10 - entry.moodScores.stress), // Invert stress for better visualization
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
          fill: false,
          pointRadius: 3,
          pointHoverRadius: 5,
          borderDash: [5, 5],
        },
        {
          label: 'Energy',
          data: sortedEntries.map(entry => entry.moodScores.energy),
          borderColor: 'rgb(245, 158, 11)',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          tension: 0.4,
          fill: false,
          pointRadius: 3,
          pointHoverRadius: 5,
          borderDash: [5, 5],
        },
      ],
    };
  }, [filteredEntries]);

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          title: (context: any) => {
            const date = new Date(context[0].label);
            return date.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });
          },
          label: (context: any) => {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (label === 'Stress: ') {
              label = 'Stress: ' + (10 - context.parsed.y).toFixed(1) + '/10';
            } else {
              label += context.parsed.y.toFixed(1) + '/10';
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: timeRange === 'week' ? 'day' as const : timeRange === 'month' ? 'week' as const : 'month' as const,
          displayFormats: {
            day: 'MMM dd',
            week: 'MMM dd',
            month: 'MMM yyyy',
          },
        },
        grid: {
          display: false,
        },
      },
      y: {
        min: 0,
        max: 10,
        ticks: {
          stepSize: 2,
          callback: (value: string | number) => typeof value === 'number' ? value.toFixed(0) : parseFloat(value).toFixed(0),
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  // Calculate mood averages
  const averages = useMemo(() => {
    if (filteredEntries.length === 0) return null;

    const totals = filteredEntries.reduce(
      (acc, entry) => ({
        overall: acc.overall + entry.moodScores.overall,
        happiness: acc.happiness + entry.moodScores.happiness,
        stress: acc.stress + entry.moodScores.stress,
        energy: acc.energy + entry.moodScores.energy,
      }),
      { overall: 0, happiness: 0, stress: 0, energy: 0 }
    );

    const count = filteredEntries.length;
    return {
      overall: (totals.overall / count).toFixed(1),
      happiness: (totals.happiness / count).toFixed(1),
      stress: (totals.stress / count).toFixed(1),
      energy: (totals.energy / count).toFixed(1),
    };
  }, [filteredEntries]);

  return (
    <div className="h-full">
      {/* Header with averages */}
      {showAverage && averages && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Overall</p>
            <p className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
              {averages.overall}/10
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Happiness</p>
            <p className="text-lg font-semibold text-green-600 dark:text-green-400">
              {averages.happiness}/10
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Stress</p>
            <p className="text-lg font-semibold text-red-600 dark:text-red-400">
              {averages.stress}/10
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Energy</p>
            <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
              {averages.energy}/10
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="relative h-80">
        {filteredEntries.length > 0 ? (
          <Line data={chartData} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                No data for this time period
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Time range selector */}
      <div className="flex justify-center mt-6 space-x-2">
        {(['week', 'month', 'year', 'all'] as const).map((range) => (
          <button
            key={range}
            onClick={() => onTimeRangeChange(range)}
            className={`
              px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
              ${timeRange === range
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
              }
            `}
          >
            {range === 'all' ? 'All Time' : `Last ${range.charAt(0).toUpperCase() + range.slice(1)}`}
          </button>
        ))}
      </div>
    </div>
  );
}