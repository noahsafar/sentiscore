import { Entry } from '@/types';

interface VoiceFeatures {
  averagePitch: number;
  pitchVariation: number;
  volumeVariation: number;
  speakingRate: number;
  pauses: number;
  energy: number;
}

/**
 * Check if an entry is for today
 */
export function isEntryToday(entry: Entry): boolean {
  const entryDate = new Date(entry.date);
  const today = new Date();
  return entryDate.toDateString() === today.toDateString();
}

/**
 * Find how many entries exist for today
 */
export function getTodayEntryCount(entries: Entry[]): number {
  if (!entries || !Array.isArray(entries)) return 0;
  return entries.filter(isEntryToday).length;
}

/**
 * Save a new journal entry (allows unlimited entries per day)
 */
export async function saveNewEntry(
  transcript: string,
  audioBlob?: Blob,
  voiceFeatures?: VoiceFeatures,
  additionalData?: any
): Promise<Entry> {
  const now = new Date(); // Use actual current time for timestamp
  console.log('📤 Creating new journal entry');

  if (audioBlob) {
    // Use multipart form for audio uploads
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('transcript', transcript);
    formData.append('date', now.toISOString());

    // Add voice features if available
    if (voiceFeatures) {
      formData.append('voiceFeatures', JSON.stringify(voiceFeatures));
    }

    // Add any additional data
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        if (key !== 'audio' && key !== 'voiceFeatures') {
          formData.append(key, JSON.stringify(additionalData[key]));
        }
      });
    }

    const response = await fetch('http://localhost:8000/api/entries', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to create new entry');
    }

    const { data } = await response.json();
    console.log('✅ New entry created successfully');
    return data;
  } else {
    // Use JSON for text-only entries
    const response = await fetch('http://localhost:8000/api/entries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transcript,
        date: now.toISOString(),
        voiceFeatures,
        ...additionalData,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create new entry');
    }

    const { data } = await response.json();
    console.log('✅ New entry created successfully');
    return data;
  }
}