import { Entry } from '@/types';

/**
 * Get today's date normalized to midnight for accurate comparison
 */
export function getTodayNormalized(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Check if an entry is for today
 */
export function isEntryToday(entry: Entry): boolean {
  const entryDate = new Date(entry.date);
  entryDate.setHours(0, 0, 0, 0);
  const today = getTodayNormalized();
  return entryDate.getTime() === today.getTime();
}

/**
 * Find today's entry from an array of entries
 */
export function findTodayEntry(entries: Entry[]): Entry | null {
  if (!entries || !Array.isArray(entries)) return null;
  return entries.find(isEntryToday) || null;
}

/**
 * Save or replace today's entry with proper one-entry-per-day enforcement
 */
export async function saveOrReplaceTodayEntry(
  entries: Entry[],
  transcript: string,
  audioBlob?: Blob,
  additionalData?: any
): Promise<{ entry: Entry; wasReplaced: boolean }> {
  const todayEntry = findTodayEntry(entries);
  const now = new Date(); // Use actual current time for timestamp

  if (todayEntry) {
    // Replace existing entry
    console.log('🔄 Replacing today\'s entry:', todayEntry.id);

    const updateData = {
      transcript,
      date: now.toISOString(), // Use actual current time
      ...additionalData,
    };

    const response = await fetch(`http://localhost:8000/api/entries/${todayEntry.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error('Failed to update today\'s entry');
    }

    const { data } = await response.json();
    console.log('✅ Entry replaced successfully');
    return { entry: data, wasReplaced: true };
  } else {
    // Create new entry
    console.log('📤 Creating new entry for today');

    if (audioBlob) {
      // Use multipart form for audio uploads
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('transcript', transcript);
      formData.append('date', now.toISOString()); // Use actual current time

      // Add any additional data
      if (additionalData) {
        Object.keys(additionalData).forEach(key => {
          if (key !== 'audio') {
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
      return { entry: data, wasReplaced: false };
    } else {
      // Use JSON for text-only entries
      const response = await fetch('http://localhost:8000/api/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript,
          date: now.toISOString(), // Use actual current time
          ...additionalData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create new entry');
      }

      const { data } = await response.json();
      console.log('✅ New entry created successfully');
      return { entry: data, wasReplaced: false };
    }
  }
}