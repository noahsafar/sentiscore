import React from 'react';
import {
  FireIcon,
  CalendarIcon,
  ChartBarIcon,
  FaceSmileIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface QuickStatsProps {
  currentStreak: number;
  longestStreak: number;
  totalEntries: number;
  averageMood: {
    thisWeek: number;
    thisMonth: number;
    lastMonth: number;
  };
}

export default function QuickStats({
  currentStreak,
  longestStreak,
  totalEntries,
  averageMood,
}: QuickStatsProps) {
  const stats = [
    {
      name: 'Current Streak',
      value: currentStreak,
      unit: 'days',
      icon: FireIcon,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    },
    {
      name: 'Total Entries',
      value: totalEntries,
      unit: '',
      icon: CalendarIcon,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      name: 'Longest Streak',
      value: longestStreak,
      unit: 'days',
      icon: ChartBarIcon,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
    {
      name: 'This Month',
      value: averageMood.thisMonth.toFixed(1),
      unit: '/10',
      icon: FaceSmileIcon,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      trend: averageMood.thisMonth > averageMood.lastMonth ? 'up' : 'down',
      trendValue: Math.abs(averageMood.thisMonth - averageMood.lastMonth).toFixed(1),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const isStreak = stat.name.includes('Streak');
        const percentage = isStreak && stat.value > 0
          ? Math.min((stat.value / 30) * 100, 100)
          : stat.name === 'Total Entries'
          ? Math.min((stat.value / 100) * 100, 100)
          : (parseFloat(stat.value) / 10) * 100;

        return (
          <div
            key={stat.name}
            className="glass rounded-xl p-6 hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.name}
                </p>
                <div className="flex items-baseline mt-2">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                  {stat.unit && (
                    <p className="ml-1 text-sm text-gray-500 dark:text-gray-400">
                      {stat.unit}
                    </p>
                  )}
                </div>
                {stat.trend && (
                  <div className="flex items-center mt-2">
                    <svg
                      className={`h-4 w-4 mr-1 ${
                        stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      {stat.trend === 'up' ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                      ) : (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                        />
                      )}
                    </svg>
                    <p className={`text-xs ${
                      stat.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {stat.trend === 'up' ? '+' : '-'}{stat.trendValue} from last month
                    </p>
                  </div>
                )}
              </div>
              <div className="relative">
                {/* Background circle */}
                <div className={`
                  w-12 h-12 rounded-full ${stat.bgColor} flex items-center justify-center
                `}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>

                {/* Progress ring for certain stats */}
                {(isStreak || stat.name === 'Total Entries' || stat.name === 'This Month') && (
                  <svg className="absolute top-0 left-0 w-12 h-12 -rotate-90">
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      className="text-gray-200 dark:text-gray-700"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      strokeDasharray={`${percentage} ${100 - percentage}`}
                      className={stat.color}
                      style={{
                        transition: 'stroke-dasharray 0.5s ease-in-out',
                      }}
                    />
                  </svg>
                )}
              </div>
            </div>

            {/* Additional context for streaks */}
            {isStreak && stat.value > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Last entry: {format(new Date(), 'MMM d')}
                </p>
              </div>
            )}

            {/* Motivational message */}
            {stat.name === 'Current Streak' && stat.value === 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-primary-600 dark:text-primary-400">
                  Start your streak today!
                </p>
              </div>
            )}

            {/* Achievement badge */}
            {stat.name === 'Current Streak' && stat.value >= 7 && (
              <div className="mt-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                  🔥 On a roll!
                </span>
              </div>
            )}

            {stat.name === 'Total Entries' && stat.value >= 30 && (
              <div className="mt-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  📊 Committed!
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}