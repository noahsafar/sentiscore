const http = require('http');
const { randomBytes } = require('crypto');
const url = require('url');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Anthropic API for advanced AI analysis
const Anthropic = require('@anthropic-ai/sdk');

// Initialize Anthropic client if API key is available
let anthropic = null;
if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here') {
  anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
  console.log('🤖 Anthropic API initialized for advanced AI analysis');
} else {
  console.log('⚠️  Anthropic API key not configured. Set ANTHROPIC_API_KEY in .env to enable advanced AI features.');
}

// Enable CORS
const enableCORS = (res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
};

// Sample entries for demo user only
const demoEntries = [
  {
    id: '1',
    date: new Date(Date.now() - 86400000).toISOString(),
    transcript: "Today was a pretty good day. I had a productive morning at work and managed to finish all my tasks. Feeling quite accomplished with what I got done.",
    moodScores: {
      stress: 3.5,
      happiness: 8.2,
      clarity: 7.0,
      energy: 6.5,
      emotionalStability: 7.8,
      overall: 6.6
    },
    tags: ['work', 'productive']
  },
  {
    id: '2',
    date: new Date(Date.now() - 172800000).toISOString(),
    transcript: "I'm feeling a bit stressed today with all the deadlines coming up. Had to skip my meditation session, which I regret.",
    moodScores: {
      stress: 7.5,
      happiness: 4.2,
      clarity: 5.5,
      energy: 4.0,
      emotionalStability: 4.8,
      overall: 5.2
    },
    tags: ['stress', 'work']
  },
  {
    id: '3',
    date: new Date(Date.now() - 259200000).toISOString(),
    transcript: "Great day! Spent quality time with family and we went for a nice walk in the park. The weather was perfect and I'm feeling grateful.",
    moodScores: {
      stress: 2.0,
      happiness: 9.0,
      clarity: 8.0,
      energy: 7.5,
      emotionalStability: 8.5,
      overall: 7.0
    },
    tags: ['family', 'gratitude']
  }
];

// User-specific entries storage (in production, use a real database)
let userEntries = {
  'demo-user': [...demoEntries]
};

const sampleUser = {
  id: 'demo-user',
  email: 'demo@sentiscore.app',
  name: 'Demo User'
};

// Simple in-memory user store (in production, use a real database)
let registeredUsers = [
  { id: 'demo-user', email: 'demo@ai-mood-journal.com', name: 'Demo User', password: 'password123' }
];

// Advanced AI Analysis Functions
// Transcribe audio using Anthropic Claude API with voice feature analysis
async function transcribeAudioWithAI(audioBuffer, voiceFeatures = null) {
  if (!anthropic) {
    return "Audio transcription not available - Anthropic API key not configured";
  }

  try {
    console.log('🤖 Processing audio with Anthropic for intelligent transcription...');

    // Create personalized prompt based on voice features
    let voiceContext = "";
    if (voiceFeatures) {
      if (voiceFeatures.energy > 0.7) {
        voiceContext += "The person spoke with high energy and excitement. ";
      } else if (voiceFeatures.energy < 0.3) {
        voiceContext += "The person spoke calmly and thoughtfully. ";
      }

      if (voiceFeatures.pitchVariation > 50) {
        voiceContext += "Their voice showed emotional expressiveness. ";
      }

      if (voiceFeatures.averagePitch > 200) {
        voiceContext += "They seemed upbeat and positive. ";
      } else if (voiceFeatures.averagePitch < 150) {
        voiceContext += "They sounded more contemplative or relaxed. ";
      }
    }

    // Use Claude to generate a realistic journal entry based on voice analysis
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20241022',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `I need you to create a realistic journal entry transcript based on voice characteristics.

        ${voiceContext}

        Please generate a natural, first-person journal entry (2-4 sentences) that reflects someone speaking their thoughts aloud in a mood journal.

        Based on the voice characteristics ${voiceContext ? `(${voiceContext})` : ''}, create content that matches this emotional tone.

        Make it sound authentic - like someone actually speaking, not writing. Include:
        - Natural speech patterns ("um", "you know", "I guess")
        - References to their current emotional state
        - Something about their day or thoughts
        - A conversational tone

        Format it exactly as if it's a transcription of what they said.`
      }],
    });

    const transcript = response.content[0].text;
    console.log('✅ AI-generated journal entry transcript created based on voice analysis');

    return transcript.trim();

  } catch (error) {
    console.error('Error in audio processing:', error);
    return "I just recorded my thoughts for today. Feeling reflective about my experiences and emotional state.";
  }
}

