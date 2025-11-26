import Sentiment from 'sentiment';
import natural from 'natural';
import * as stopword from 'stopword';
import { logger } from '@/utils/logger';
import { MoodScores, MoodAnalysis } from '@/types';

const sentiment = new Sentiment();
const tokenizer = new natural.WordTokenizer();

export interface AnalysisResult {
  moodScores: MoodScores;
  analysis: MoodAnalysis;
  keywords: string[];
}

/**
 * Analyze text to extract mood scores and insights
 */
export async function analyzeMood(text: string): Promise<AnalysisResult> {
  logger.info('Starting mood analysis', { textLength: text.length });

  try {
    // 1. Sentiment Analysis
    const sentimentResult = sentiment.analyze(text);

    // 2. Emotion Detection
    const emotions = detectEmotions(text);

    // 3. Cognitive Analysis
    const cognitive = analyzeCognitiveLoad(text);

    // 4. Tone Analysis
    const tone = analyzeTone(text);

    // 5. Generate mood scores (0-10 scale)
    const moodScores = generateMoodScores({
      sentiment: sentimentResult,
      emotions,
      cognitive,
      tone,
    });

    // 6. Generate advice and summary
    const { advice, summary } = generateAdviceAndSummary(moodScores, emotions);

    // 7. Extract keywords
    const keywords = extractKeywords(text);

    const analysis: MoodAnalysis = {
      sentiment: {
        score: sentimentResult.score / sentimentResult.comparative, // Normalize
        label: getSentimentLabel(sentimentResult.score),
        confidence: calculateSentimentConfidence(sentimentResult),
      },
      emotions,
      tone,
      cognitive,
      advice,
      summary,
    };

    logger.info('Mood analysis completed', {
      overall: moodScores.overall,
      stress: moodScores.stress,
      happiness: moodScores.happiness,
    });

    return {
      moodScores,
      analysis,
      keywords,
    };
  } catch (error: any) {
    logger.error('Mood analysis failed', { error: error.message });
    throw new Error('Failed to analyze mood');
  }
}

/**
 * Detect primary and secondary emotions from text
 */
function detectEmotions(text: string): MoodAnalysis['emotions'] {
  // Emotion keywords mapping
  const emotionKeywords = {
    joy: ['happy', 'joy', 'excited', 'delighted', 'pleased', 'glad', 'cheerful', 'elated', 'thrilled', 'ecstatic'],
    sadness: ['sad', 'unhappy', 'depressed', 'down', 'blue', 'melancholy', 'gloomy', 'miserable', 'heartbroken'],
    anger: ['angry', 'mad', 'furious', 'irritated', 'annoyed', 'frustrated', 'upset', 'enraged', 'livid'],
    fear: ['afraid', 'scared', 'frightened', 'terrified', 'anxious', 'worried', 'nervous', 'panic', 'dread'],
    surprise: ['surprised', 'amazed', 'astonished', 'shocked', 'stunned', 'bewildered', 'astounded'],
    disgust: ['disgusted', 'revolted', 'repulsed', 'sickened', 'nauseated'],
    anticipation: ['excited', 'eager', 'enthusiastic', 'looking forward', 'anticipating', 'hopeful'],
    trust: ['trust', 'confident', 'secure', 'safe', 'comfortable', 'reassured'],
    calm: ['calm', 'peaceful', 'relaxed', 'serene', 'tranquil', 'composed', 'centered'],
    confused: ['confused', 'uncertain', 'unsure', 'puzzled', 'bewildered', 'unclear'],
  };

  const tokens = tokenizer.tokenize(text.toLowerCase()) || [];
  const emotionScores: { [key: string]: number } = {};

  // Score each emotion
  Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
    emotionScores[emotion] = 0;
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        emotionScores[emotion] += matches.length;
      }
    });
  });

  // Normalize and sort emotions
  const total = Object.values(emotionScores).reduce((sum, score) => sum + score, 0);
  const emotions = Object.entries(emotionScores)
    .map(([emotion, score]) => ({
      emotion,
      score: total > 0 ? score / total : 0,
    }))
    .filter(e => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return {
    primary: emotions[0]?.emotion || 'neutral',
    secondary: emotions[1]?.emotion,
    all: emotions,
  };
}

/**
 * Analyze cognitive load indicators
 */
