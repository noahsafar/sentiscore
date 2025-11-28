import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  EllipsisHorizontalIcon,
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  TrashIcon,
  PencilIcon,
  ShareIcon,
  EyeIcon,
  EyeSlashIcon,
  ChevronDownIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { Entry } from '@/types';
import { getMoodEmoji, calculateMoodColor, truncateText } from '@/utils/helpers';

interface EntryCardProps {
  entry: Entry;
  showFullTranscript?: boolean;
  onEdit?: (entry: Entry) => void;
  onDelete?: (entryId: string) => void;
  onShare?: (entry: Entry) => void;
}

export default function EntryCard({
  entry,
  showFullTranscript = false,
  onEdit,
  onDelete,
  onShare,
}: EntryCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showFullText, setShowFullText] = useState(showFullTranscript);
  const [showTranscript, setShowTranscript] = useState(false);

  const togglePlayPause = () => {
    if (!entry.audioUrl) return;

    const audio = new Audio(entry.audioUrl);

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
      audio.onended = () => setIsPlaying(false);
    }

    setIsPlaying(!isPlaying);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      onDelete?.(entry.id);
      setShowMenu(false);
    }
  };

  const formatDate = (dateInput: string | Date) => {
    // Handle both string dates and Date objects
    let date: Date;
    try {
      date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

      // Check if the date is invalid
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
    } catch (error) {
      // Return a fallback if date parsing fails
      return 'Unknown date';
    }

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today, ' + format(date, 'h:mm a');
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday, ' + format(date, 'h:mm a');
    }
    return format(date, 'MMM d, yyyy, h:mm a');
  };

  const shouldTruncate = entry.transcript.length > 200;
  const displayText = shouldTruncate && !showFullText
    ? truncateText(entry.transcript, 200)
    : entry.transcript;

  return (
    <div className="glass rounded-xl p-6 hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{getMoodEmoji(entry.moodScores.overall)}</span>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {formatDate(entry.date)}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`text-sm font-medium ${calculateMoodColor(entry.moodScores.overall)}`}>
                  {entry.moodScores.overall.toFixed(1)}/10
                </span>
                {entry.duration && entry.duration > 0 && (
                  <span className="text-xs text-gray-500">
                    • {Math.floor(entry.duration / 60)}:{(entry.duration % 60).toString().padStart(2, '0')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Menu button */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <EllipsisHorizontalIcon className="h-5 w-5 text-gray-500" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
              {onEdit && (
                <button
                  onClick={() => {
                    onEdit(entry);
                    setShowMenu(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <PencilIcon className="h-4 w-4 mr-3" />
                  Edit
                </button>
              )}
              {onShare && (
                <button
                  onClick={() => {
                    onShare(entry);
                    setShowMenu(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ShareIcon className="h-4 w-4 mr-3" />
                  Share
                </button>
              )}
              <button
                onClick={() => {
                  // Toggle visibility
                  setShowMenu(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {entry.isPublic ? (
                  <>
                    <EyeSlashIcon className="h-4 w-4 mr-3" />
                    Make Private
                  </>
                ) : (
                  <>
                    <EyeIcon className="h-4 w-4 mr-3" />
                    Make Public
                  </>
                )}
              </button>
              {onDelete && (
                <button
                  onClick={handleDelete}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <TrashIcon className="h-4 w-4 mr-3" />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mood Score Gauge */}
      <div className="mb-4">
        <div className="relative">
          {/* Gauge line */}
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full relative overflow-hidden">
            {/* Gradient fill based on mood score */}
            <div
              className="h-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${(entry.moodScores.overall / 10) * 100}%` }}
            />
            {/* Marker/indicator */}
            <div
              className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-gray-900 border-2 border-gray-800 dark:border-gray-200 rounded-full shadow-md transition-all duration-300"
              style={{ left: `${(entry.moodScores.overall / 10) * 100}%` }}
            />
          </div>
          {/* Scale labels */}
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">0</span>
            <span className="text-xs text-gray-500">10</span>
          </div>
        </div>
      </div>

      {/* Transcript */}
      <div className="mb-4">
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {displayText}
        </p>
        {shouldTruncate && !showFullText && (
          <button
            onClick={() => setShowFullText(true)}
            className="mt-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
          >
            Read more
          </button>
        )}
      </div>

      {/* Tags */}
      {entry.tags && entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {entry.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Transcript Dropdown */}
      {(entry.rawTranscript || entry.audioUrl) && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <DocumentTextIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Show Transcript
              </span>
            </div>
            <ChevronDownIcon
              className={`h-5 w-5 text-gray-500 transition-transform ${
                showTranscript ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showTranscript && (
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Original Recording Transcript
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {entry.rawTranscript || entry.transcript || 'No transcript available'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Insights Badge */}
      {entry.insights && entry.insights.length > 0 && (
        <div className="mt-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
            💡 {entry.insights.length} insight{entry.insights.length > 1 ? 's' : ''} generated
          </span>
        </div>
      )}
    </div>
  );
}