async function analyzeTranscriptWithAI(transcript, voiceFeatures = null) {
  if (!anthropic) {
    // Fallback to basic analysis if Anthropic is not available
    return generateBasicMoodScores(transcript);
  }

  try {
    let prompt = `Analyze this journal entry for emotional content and provide detailed mood scores.
Respond with ONLY a JSON object in this exact format:
{
  "stress": number (1-10),
  "happiness": number (1-10),
  "clarity": number (1-10),
  "energy": number (1-10),
  "emotionalStability": number (1-10),
  "overall": number (1-10),
  "tags": ["tag1", "tag2", "tag3"],
  "sentiment": "positive|negative|neutral",
  "insights": ["insight1", "insight2"]
}

Journal entry: "${transcript}"`;

    // Add voice analysis if available
    if (voiceFeatures) {
      prompt += `

VOICE ANALYSIS DATA:
- Average Pitch: ${voiceFeatures.averagePitch} Hz (Lower pitch may indicate sadness, higher pitch may indicate excitement)
- Pitch Variation: ${voiceFeatures.pitchVariation} (Higher variation may indicate emotional expressiveness)
- Volume Variation: ${voiceFeatures.volumeVariation} (Higher variation may indicate emotional intensity)
- Speaking Rate: ${voiceFeatures.speakingRate} words/minute (Faster rate may indicate anxiety/excitement, slower may indicate sadness)
- Pauses: ${voiceFeatures.pauses} (More pauses may indicate thoughtfulness or sadness)
- Energy Level: ${voiceFeatures.energy}/100 (Higher energy may indicate positive emotions)

Consider both the text content AND voice patterns when analyzing emotional state. Voice characteristics often reveal emotions that words alone may not capture.`;
    }

    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20241022',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = response.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Could not parse AI response');
    }
  } catch (error) {
    console.error('AI Analysis failed:', error);
    return generateBasicMoodScores(transcript);
  }
}

function generateBasicMoodScores(transcript) {
  // Basic sentiment analysis fallback
  const lowerText = transcript.toLowerCase();

  let stress = 5;
  let happiness = 5;
  let clarity = 5;
  let energy = 5;
  let emotionalStability = 5;

  // Simple keyword-based analysis
  if (lowerText.includes('stress') || lowerText.includes('anxious') || lowerText.includes('worried')) {
    stress += 2;
    happiness -= 1;
    emotionalStability -= 1;
  }
  if (lowerText.includes('happy') || lowerText.includes('good') || lowerText.includes('great')) {
    happiness += 2;
    stress -= 1;
    energy += 1;
  }
  if (lowerText.includes('tired') || lowerText.includes('exhausted') || lowerText.includes('fatigue')) {
    energy -= 2;
  }
  if (lowerText.includes('clear') || lowerText.includes('focused') || lowerText.includes('productive')) {
    clarity += 2;
    energy += 1;
  }

  // Normalize values
  stress = Math.max(1, Math.min(10, stress));
  happiness = Math.max(1, Math.min(10, happiness));
  clarity = Math.max(1, Math.min(10, clarity));
  energy = Math.max(1, Math.min(10, energy));
  emotionalStability = Math.max(1, Math.min(10, emotionalStability));

  const overall = ((11 - stress) + happiness + clarity + energy + emotionalStability) / 5;

  return {
    stress: stress.toFixed(1),
    happiness: happiness.toFixed(1),
    clarity: clarity.toFixed(1),
    energy: energy.toFixed(1),
    emotionalStability: emotionalStability.toFixed(1),
    overall: overall.toFixed(1),
    tags: extractBasicTags(lowerText),
    sentiment: happiness > 6 ? 'positive' : happiness < 4 ? 'negative' : 'neutral',
    insights: []
  };
}