function analyzeCognitiveLoad(text: string): MoodAnalysis['cognitive'] {
  const indicators = {
    complexity: 0,
    uncertainty: 0,
    negative: 0,
    positive: 0,
  };

  // Complexity indicators
  const complexWords = ['however', 'therefore', 'moreover', 'consequently', 'furthermore', 'nevertheless'];
  const longSentences = text.split(/[.!?]+/).filter(s => s.split(' ').length > 20);
  indicators.complexity = Math.min(1, (complexWords.length + longSentences.length) / 10);

  // Uncertainty indicators
  const uncertaintyWords = ['maybe', 'perhaps', 'unsure', 'uncertain', 'might', 'could', 'possibly', 'probably'];
  const uncertaintyMatches = uncertaintyWords.filter(word =>
    text.toLowerCase().includes(word)
  ).length;
  indicators.uncertainty = Math.min(1, uncertaintyMatches / 5);

  // Sentiment-based cognitive load
  const sentimentResult = sentiment.analyze(text);
  indicators.negative = Math.max(0, -sentimentResult.score / 10);
  indicators.positive = Math.max(0, sentimentResult.score / 10);

  // Calculate metrics
  const clarity = 1 - (indicators.complexity + indicators.uncertainty) / 2;
  const focus = Math.max(0, 1 - indicators.uncertainty);
  const cognitiveLoad = (indicators.complexity + indicators.uncertainty + indicators.negative) / 3;

  return {
    clarity: Math.max(0, Math.min(1, clarity)),
    focus: Math.max(0, Math.min(1, focus)),
    cognitiveLoad: Math.max(0, Math.min(1, cognitiveLoad)),
  };
}

/**
 * Analyze tone of the text
 */
function analyzeTone(text: string): MoodAnalysis['tone'] {
  // Energy indicators
  const highEnergyWords = ['excited', 'energetic', 'enthusiastic', 'vibrant', 'dynamic', 'lively'];
  const lowEnergyWords = ['tired', 'exhausted', 'fatigued', 'drained', 'lethargic', 'weary'];

  const energyScore = calculateToneScore(text, highEnergyWords, lowEnergyWords);

  // Valence (positive/negative)
  const positiveWords = ['good', 'great', 'excellent', 'wonderful', 'amazing', 'fantastic', 'love', 'happy'];
  const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'sad', 'angry', 'frustrated'];

  const valenceScore = calculateToneScore(text, positiveWords, negativeWords);

  // Tension indicators
  const tensionWords = ['stressed', 'tense', 'anxious', 'worried', 'nervous', 'pressured', 'overwhelmed'];
  const relaxedWords = ['calm', 'relaxed', 'peaceful', 'serene', 'comfortable', 'at ease'];

  const tensionScore = calculateToneScore(text, tensionWords, relaxedWords);

  return {
    energy: Math.max(0, Math.min(1, energyScore)),
    valence: Math.max(0, Math.min(1, (valenceScore + 1) / 2)),
    tension: Math.max(0, Math.min(1, tensionScore)),
  };
}

/**
 * Calculate tone score based on positive and negative words
 */
function calculateToneScore(
  text: string,
  positiveWords: string[],
  negativeWords: string[]
): number {
  const positiveCount = positiveWords.filter(word =>
    text.toLowerCase().includes(word)
  ).length;

  const negativeCount = negativeWords.filter(word =>
    text.toLowerCase().includes(word)
  ).length;

  const total = positiveCount + negativeCount;
  if (total === 0) return 0;

  return (positiveCount - negativeCount) / Math.max(total, 5);
}

/**
 * Generate mood scores from analysis
 */
function generateMoodScores(data: {
  sentiment: any;
  emotions: any;
  cognitive: any;
  tone: any;
}): MoodScores {
  const { sentiment, emotions, cognitive, tone } = data;

  // Stress (inverse of positive sentiment, affected by tension)
  const stress = Math.max(0, Math.min(10,
    5 - (sentiment.score * 0.5) + (tone.tension * 5)
  ));

  // Happiness (based on positive sentiment and joy emotion)
  const joyScore = emotions.all.find((e: any) => e.emotion === 'joy')?.score || 0;
  const happiness = Math.max(0, Math.min(10,
    5 + (sentiment.score * 0.5) + (joyScore * 5)
  ));

  // Clarity (from cognitive analysis)
  const clarity = Math.max(0, Math.min(10, cognitive.clarity * 10));

  // Energy (from tone energy and relevant emotions)
  const excitementScore = emotions.all.find((e: any) => e.emotion === 'anticipation')?.score || 0;
  const energy = Math.max(0, Math.min(10,
    5 + (tone.energy * 3) + (excitementScore * 2)
  ));

  // Emotional stability (inverse of emotional variability)
  const emotionalVariability = Object.values(emotions.all).reduce(
    (sum: number, score: any) => sum + Math.abs(score - 0.5), 0
  ) / (emotions.all.length || 1);
  const emotionalStability = Math.max(0, Math.min(10, 10 - (emotionalVariability * 10)));

  // Overall mood (weighted average)
  const overall = (
    (happiness * 0.3) +
    ((10 - stress) * 0.25) +
    (clarity * 0.2) +
    (energy * 0.15) +
    (emotionalStability * 0.1)
  );

  return {
    stress: Math.round(stress * 10) / 10,
    happiness: Math.round(happiness * 10) / 10,
    clarity: Math.round(clarity * 10) / 10,
    energy: Math.round(energy * 10) / 10,
    emotionalStability: Math.round(emotionalStability * 10) / 10,
    overall: Math.round(overall * 10) / 10,
  };
}

