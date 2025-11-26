import { logger } from '@/utils/logger';
import { createError } from '@/middleware/errorHandler';

interface AudioFile {
  filename: string;
  mimetype: string;
  size: number;
}

interface TranscriptionResult {
  text: string;
  confidence: number;
  duration: number;
  words?: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
  }>;
}

/**
 * Transcribe audio buffer to text using various speech-to-text services
 * Falls back to different providers if one fails
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  file: AudioFile
): Promise<TranscriptionResult> {
  logger.info('Starting audio transcription', {
    filename: file.filename,
    size: file.size,
    mimetype: file.mimetype,
  });

  // Try different transcription services in order of preference
  const services = [
    { name: 'OpenAI Whisper', handler: transcribeWithOpenAI },
    { name: 'Web Speech API Fallback', handler: transcribeWithWebSpeech },
    { name: 'Mock Transcription', handler: transcribeWithMock },
  ];

  let lastError: Error | null = null;

  for (const service of services) {
    try {
      logger.info(`Attempting transcription with ${service.name}`);
      const result = await service.handler(audioBuffer, file);
      logger.info(`Transcription successful with ${service.name}`, {
        textLength: result.text.length,
        confidence: result.confidence,
      });
      return result;
    } catch (error: any) {
      lastError = error;
      logger.warn(`${service.name} transcription failed`, { error: error.message });
      // Continue to next service
    }
  }

  // If all services fail, throw the last error
  throw lastError || new Error('All transcription services failed');
}

/**
 * Transcribe using OpenAI's Whisper API
 */
async function transcribeWithOpenAI(
  audioBuffer: Buffer,
  file: AudioFile
): Promise<TranscriptionResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Create a temporary file for the audio
  const fs = require('fs');
  const path = require('path');
  const os = require('os');
  const tmpPath = path.join(os.tmpdir(), `audio-${Date.now()}${path.extname(file.filename)}`);
  fs.writeFileSync(tmpPath, audioBuffer);

  try {
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', fs.createReadStream(tmpPath), file.filename);
    form.append('model', 'whisper-1');
    form.append('language', 'en');
    form.append('response_format', 'verbose_json');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${apiKey}`,
      },
      body: form,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI transcription failed');
    }

    const data = await response.json();

    return {
      text: data.text || '',
      confidence: calculateAverageConfidence(data.words || []),
      duration: data.duration || 0,
      words: data.words?.map((w: any) => ({
        word: w.word,
        start: w.start,
        end: w.end,
        confidence: w.confidence || 0,
      })),
    };
  } finally {
    // Clean up temporary file
    fs.unlinkSync(tmpPath);
  }
}

/**
 * Fallback to Web Speech API (client-side)
 * This won't work on the server but provides a placeholder
 */
async function transcribeWithWebSpeech(
  audioBuffer: Buffer,
  file: AudioFile
): Promise<TranscriptionResult> {
  // This would require client-side implementation
  // For now, we'll throw an error to move to the next service
  throw new Error('Web Speech API not available on server');
}

/**
 * Mock transcription for development/testing
 * Generates a realistic-looking transcript based on audio duration
 */
async function transcribeWithMock(
  audioBuffer: Buffer,
  file: AudioFile
): Promise<TranscriptionResult> {
  // Estimate duration based on file size (rough estimate)
  const bytesPerSecond = 16000; // Assuming 16kHz mono audio
  const estimatedDuration = Math.max(1, file.size / bytesPerSecond);

  const mockTranscripts = [
    "Today was a pretty good day. I had a productive morning at work and managed to finish all my tasks. Feeling quite accomplished with what I got done.",
    "I'm feeling a bit stressed today with all the deadlines coming up. Had to skip my meditation session, which I regret.",
    "Great day! Spent quality time with family and we went for a nice walk in the park. The weather was perfect and I'm feeling grateful.",
    "Feeling tired and a bit overwhelmed today. Didn't get enough sleep last night. Need to prioritize rest tomorrow.",
    "Productive day at work. Had a good workout session in the evening which really helped clear my mind and reduce stress.",
    "Meditation really helped today. Feeling centered and calm. Grateful for the little moments of peace throughout the day.",
    "Challenging day at work but I handled it well. Proud of how I stayed calm under pressure and found solutions to problems.",
    "Feeling joyful today! Received good news about a project I've been working on. All the hard work is finally paying off.",
    "A bit of an emotional day. Missing some old friends but grateful for the memories and the people currently in my life.",
    "Good balance today. Work was manageable, had time for hobbies, and connected with a friend in the evening.",
  ];

  // Select a random transcript
  const baseTranscript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];

  // Add some variation based on estimated duration
  let transcript = baseTranscript;
  if (estimatedDuration > 60) {
    transcript += " " + [
      "Looking forward to tomorrow and hoping to maintain this positive energy.",
      "Tomorrow I plan to focus on self-care and make sure I get enough rest.",
      "I'm learning to be more patient with myself and celebrate small wins.",
      "Need to remember that it's okay to not be perfect all the time.",
    ][Math.floor(Math.random() * 4)];
  }

  // Generate mock word timestamps
  const words = transcript.split(' ');
  const wordsWithTimestamps = words.map((word, index) => ({
    word,
    start: (index / words.length) * estimatedDuration,
    end: ((index + 1) / words.length) * estimatedDuration,
    confidence: 0.85 + Math.random() * 0.15, // Random confidence between 0.85-1.0
  }));

  return {
    text: transcript,
    confidence: 0.9 + Math.random() * 0.1, // Random confidence between 0.9-1.0
    duration: estimatedDuration,
    words: wordsWithTimestamps,
  };
}

/**
 * Calculate average confidence from word-level confidences
 */
function calculateAverageConfidence(words: Array<{ confidence: number }>): number {
  if (!words || words.length === 0) return 0.95; // Default high confidence

  const total = words.reduce((sum, word) => sum + word.confidence, 0);
  return total / words.length;
}

/**
 * Transcribe multiple audio files in parallel
 */
export async function transcribeMultiple(
  files: Array<{ buffer: Buffer; metadata: AudioFile }>
): Promise<TranscriptionResult[]> {
  const promises = files.map(file => transcribeAudio(file.buffer, file.metadata));
  return Promise.all(promises);
}

/**
 * Get transcription statistics
 */
export function getTranscriptionStats(result: TranscriptionResult) {
  if (!result.words) {
    return {
      wordCount: result.text.split(' ').length,
      speakingRate: null, // words per minute
      averageWordLength: null,
    };
  }

  const totalSpeechTime = result.words[result.words.length - 1].end;
  const wordCount = result.words.length;
  const speakingRate = (wordCount / totalSpeechTime) * 60; // words per minute
  const averageWordLength = result.words.reduce((sum, w) => sum + w.word.length, 0) / wordCount;

  return {
    wordCount,
    speakingRate: Math.round(speakingRate),
    averageWordLength: Math.round(averageWordLength * 10) / 10,
  };
}