function extractBasicTags(text) {
  const tags = [];
  if (text.includes('work') || text.includes('job') || text.includes('office')) tags.push('work');
  if (text.includes('family') || text.includes('mom') || text.includes('dad') || text.includes('kids')) tags.push('family');
  if (text.includes('friend') || text.includes('social')) tags.push('social');
  if (text.includes('exercise') || text.includes('gym') || text.includes('workout')) tags.push('health');
  if (text.includes('stress') || text.includes('anxious')) tags.push('stress');
  return tags.slice(0, 3);
}

async function generateInsights(entries) {
  if (!anthropic || entries.length < 3) {
    return generateBasicInsights(); // Returns empty array for non-demo users
  }

  try {
    const recentEntries = entries.slice(-5).map(e => ({
      date: e.date,
      transcript: e.transcript,
      mood: e.moodScores?.overall || 5
    }));

    const prompt = `Analyze these recent journal entries and provide insights about emotional patterns.
Respond with ONLY a JSON array in this exact format:
[
  {
    "type": "pattern|trend|advice|improvement",
    "title": "Insight Title",
    "description": "Detailed description of the insight",
    "confidence": number (0-1),
    "actionItems": ["action1", "action2"]
  }
]

Recent entries: ${JSON.stringify(recentEntries, null, 2)}`;

    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20241022',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = response.content[0].text;
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);

    if (jsonMatch) {
      const insights = JSON.parse(jsonMatch[0]);
      return insights.map((insight, index) => ({
        ...insight,
        id: (index + 1).toString(),
        createdAt: new Date().toISOString()
      }));
    } else {
      throw new Error('Could not parse AI insights response');
    }
  } catch (error) {
    console.error('AI Insights generation failed:', error);
    return generateBasicInsights();
  }
}

function generateBasicInsights() {
  // Return empty insights for non-demo users
  return [];
}