/**
 * Generate advice and summary based on mood scores
 */
function generateAdviceAndSummary(
  moodScores: MoodScores,
  emotions: MoodAnalysis['emotions']
): { advice: string; summary: string } {
  const { overall, stress, happiness, energy, emotionalStability } = moodScores;

  // Generate summary
  let summary = `Overall mood score is ${overall}/10. `;
  if (happiness >= 7) {
    summary += "You're feeling quite happy today. ";
  } else if (happiness >= 5) {
    summary += "Your mood is relatively neutral today. ";
  } else {
    summary += "You seem to be feeling a bit down today. ";
  }

  if (stress >= 7) {
    summary += "Stress levels are elevated. ";
  } else if (stress >= 4) {
    summary += "Stress levels are moderate. ";
  }

  if (energy >= 7) {
    summary += "You have high energy levels. ";
  } else if (energy <= 3) {
    summary += "Your energy seems low. ";
  }

  // Generate advice
  let advice = "";

  if (stress >= 7) {
    advice = "Consider taking a few deep breaths or going for a walk to reduce stress. ";
    advice += "Meditation or journaling might also help process these feelings.";
  } else if (happiness >= 8) {
    advice = "You're in a great mood! Take a moment to appreciate what's contributing to this happiness. ";
    advice += "Consider sharing your joy with others.";
  } else if (energy <= 3) {
    advice = "Your energy seems low. Make sure you're getting enough rest and staying hydrated. ";
    advice += "A short walk or some light exercise might help boost your energy levels.";
  } else if (emotionalStability <= 4) {
    advice = "Your emotions seem to be fluctuating. Try to identify what might be causing this instability. ";
    advice += "Grounding exercises and mindfulness can help create emotional balance.";
  } else {
    advice = "Your mood seems balanced. Keep up whatever is working well for you!";
  }

  // Add emotion-specific advice
  if (emotions.primary === 'anxious' || emotions.primary === 'fear') {
    advice += " Remember to focus on what you can control and take things one step at a time.";
  } else if (emotions.primary === 'anger') {
    advice += " Consider channeling this energy into something productive or taking a moment to cool down.";
  } else if (emotions.primary === 'sadness') {
    advice += " It's okay to feel sad sometimes. Be gentle with yourself and reach out to someone you trust.";
  }

  return {
    advice: advice.trim(),
    summary: summary.trim(),
  };
}

/**
 * Extract keywords from text
 */
function extractKeywords(text: string, limit: number = 10): string[] {
  // Tokenize and remove stop words
  const tokens = tokenizer.tokenize(text.toLowerCase()) || [];
  const filteredTokens = stopword.removeStopwords(tokens);

  // Calculate word frequency
  const frequency: { [key: string]: number } = {};
  filteredTokens.forEach(token => {
    if (token.length > 3) { // Ignore very short words
      frequency[token] = (frequency[token] || 0) + 1;
    }
  });

  // Sort by frequency and return top keywords
  return Object.entries(frequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([word]) => word);
}

/**
 * Get sentiment label from score
 */
function getSentimentLabel(score: number): 'positive' | 'negative' | 'neutral' {
  if (score > 1) return 'positive';
  if (score < -1) return 'negative';
  return 'neutral';
}

/**
 * Calculate sentiment confidence
 */
function calculateSentimentConfidence(result: any): number {
  const totalWords = result.words.length;
  const scoredWords = result.words.filter((w: any) => w.score !== 0).length;

  if (totalWords === 0) return 0.5;

  return Math.min(1, scoredWords / Math.max(totalWords * 0.1, 5));
}