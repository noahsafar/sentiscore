// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  timezone: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

export interface NotificationSettings {
  dailyReminder: boolean;
  reminderTime: string; // HH:MM format
  emailNotifications: boolean;
  insights: boolean;
  weeklyReport: boolean;
  monthlyReport: boolean;
}

export interface PrivacySettings {
  dataRetention: number; // months
  shareInsights: boolean;
  anonymizeData: boolean;
}

// Entry Types
export interface Entry {
  id: string;
  userId: string;
  date: Date;
  transcript: string;
  rawTranscript?: string; // Original transcript before AI summary
  audioUrl?: string;
  duration: number; // seconds
  moodScores: MoodScores;
  insights?: Insight[];
  tags: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MoodScores {
  stress: number; // 0-10
  happiness: number; // 0-10
  clarity: number; // 0-10
  energy: number; // 0-10
  emotionalStability: number; // 0-10
  overall: number; // 0-10 (calculated average)
}

export interface Insight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  confidence: number; // 0-1
  actionItems?: string[];
  relatedEntries?: string[]; // entry IDs
  createdAt: Date;
  isRead?: boolean;
}

export enum InsightType {
  PATTERN = 'pattern',
  TREND = 'trend',
  ANOMALY = 'anomaly',
  IMPROVEMENT = 'improvement',
  WARNING = 'warning',
  ADVICE = 'advice',
}

// Mood Analysis Types
export interface MoodAnalysis {
  sentiment: {
    score: number; // -1 to 1
    label: 'positive' | 'negative' | 'neutral';
    confidence: number;
  };
  emotions: {
    primary: string;
    secondary?: string;
    all: EmotionScore[];
  };
  tone: {
    energy: number; // 0-1
    valence: number; // 0-1
    tension: number; // 0-1
  };
  cognitive: {
    clarity: number; // 0-1
    focus: number; // 0-1
    cognitiveLoad: number; // 0-1
  };
  advice?: string;
  summary?: string;
}

export interface EmotionScore {
  emotion: string;
  score: number; // 0-1
}

// Dashboard Types
export interface DashboardData {
  currentStreak: number;
  longestStreak: number;
  totalEntries: number;
  averageMood: {
    thisWeek: number;
    thisMonth: number;
    lastMonth: number;
  };
  recentEntries: Entry[];
  insights: Insight[];
  trends: MoodTrend[];
}

export interface MoodTrend {
  date: Date;
  score: number;
  breakdown: {
    stress: number;
    happiness: number;
    clarity: number;
    energy: number;
    emotionalStability: number;
  };
}

// Voice Recording Types
export interface VoiceRecording {
  blob: Blob;
  duration: number;
  timestamp: Date;
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  words?: WordTimestamp[];
}

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface PaginatedEntries {
  entries: Entry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Export Types
export interface ExportOptions {
  format: 'pdf' | 'json' | 'csv';
  dateRange: {
    start: Date;
    end: Date;
  };
  includeAudio: boolean;
  includeInsights: boolean;
  anonymize: boolean;
}

export interface ExportData {
  user: {
    name: string;
    email: string;
  };
  entries: Entry[];
  summary: {
    totalEntries: number;
    dateRange: {
      start: Date;
      end: Date;
    };
    moodAverages: MoodScores;
  };
}

// Chart Types
export interface ChartDataPoint {
  x: Date;
  y: number;
  label?: string;
}

export interface MoodChartData {
  stress: ChartDataPoint[];
  happiness: ChartDataPoint[];
  clarity: ChartDataPoint[];
  energy: ChartDataPoint[];
  emotionalStability: ChartDataPoint[];
  overall: ChartDataPoint[];
}

// Search and Filter Types
export interface SearchFilters {
  query?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  moodRange?: {
    min: number;
    max: number;
  };
  tags?: string[];
  emotions?: string[];
  hasInsights?: boolean;
}

export interface SearchResult {
  entry: Entry;
  score: number;
  highlights: string[];
}

// Component Props Types
export interface VoiceRecorderProps {
  onRecordingComplete: (recording: VoiceRecording) => void;
  onTranscription: (result: TranscriptionResult) => void;
  maxDuration?: number; // seconds
  disabled?: boolean;
}

export interface MoodChartProps {
  entries: Entry[];
  timeRange: 'week' | 'month' | 'year' | 'all';
  onTimeRangeChange: (range: 'week' | 'month' | 'year' | 'all') => void;
  showAverage?: boolean;
}

export interface EntryCardProps {
  entry: Entry;
  showFullTranscript?: boolean;
  onEdit?: (entry: Entry) => void;
  onDelete?: (entryId: string) => void;
  onShare?: (entry: Entry) => void;
}

export interface InsightCardProps {
  insight: Insight;
  onViewDetails: (insightId: string) => void;
  onDismiss?: (insightId: string) => void;
}

// Route Types
export interface RouteParams {
  entryId?: string;
  insightId?: string;
  date?: string;
}

// Form Types
export interface CreateEntryForm {
  transcript: string;
  tags: string[];
  isPublic: boolean;
}

export interface UpdateProfileForm {
  name: string;
  email: string;
  timezone: string;
  preferences: Partial<UserPreferences>;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  statusCode?: number;
  details?: any;
}

// Toast Types
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    handler: () => void;
  };
}

// Modal Types
export type ModalType = 'entry' | 'settings' | 'export' | 'insights' | null;

// Theme Types
export type Theme = 'light' | 'dark' | 'auto';

// Language Types
export type Language = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'zh';