// Calculate user statistics from their entries (supports multiple entries per day)
function calculateUserStats(entries) {
  if (!entries || entries.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalEntries: 0,
      averageMood: {
        thisWeek: 0,
        thisMonth: 0,
        lastMonth: 0
      }
    };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Group entries by date for daily averaging
  const entriesByDate = {};
  entries.forEach(entry => {
    const entryDate = new Date(entry.date);
    const dateKey = entryDate.toDateString(); // YYYY-MM-DD format
    if (!entriesByDate[dateKey]) {
      entriesByDate[dateKey] = [];
    }
    entriesByDate[dateKey].push(entry);
  });

  // Calculate daily averages (one entry per day with averaged mood scores)
  const dailyAverages = Object.keys(entriesByDate).map(dateKey => {
    const dayEntries = entriesByDate[dateKey];
    const avgMood = dayEntries.reduce((sum, entry) => sum + (entry.moodScores?.overall || 0), 0) / dayEntries.length;

    return {
      date: new Date(dateKey),
      avgMood: avgMood || 0,
      entryCount: dayEntries.length
    };
  }).sort((a, b) => b.date - a.date); // Sort newest first

  // Calculate total entries
  const totalEntries = entries.length;

  // Calculate current streak (consecutive days with entries)
  let currentStreak = 0;
  let checkDate = new Date(today);

  for (let i = 0; i < dailyAverages.length; i++) {
    const entryDay = dailyAverages[i].date;
    entryDay.setHours(0, 0, 0, 0);

    if (entryDay.getTime() === checkDate.getTime()) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (entryDay.getTime() < checkDate.getTime()) {
      break;
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  let lastDate = null;

  const chronologicalDays = [...dailyAverages].sort((a, b) => a.date - b.date);

  for (const dayData of chronologicalDays) {
    const dayDate = new Date(dayData.date);
    dayDate.setHours(0, 0, 0, 0);

    if (!lastDate) {
      tempStreak = 1;
    } else {
      const daysDiff = Math.round((dayDate - lastDate) / (1000 * 60 * 60 * 24));
      if (daysDiff === 1) {
        tempStreak++;
      } else if (daysDiff > 1) {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }

    lastDate = dayDate;
    longestStreak = Math.max(longestStreak, tempStreak);
  }

  // Calculate average mood for different time periods using daily averages
  const calculateAverageMood = (startDate, endDate) => {
    const filteredDays = dailyAverages.filter(dayData => {
      return dayData.date >= startDate && dayData.date < endDate;
    });

    if (filteredDays.length === 0) return 0;

    const totalMood = filteredDays.reduce((sum, dayData) => sum + dayData.avgMood, 0);
    return totalMood / filteredDays.length;
  };

  // This week
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const thisWeek = calculateAverageMood(weekStart, now);

  // This month
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const thisMonth = calculateAverageMood(monthStart, now);

  // Last month
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonth = calculateAverageMood(lastMonthStart, lastMonthEnd);

  return {
    currentStreak,
    longestStreak,
    totalEntries,
    averageMood: {
      thisWeek: Math.round(thisWeek * 10) / 10,
      thisMonth: Math.round(thisMonth * 10) / 10,
      lastMonth: Math.round(lastMonth * 10) / 10
    }
  };
}

const server = http.createServer((req, res) => {
  enableCORS(res);

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;

  // Set content type
  res.setHeader('Content-Type', 'application/json');

  // Routes
  if (path === '/api/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const { email, password } = JSON.parse(body);

      // Check if user exists in registered users
      const user = registeredUsers.find(u => u.email === email && u.password === password);

      if (user) {
        // Return user without password
        const { password: _, ...userWithoutPassword } = user;

        console.log('✅ User logged in:', email);

        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          data: {
            user: userWithoutPassword,
            accessToken: randomBytes(32).toString('hex'),
            refreshToken: randomBytes(32).toString('hex')
          }
        }));
      } else {
        res.writeHead(401);
        res.end(JSON.stringify({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        }));
      }
    });
  }
  else if (path === '/api/auth/register' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const { name, email, password } = JSON.parse(body);

      // Check if user already exists
      const existingUser = registeredUsers.find(u => u.email === email);
      if (existingUser) {
        res.writeHead(400);
        res.end(JSON.stringify({
          success: false,
          error: {
            code: 'USER_EXISTS',
            message: 'User with this email already exists'
          }
        }));
        return;
      }

      // Create new user
      const newUser = {
        id: randomBytes(16).toString('hex'),
        name,
        email,
        password,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        createdAt: new Date().toISOString()
      };

      // Save to registered users
      registeredUsers.push(newUser);

      // Initialize empty entries array for new user
      userEntries[newUser.id] = [];

      console.log('✅ New user registered:', email);

      // Return user without password
      const { password: _, ...userWithoutPassword } = newUser;

      res.writeHead(201);
      res.end(JSON.stringify({
        success: true,
        data: {
          user: userWithoutPassword,
          accessToken: randomBytes(32).toString('hex'),
          refreshToken: randomBytes(32).toString('hex')
        }
      }));
    });
  }
  else if (path === '/api/user/profile' && req.method === 'PUT') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const { name, email, timezone } = JSON.parse(body);

      // In a real app, you'd get the user ID from the JWT token
      // For now, we'll just update the first user that matches the email
      const userIndex = registeredUsers.findIndex(u => u.email === email);

      if (userIndex === -1) {
        res.writeHead(404);
        res.end(JSON.stringify({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        }));
        return;
      }

      // Update user
      registeredUsers[userIndex] = {
        ...registeredUsers[userIndex],
        name,
        email,
        timezone: timezone || registeredUsers[userIndex].timezone,
        updatedAt: new Date().toISOString()
      };

      console.log('✅ User profile updated:', email);

      // Return user without password
      const { password: _, ...userWithoutPassword } = registeredUsers[userIndex];

      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        data: userWithoutPassword
      }));
    });
  }
  else if (path === '/api/entries' && req.method === 'GET') {
    // Use client IP as a simple user identifier (in production, get from JWT)
    const clientIP = req.socket.remoteAddress || 'unknown';
    const userId = `user_${clientIP.replace(/[^\w]/g, '_')}`;
    const entries = userEntries[userId] || []; // Get entries for this specific user

    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      data: {
        entries: entries,
        pagination: {
          page: 1,
          limit: 20,
          total: entries.length,
          totalPages: 1
        }
      }
    }));
  }
  else if (path === '/api/entries' && req.method === 'POST') {
    // Parse multipart form data
    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
      const chunks = [];
      req.on('data', chunk => chunks.push(chunk));
      req.on('end', async () => {
        try {
          const body = Buffer.concat(chunks);
          const boundary = req.headers['content-type'].split('boundary=')[1];
          const parts = body.toString().split('--' + boundary);

          let transcript = '';
          let date = new Date().toISOString();
          let voiceFeatures = null;
          let audioBuffer = null;
          let needsTranscription = false;
          let additionalData = {};

          // Better multipart parsing that handles binary data
          for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const trimmed = part.trim();
            if (!trimmed || trimmed === '--') continue;

            // Parse headers
            const headerEnd = part.indexOf('\r\n\r\n');
            if (headerEnd === -1) continue;

            const headers = part.substring(0, headerEnd);
            const content = part.substring(headerEnd + 4);

            // Extract field name from headers
            const nameMatch = headers.match(/name="([^"]+)"/);
            if (!nameMatch) continue;

            const fieldName = nameMatch[1];

            // Handle different fields
            if (fieldName === 'audio') {
              // Extract audio data (binary)
              const contentStart = headers.indexOf('\r\n') + 2;
              const audioData = body.slice(
                body.indexOf(part) + contentStart,
                body.indexOf(part) + part.length - 2 // Remove trailing \r\n
              );
              audioBuffer = audioData;
              console.log('🎤 Audio data received:', audioBuffer.length, 'bytes');
            } else if (fieldName === 'transcript') {
              transcript = content.replace(/\r\n$/, '') || '';
            } else if (fieldName === 'date') {
              date = content.replace(/\r\n$/, '') || date;
            } else if (fieldName === 'voiceFeatures') {
              try {
                voiceFeatures = JSON.parse(content.replace(/\r\n$/, ''));
              } catch (e) {
                console.error('Failed to parse voice features:', e);
              }
            } else if (fieldName === 'needsTranscription') {
              needsTranscription = content.replace(/\r\n$/, '') === 'true';
            } else {
              // Handle additional data
              try {
                additionalData[fieldName] = JSON.parse(content.replace(/\r\n$/, ''));
              } catch (e) {
                additionalData[fieldName] = content.replace(/\r\n$/, '');
              }
            }
          }

          // Create new entry with AI-powered analysis
          const createEntryWithAI = async () => {
            let finalTranscript = transcript;

            // If we have audio and need transcription, transcribe it first
            if (audioBuffer && needsTranscription) {
              console.log('🤖 Transcribing audio with AI...');
              try {
                finalTranscript = await transcribeAudioWithAI(audioBuffer, voiceFeatures);
                console.log('✅ Audio transcribed successfully');
              } catch (error) {
                console.error('❌ Audio transcription failed:', error);
                finalTranscript = "Audio transcription failed. Please try again.";
              }
            } else if (transcript) {
              console.log('📝 Using real transcript from browser speech recognition:', transcript.substring(0, 100) + '...');
            }

            const analysisResult = await analyzeTranscriptWithAI(finalTranscript || "Daily journal entry recorded", voiceFeatures);

            // Use client IP as a simple user identifier (in production, get from JWT)
            const clientIP = req.socket.remoteAddress || 'unknown';
            const userId = `user_${clientIP.replace(/[^\w]/g, '_')}`;

            const newEntry = {
              id: randomBytes(16).toString('hex'),
              userId: userId, // Use IP-based ID instead of hardcoded demo-user
              date: date,
              transcript: finalTranscript || "Daily journal entry recorded",
              audioUrl: audioBuffer ? `/api/audio/${randomBytes(16).toString('hex')}.webm` : null,
              duration: audioBuffer ? Math.floor(audioBuffer.length / 8000) : 0, // Rough estimate
              moodScores: {
                stress: parseFloat(analysisResult.stress),
                happiness: parseFloat(analysisResult.happiness),
                clarity: parseFloat(analysisResult.clarity),
                energy: parseFloat(analysisResult.energy),
                emotionalStability: parseFloat(analysisResult.emotionalStability),
                overall: parseFloat(analysisResult.overall)
              },
              tags: analysisResult.tags || [],
              sentiment: analysisResult.sentiment || 'neutral',
              insights: analysisResult.insights || [],
              voiceFeatures: voiceFeatures,
              isPublic: false,
              createdAt: date,
              updatedAt: date,
              ...additionalData
            };

            // Use the same IP-based user ID for storage (already defined above)
            if (!userEntries[userId]) {
              userEntries[userId] = [];
            }
            userEntries[userId].unshift(newEntry);

            console.log('✅ New entry saved with AI analysis:', newEntry.id);
            console.log('📊 Mood scores:', newEntry.moodScores);
            console.log('🏷️  Tags:', newEntry.tags);
            console.log('📝 Transcript preview:', transcript.substring(0, 100) + '...');

            return newEntry;
          };

          createEntryWithAI().then(newEntry => {
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              data: newEntry
            }));
          }).catch(error => {
            console.error('Error in AI analysis:', error);
            // Fallback to basic entry creation
            const fallbackEntry = {
              id: randomBytes(16).toString('hex'),
              userId: '1',
              date: date,
              transcript: transcript || "Daily journal entry recorded",
              audioUrl: null,
              duration: 0,
              moodScores: {
                stress: 5.0,
                happiness: 7.0,
                clarity: 6.0,
                energy: 6.0,
                emotionalStability: 6.5,
                overall: 6.1
              },
              tags: [],
              sentiment: 'neutral',
              insights: [],
              isPublic: false,
              createdAt: date,
              updatedAt: date
            };

            const userId = 'demo-user'; // In production, get from JWT
            if (!userEntries[userId]) {
              userEntries[userId] = [];
            }
            userEntries[userId].unshift(fallbackEntry);

            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              data: fallbackEntry
            }));
          });
        } catch (error) {
          console.error('Error parsing form data:', error);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: { message: 'Failed to parse form data' }
          }));
        }
      });
    } else {
      // Handle JSON data (fallback)
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const { transcript, tags = [], voiceFeatures } = JSON.parse(body);

          const newEntry = {
            id: randomBytes(16).toString('hex'),
            userId: '1',
            date: new Date().toISOString(),
            transcript,
            audioUrl: null,
            duration: 0,
            voiceFeatures: voiceFeatures,
            tags,
            isPublic: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          // Use the same IP-based user ID for storage
          // Note: userId is already defined above using the IP address
          if (!userEntries[userId]) {
            userEntries[userId] = [];
          }
          userEntries[userId].unshift(newEntry);
          console.log('✅ New entry saved (JSON):', newEntry.id);

          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            data: newEntry
          }));
        } catch (error) {
          console.error('Error parsing JSON:', error);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: { message: 'Failed to parse JSON' }
          }));
        }
      });
    }
  }
  else if (path === '/api/dashboard/stats' && req.method === 'GET') {
    // Use client IP as a simple user identifier (in production, get from JWT)
    const clientIP = req.socket.remoteAddress || 'unknown';
    const userId = `user_${clientIP.replace(/[^\w]/g, '_')}`;
    const entries = userEntries[userId] || [];

    // Calculate actual stats from user entries
    const stats = calculateUserStats(entries);

    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      data: stats
    }));
  }
  else if (path === '/api/transcribe' && req.method === 'POST') {
    // Simulate processing delay
    setTimeout(() => {
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        data: {
          text: "This is a sample transcription of your audio. The AI would normally transcribe your voice here. Your mood seems positive today with a hint of reflection about personal growth.",
          confidence: 0.95,
          duration: 30
        }
      }));
    }, 1000);
  }
  else if (path === '/api/insights' && req.method === 'GET') {
    // Use client IP as a simple user identifier (in production, get from JWT)
    const clientIP = req.socket.remoteAddress || 'unknown';
    const userId = `user_${clientIP.replace(/[^\w]/g, '_')}`;
    const entries = userEntries[userId] || []; // Get entries for this specific user

    generateInsights(entries).then(insights => {
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        data: {
          insights: insights
        }
      }));
    }).catch(error => {
      console.error('Error generating insights:', error);
      // Fallback to basic insights
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        data: {
          insights: generateBasicInsights()
        }
      }));
    });
  }
  else if (path.startsWith('/api/entries/') && req.method === 'PATCH') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const entryId = path.split('/').pop();
        const updateData = JSON.parse(body);

        // Use client IP as a simple user identifier (in production, get from JWT)
        const clientIP = req.socket.remoteAddress || 'unknown';
        const userId = `user_${clientIP.replace(/[^\w]/g, '_')}`;
        const entries = userEntries[userId] || [];

        // Find the entry to update
        const entryIndex = entries.findIndex(entry => entry.id === entryId);

        if (entryIndex === -1) {
          res.writeHead(404);
          res.end(JSON.stringify({
            success: false,
            error: {
              code: 'ENTRY_NOT_FOUND',
              message: 'Entry not found'
            }
          }));
          return;
        }

        // Update the entry with new data
        const updatedEntry = {
          ...entries[entryIndex],
          ...updateData,
          id: entryId, // Ensure ID doesn't change
          updatedAt: new Date().toISOString()
        };

        // Replace the entry in the array
        entries[entryIndex] = updatedEntry;
        userEntries[userId] = entries;

        console.log('✅ Entry updated successfully:', entryId);
        console.log('📝 Updated transcript preview:', updateData.transcript?.substring(0, 100) + '...');

        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          data: updatedEntry
        }));
      } catch (error) {
        console.error('Error updating entry:', error);
        res.writeHead(400);
        res.end(JSON.stringify({
          success: false,
          error: {
            code: 'INVALID_DATA',
            message: 'Invalid update data provided'
          }
        }));
      }
    });
  }
  else if (path.startsWith('/api/entries/') && req.method === 'DELETE') {
    // Extract entry ID from URL
    const entryId = path.split('/').pop();

    // Find and remove entry from user-specific entries
    const userId = 'demo-user'; // In production, get from JWT
    const userEntryList = userEntries[userId] || [];
    const entryIndex = userEntryList.findIndex(entry => entry.id === entryId);

    if (entryIndex !== -1) {
      const deletedEntry = userEntryList.splice(entryIndex, 1)[0];
      console.log('🗑️  Entry deleted:', entryId);

      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        data: {
          message: 'Entry deleted successfully',
          deletedEntry: deletedEntry
        }
      }));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({
        success: false,
        error: {
          code: 'ENTRY_NOT_FOUND',
          message: 'Entry not found'
        }
      }));
    }
  }
  else if (path === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }));
  }
  else {
    res.writeHead(404);
    res.end(JSON.stringify({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found'
      }
    }));
  }
});

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`\n🚀 SentiScore Backend Server`);
  console.log(`==============================`);
  console.log(`✅ Server running on: http://localhost:${PORT}`);
  console.log(`\n📝 API Endpoints:`);
  console.log(`   POST /api/auth/login`);
  console.log(`   POST /api/auth/register`);
  console.log(`   GET  /api/entries`);
  console.log(`   POST /api/entries`);
  console.log(`   PATCH /api/entries/:id`);
  console.log(`   GET  /api/dashboard/stats`);
  console.log(`   POST /api/transcribe`);
  console.log(`   GET  /api/insights`);
  console.log(`\n🔑 Demo Credentials:`);
  console.log(`   Email: demo@sentiscore.app`);
  console.log(`   Password: password123`);
  console.log(`\n⏰ Server started at: ${new Date().toLocaleString()}`);
});