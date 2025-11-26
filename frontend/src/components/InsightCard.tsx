import React from 'react';
import { format } from 'date-fns';
import {
  LightBulbIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChevronRightIcon,
  SparklesIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { Insight, InsightType } from '@/types';

interface InsightCardProps {
  insight: Insight;
  onViewDetails: (insightId: string) => void;
  onDismiss?: (insightId: string) => void;
}

const insightConfig = {
  [InsightType.PATTERN]: {
    icon: ChartBarIcon,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    label: 'Pattern',
  },
  [InsightType.TREND]: {
    icon: ArrowTrendingUpIcon,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    label: 'Trend',
  },
  [InsightType.ANOMALY]: {
    icon: ExclamationTriangleIcon,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
    label: 'Anomaly',
  },
  [InsightType.IMPROVEMENT]: {
    icon: CheckCircleIcon,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    label: 'Improvement',
  },
  [InsightType.WARNING]: {
    icon: ExclamationTriangleIcon,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/20',
    label: 'Warning',
  },
  [InsightType.ADVICE]: {
    icon: LightBulbIcon,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
    label: 'Advice',
  },
};

export default function InsightCard({
  insight,
  onViewDetails,
  onDismiss,
}: InsightCardProps) {
  const config = insightConfig[insight.type as InsightType] || insightConfig[InsightType.ADVICE];
  const Icon = config.icon;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss?.(insight.id);
  };

  return (
    <div
      onClick={() => onViewDetails(insight.id)}
      className="group cursor-pointer glass rounded-lg p-4 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`p-2 rounded-lg ${config.bgColor}`}>
            <Icon className={`h-5 w-5 ${config.color}`} />
          </div>
          <div>
            <span className={`text-xs font-medium ${config.color}`}>
              {config.label}
            </span>
            <div className="flex items-center mt-1">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`h-3 w-3 ${
                      i < Math.floor(insight.confidence * 5)
                        ? 'text-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                {Math.round(insight.confidence * 100)}% confidence
              </span>
            </div>
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={handleDismiss}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <XMarkIcon className="h-4 w-4 text-gray-500" />
          </button>
        )}
      </div>

      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
        {insight.title}
      </h3>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        {insight.description}
      </p>

      {insight.actionItems && insight.actionItems.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Suggestions:
          </p>
          <ul className="space-y-1">
            {insight.actionItems.slice(0, 2).map((item, index) => (
              <li key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-start">
                <SparklesIcon className="h-3 w-3 text-primary-500 mr-1 mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {format(new Date(insight.createdAt), 'MMM d, h:mm a')}
        </span>

        <ChevronRightIcon className="h-4 w-4 text-gray-400 group-hover:text-primary-500 transition-colors duration-200" />
      </div>

      {/* Visual indicator for new insights */}
      {!insight.isRead && (
        <div className="absolute top-2 right-2 h-2 w-2 bg-primary-500 rounded-full animate-pulse" />
      )}
    </div>
  );
}