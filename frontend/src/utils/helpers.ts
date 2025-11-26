import { format, startOfDay, endOfDay, subDays, subWeeks, subMonths, subYears, isWithinInterval } from 'date-fns';
import { MoodScores, Entry } from '@/types';

// Date utilities
export const formatDate = (date: Date, formatStr: string = 'PPP'): string => {
  return format(date, formatStr);
};

export const getDateRange = (range: 'week' | 'month' | 'year' | 'all'): { start: Date; end: Date } => {
  const end = endOfDay(new Date());
  let start: Date;

  switch (range) {
    case 'week':
      start = startOfDay(subWeeks(end, 1));
      break;
    case 'month':
      start = startOfDay(subMonths(end, 1));
      break;
    case 'year':
      start = startOfDay(subYears(end, 1));
      break;
    case 'all':
      start = new Date(0); // Beginning of time
      break;
    default:
      start = startOfDay(subDays(end, 30));
  }

  return { start, end };
};

export const isEntryInDateRange = (entry: Entry, range: { start: Date; end: Date }): boolean => {
  return isWithinInterval(new Date(entry.date), range);
};

// Mood score utilities
export const calculateMoodColor = (score: number): string => {
  if (score >= 8) return 'text-green-500';
  if (score >= 6) return 'text-blue-500';
  if (score >= 4) return 'text-yellow-500';
  if (score >= 2) return 'text-orange-500';
  return 'text-red-500';
};

export const getMoodEmoji = (score: number): string => {
  if (score >= 8) return '😊';
  if (score >= 6) return '🙂';
  if (score >= 4) return '😐';
  if (score >= 2) return '😔';
  return '😢';
};

export const getMoodLabel = (score: number): string => {
  if (score >= 8) return 'Excellent';
  if (score >= 6) return 'Good';
  if (score >= 4) return 'Okay';
  if (score >= 2) return 'Poor';
  return 'Very Poor';
};

export const averageMoodScores = (scores: MoodScores[]): MoodScores => {
  if (scores.length === 0) {
    return {
      stress: 0,
      happiness: 0,
      clarity: 0,
      energy: 0,
      emotionalStability: 0,
      overall: 0,
    };
  }

  const sum = scores.reduce(
    (acc, score) => ({
      stress: acc.stress + score.stress,
      happiness: acc.happiness + score.happiness,
      clarity: acc.clarity + score.clarity,
      energy: acc.energy + score.energy,
      emotionalStability: acc.emotionalStability + score.emotionalStability,
      overall: acc.overall + score.overall,
    }),
    { stress: 0, happiness: 0, clarity: 0, energy: 0, emotionalStability: 0, overall: 0 }
  );

  const count = scores.length;
  return {
    stress: Math.round((sum.stress / count) * 10) / 10,
    happiness: Math.round((sum.happiness / count) * 10) / 10,
    clarity: Math.round((sum.clarity / count) * 10) / 10,
    energy: Math.round((sum.energy / count) * 10) / 10,
    emotionalStability: Math.round((sum.emotionalStability / count) * 10) / 10,
    overall: Math.round((sum.overall / count) * 10) / 10,
  };
};

// Text utilities
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
};

export const extractKeywords = (text: string, count: number = 5): string[] => {
  const words = text.toLowerCase().split(/\s+/);
  const stopWords = new Set([
    'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
    'in', 'with', 'to', 'for', 'of', 'as', 'by', 'that', 'this',
    'it', 'from', 'be', 'are', 'been', 'being', 'was', 'were', 'will',
    'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall',
    'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves',
    'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him',
    'his', 'himself', 'she', 'her', 'hers', 'herself', 'they', 'them',
    'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom',
    'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were',
    'feel', 'feeling', 'felt', 'today', 'yesterday', 'tomorrow'
  ]);

  const filtered = words.filter(word => word.length > 2 && !stopWords.has(word));
  const frequency: { [key: string]: number } = {};

  filtered.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  return Object.entries(frequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)
    .map(([word]) => word);
};

// Audio utilities
export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const calculateAudioSize = (duration: number, bitrate: number = 128000): string => {
  const sizeInBytes = (duration * bitrate) / 8;
  const sizeInKB = sizeInBytes / 1024;
  const sizeInMB = sizeInKB / 1024;

  if (sizeInMB >= 1) {
    return `${sizeInMB.toFixed(1)} MB`;
  }
  return `${sizeInKB.toFixed(0)} KB`;
};

// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};

export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Storage utilities
export const saveToLocalStorage = (key: string, data: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

export const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return defaultValue;
  }
};

export const removeFromLocalStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove from localStorage:', error);
  }
};

// Color utilities
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Random utilities
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};