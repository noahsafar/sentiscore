import { prisma } from '@/index';
import { getDateRange } from '@/utils/helpers';
import { logger } from '@/utils/logger';

interface TrendAnalysisOptions {
  timeRange: 'week' | 'month' | 'year' | 'all';
  metrics?: string[];
}

interface TrendData {
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

interface TrendResult {
  trends: TrendData[];
  summary: {
    [key: string]: {
      average: number;
      trend: 'improving' | 'declining' | 'stable';
      changePercent: number;
      weeklyAverage?: number[];
    };
  };
  patterns: {
    weekendEffect: boolean;
    timeOfDayEffect: boolean;
    monthlyPattern: boolean;
  };
}

/**
 * Analyze mood trends for a user
 */
export async function analyzeTrends(
  userId: string,
  options: TrendAnalysisOptions
): Promise<TrendResult> {
  const { timeRange, metrics = ['overall'] } = options;
  const dateRange = getDateRange(timeRange);

  logger.info('Analyzing mood trends', {
    userId,
    timeRange,
    dateRange: {
      start: dateRange.start,
      end: dateRange.end,
    },
  });

  try {
    // Fetch entries with mood scores
    const entries = await prisma.entry.findMany({
      where: {
        userId,
        date: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
      include: {
        moodScores: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    if (entries.length === 0) {
      return {
        trends: [],
        summary: {},
        patterns: {
          weekendEffect: false,
          timeOfDayEffect: false,
          monthlyPattern: false,
        },
      };
    }

    // Prepare trend data
    const trends: TrendData[] = entries.map(entry => ({
      date: entry.date,
      score: entry.moodScores?.overall || 0,
      breakdown: {
        stress: entry.moodScores?.stress || 0,
        happiness: entry.moodScores?.happiness || 0,
        clarity: entry.moodScores?.clarity || 0,
        energy: entry.moodScores?.energy || 0,
        emotionalStability: entry.moodScores?.emotionalStability || 0,
      },
    }));

    // Calculate summary statistics
    const summary = calculateTrendSummary(trends, metrics);

    // Detect patterns
    const patterns = await detectPatterns(userId, entries);

    logger.info('Trend analysis completed', {
      entryCount: entries.length,
      trends: trends.length,
      metrics: Object.keys(summary),
    });

    return {
      trends,
      summary,
      patterns,
    };
  } catch (error: any) {
    logger.error('Trend analysis failed', {
      userId,
      error: error.message,
    });
    throw new Error('Failed to analyze trends');
  }
}

/**
 * Calculate trend summary statistics
 */
function calculateTrendSummary(
  trends: TrendData[],
  metrics: string[]
): TrendResult['summary'] {
  const summary: TrendResult['summary'] = {};

  metrics.forEach(metric => {
    const values = trends.map(t =>
      metric === 'overall' ? t.score : t.breakdown[metric as keyof typeof t.breakdown]
    );

    if (values.length === 0) return;

    // Calculate overall average
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;

    // Calculate trend
    const trend = calculateTrendDirection(values);

    // Calculate percent change
    const changePercent = calculatePercentChange(values);

    // Calculate weekly averages for better visualization
    const weeklyAverages = calculateWeeklyAverages(trends, metric);

    summary[metric] = {
      average: Math.round(average * 100) / 100,
      trend,
      changePercent: Math.round(changePercent * 100) / 100,
      weeklyAverage: weeklyAverages,
    };
  });

  return summary;
}

/**
 * Determine trend direction
 */
function calculateTrendDirection(values: number[]): 'improving' | 'declining' | 'stable' {
  if (values.length < 3) return 'stable';

  // Simple linear regression to determine trend
  const n = values.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = values;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  // Determine trend based on slope
  if (slope > 0.05) return 'improving';
  if (slope < -0.05) return 'declining';
  return 'stable';
}

/**
 * Calculate percent change between first and last half of data
 */
function calculatePercentChange(values: number[]): number {
  if (values.length < 4) return 0;

  const mid = Math.floor(values.length / 2);
  const firstHalf = values.slice(0, mid);
  const secondHalf = values.slice(mid);

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  if (firstAvg === 0) return 0;
  return ((secondAvg - firstAvg) / firstAvg) * 100;
}

/**
 * Calculate weekly averages
 */
function calculateWeeklyAverages(trends: TrendData[], metric: string): number[] {
  const weeklyData: { [key: string]: number[] } = {};

  trends.forEach(trend => {
    const date = new Date(trend.date);
    const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
    const weekKey = weekStart.toISOString().split('T')[0];

    const value = metric === 'overall' ? trend.score : trend.breakdown[metric as keyof typeof trend.breakdown];

    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = [];
    }
    weeklyData[weekKey].push(value);
  });

  // Calculate average for each week
  return Object.values(weeklyData).map(values =>
    values.reduce((sum, val) => sum + val, 0) / values.length
  );
}

/**
 * Detect patterns in mood data
 */
async function detectPatterns(
  userId: string,
  entries: any[]
): Promise<TrendResult['patterns']> {
  const patterns = {
    weekendEffect: false,
    timeOfDayEffect: false,
    monthlyPattern: false,
  };

  if (entries.length < 7) return patterns;

  // Check weekend effect (different mood on weekends)
  const weekendMoods = entries.filter(entry => {
    const day = new Date(entry.date).getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }).map(e => e.moodScores?.overall || 0);

  const weekdayMoods = entries.filter(entry => {
    const day = new Date(entry.date).getDay();
    return day >= 1 && day <= 5; // Monday to Friday
  }).map(e => e.moodScores?.overall || 0);

  if (weekendMoods.length > 0 && weekdayMoods.length > 0) {
    const weekendAvg = weekendMoods.reduce((a, b) => a + b, 0) / weekendMoods.length;
    const weekdayAvg = weekdayMoods.reduce((a, b) => a + b, 0) / weekdayMoods.length;
    patterns.weekendEffect = Math.abs(weekendAvg - weekdayAvg) > 0.5;
  }

  // Check time of day effect
  const morningEntries = entries.filter(e => {
    const hour = new Date(e.date).getHours();
    return hour >= 5 && hour < 12;
  });

  const eveningEntries = entries.filter(e => {
    const hour = new Date(e.date).getHours();
    return hour >= 17 && hour < 22;
  });

  if (morningEntries.length > 3 && eveningEntries.length > 3) {
    const morningAvg = morningEntries.reduce((sum, e) => sum + (e.moodScores?.overall || 0), 0) / morningEntries.length;
    const eveningAvg = eveningEntries.reduce((sum, e) => sum + (e.moodScores?.overall || 0), 0) / eveningEntries.length;
    patterns.timeOfDayEffect = Math.abs(morningAvg - eveningAvg) > 0.3;
  }

  // Check monthly pattern
  if (entries.length >= 28) {
    // Group by day of month and check for cyclic patterns
    const dayOfMonthData: { [key: number]: number[] } = {};

    entries.forEach(entry => {
      const day = new Date(entry.date).getDate();
      if (!dayOfMonthData[day]) dayOfMonthData[day] = [];
      dayOfMonthData[day].push(entry.moodScores?.overall || 0);
    });

    const dayAverages = Object.values(dayOfMonthData).map(values =>
      values.reduce((sum, val) => sum + val, 0) / values.length
    );

    // Simple check for monthly pattern (you could make this more sophisticated)
    const variance = calculateVariance(dayAverages);
    patterns.monthlyPattern = variance > 0.5;
  }

  return patterns;
}

/**
 * Calculate variance of an array of numbers
 */
function calculateVariance(values: number[]): number {
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(value => Math.pow(value - avg, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Get mood comparison between two periods
 */
export async function compareMoods(
  userId: string,
  period1: { start: Date; end: Date },
  period2: { start: Date; end: Date }
): Promise<{
  period1: { average: number; entries: number };
  period2: { average: number; entries: number };
  difference: number;
  significant: boolean;
  improvement: boolean;
}> {
  const getPeriodData = async (period: { start: Date; end: Date }) => {
    const entries = await prisma.entry.findMany({
      where: {
        userId,
        date: {
          gte: period.start,
          lte: period.end,
        },
      },
      include: {
        moodScores: true,
      },
    });

    if (entries.length === 0) {
      return { average: 0, entries: 0 };
    }

    const average = entries.reduce(
      (sum, entry) => sum + (entry.moodScores?.overall || 0),
      0
    ) / entries.length;

    return {
      average: Math.round(average * 100) / 100,
      entries: entries.length,
    };
  };

  const [p1Data, p2Data] = await Promise.all([
    getPeriodData(period1),
    getPeriodData(period2),
  ]);

  const difference = p2Data.average - p1Data.average;
  const significant = Math.abs(difference) > 0.5; // Threshold for significance
  const improvement = difference > 0;

  return {
    period1: p1Data,
    period2: p2Data,
    difference: Math.round(difference * 100) / 100,
    significant,
    improvement,
  };
}