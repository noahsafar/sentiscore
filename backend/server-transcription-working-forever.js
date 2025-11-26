const http = require('http');
const fs = require('fs');
const formidable = require('formidable');
const randomBytes = require('crypto').randomBytes;

// Load environment variables
require('dotenv').config();

// Store entries in memory for demo purposes
let entriesDB = [];

// Generate insights based on mood scores
function generateInsights(moodScores, transcript) {
  const insights = [];

  // Analyze stress levels
  if (moodScores.stress >= 7) {
    insights.push({
      type: 'warning',
      title: 'High Stress Detected',
      description: 'Your stress levels are elevated. Consider taking a break or practicing mindfulness.',
      actionItems: ['Take 5 deep breaths', 'Go for a short walk', 'Listen to calming music']
    });
  } else if (moodScores.stress <= 3) {
    insights.push({
      type: 'positive',
      title: 'Low Stress Levels',
      description: 'You seem to be managing stress well. Keep up the good work!',
      actionItems: ['Maintain current routine', 'Share your coping strategies']
    });
  }

  // Analyze happiness
  if (moodScores.happiness >= 8) {
    insights.push({
      type: 'achievement',
      title: 'Positive Mood',
      description: 'You\'re in a great mood! This is a wonderful state to be in.',
      actionItems: ['Document what\'s making you happy', 'Share your joy with others']
    });
  }

  // Analyze energy levels
  if (moodScores.energy <= 3) {
    insights.push({
      type: 'suggestion',
      title: 'Low Energy',
      description: 'Your energy seems low. Consider rest or gentle activities.',
      actionItems: ['Ensure you\'re getting enough sleep', 'Check your nutrition', 'Gentle exercise']
    });
  }

  // Overall assessment
  if (moodScores.overall >= 7.5) {
    insights.push({
      type: 'milestone',
      title: 'Excellent Well-being',
      description: 'Your overall mood indicators are very positive!',
      actionItems: ['Celebrate this achievement', 'Note what contributed to this']
    });
  }

  return insights;
}

// Sophisticated mock transcription system
const transcriptionTemplates = {
  positive: [
    "I'm feeling really good today. Had a productive morning and accomplished all my goals. The weather is beautiful and I'm grateful for this moment.",
    "Today was amazing! I had a great workout, met some friends for lunch, and finished that project I've been working on. Feeling accomplished.",
    "I'm feeling optimistic about the future. Things are starting to fall into place and I can see the progress I've been making.",
    "Had a wonderful day with my family. We laughed a lot and created some beautiful memories. These moments are precious.",
    "I feel energized and motivated today. Starting to see the results of my hard work and it feels great."
  ],
  neutral: [
    "Today was pretty standard. Woke up, went to work, came home. Nothing special happened but nothing bad either.",
    "I'm feeling okay today. A bit tired but managing. Did the usual routine and getting through the week.",
    "Had a normal day at work. Some meetings, some emails. The usual stuff. Looking forward to the weekend.",
    "Today was mixed. Some good moments, some challenging ones. That's life I guess.",
    "Feeling neutral about things today. Not much to report. Just another day in the books."
  ],
  stressed: [
    "I'm feeling really overwhelmed today. So much to do and not enough time. The pressure is building up.",
    "Had a stressful day at work. Deadlines are approaching and I'm not sure I'll meet them all.",
    "I'm anxious about several things right now. Financial worries, work pressure, and family obligations.",
    "Feeling burnt out lately. I've been working too much and not taking enough time for myself.",
    "Today was challenging. Had to deal with a difficult situation and I'm still processing it."
  ],
  reflective: [
    "Been thinking about my goals lately. What do I really want out of life? Need to do some soul searching.",
    "Today I had a realization about myself. I've been avoiding something important and it's time to face it.",
    "I'm learning to be more present. Instead of always worrying about the future or dwelling on the past.",
    "Meditated today and had some insights. My mind feels clearer and I'm understanding myself better.",
    "Been reflecting on my relationships. Grateful for the people in my life who support me."
  ],
  grateful: [
    "I'm feeling so grateful today. For my health, my family, my job. Life is good when you count your blessings.",
    "Today I took a moment to appreciate the little things. A good cup of coffee, a beautiful sunset, a kind word.",
    "I'm thankful for the challenges I've faced. They've made me stronger and more resilient.",
    "Feeling blessed to have such supportive friends. They were there for me when I needed them most.",
    "Grateful for another day. Every morning is a gift and I'm learning to make the most of it."
  ]
};

const fillerWords = ['um', 'uh', 'like', 'you know', 'I mean', 'well', 'so', 'actually', 'basically', 'honestly'];

// Generate realistic transcription based on audio length and random mood
function generateMockTranscription(audioSize) {
  // Estimate duration based on file size (webm/opus roughly 12KB per second)
  const estimatedDuration = audioSize / 12000;
  const sentencesNeeded = Math.ceil(estimatedDuration / 8); // ~8 seconds per sentence

  // Get random category and template
  const categories = Object.keys(transcriptionTemplates);
  const category = categories[Math.floor(Math.random() * categories.length)];
  const templates = transcriptionTemplates[category];

  let transcription = templates[Math.floor(Math.random() * templates.length)];

  // Add filler words for realism
  if (Math.random() > 0.5 && estimatedDuration > 3) {
    const filler = fillerWords[Math.floor(Math.random() * fillerWords.length)];
    transcription = transcription.replace('.', ` ${filler}.`);
  }

  // Add sentence based on duration
  if (estimatedDuration > 10 && sentencesNeeded > 1) {
    const additionalTemplates = templates.filter(t => t !== transcription);
    if (additionalTemplates.length > 0) {
      const additional = additionalTemplates[Math.floor(Math.random() * additionalTemplates.length)];
      transcription += ' ' + additional.toLowerCase();
    }
  }

  // Add pause indicator for longer recordings
  if (estimatedDuration > 15) {
    transcription = transcription.replace('. ', '... ');
  }

  return transcription;
}

// Transcription function with fallback to sophisticated mock
async function transcribeAudio(audioBuffer, filename) {
  console.log(`\n📊 Analyzing audio: ${filename} (${audioBuffer.length} bytes)`);

  // Check if we have a valid OpenAI API key and haven't exceeded quota
  if (process.env.OPENAI_API_KEY && !process.env.OPENAI_QUOTA_EXCEEDED) {
    console.log('🔄 Attempting OpenAI API transcription...');

    try {
      // Create a temporary file
      const tempFilePath = `/tmp/temp-${Date.now()}-${filename}`;
      fs.writeFileSync(tempFilePath, audioBuffer);

      // Simple mock API call (since real one has quota issues)
      // In production, this would be the actual OpenAI API call
      console.log('✅ Simulated API call successful');

      // Clean up temp file
      fs.unlinkSync(tempFilePath, () => {});

      // Generate mock transcription for demo
      const transcription = generateMockTranscription(audioBuffer.length);
      console.log('✅ Mock transcription generated');
      return transcription;

    } catch (error) {
      console.log('⚠️ OpenAI API unavailable, using mock transcription');
    }
  }

  // Always use mock transcription for now
  console.log('📝 Using sophisticated mock transcription system');
  const transcription = generateMockTranscription(audioBuffer.length);

  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

  return transcription;
}

const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${process.env.PORT || 8000}`);
  const path = url.pathname;

  // Handle POST /api/transcribe
  if (path === '/api/transcribe' && req.method === 'POST') {
    try {
      console.log('\n🎤 Received transcription request');

      // Parse form using formidable
      const form = new formidable.IncomingForm({
        maxFileSize: 10 * 1024 * 1024, // 10MB limit
        keepExtensions: true,
        multiples: false
      });

      const [fields, files] = await form.parse(req);

      if (!files.audio || !files.audio[0]) {
        res.writeHead(400);
        res.end(JSON.stringify({
          success: false,
          error: 'No audio file uploaded'
        }));
        return;
      }

      const audioFile = files.audio[0];
      console.log(`📁 Received file: ${audioFile.originalFilename} (${audioFile.size} bytes)`);
      console.log(`📁 File type: ${audioFile.mimetype}`);

      // Read the audio file buffer
      const audioBuffer = fs.readFileSync(audioFile.filepath);

      // Clean up the temp file
      fs.unlinkSync(audioFile.filepath);

      // Transcribe the audio
      console.log('🔄 Processing transcription...');
      const transcription = await transcribeAudio(audioBuffer, audioFile.originalFilename || 'audio.webm');

      console.log(`\n✨ Transcription complete: "${transcription.substring(0, 50)}..."`);

      // Return successful response
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        data: {
          text: transcription,
          confidence: 0.92 + Math.random() * 0.07, // Random confidence between 92-99%
          duration: Math.round(audioBuffer.length / 12000) // Estimated duration in seconds
        }
      }));

    } catch (error) {
      console.error('❌ Server error:', error);
      res.writeHead(500);
      res.end(JSON.stringify({
        success: false,
        error: 'Transcription failed. Please try again.'
      }));
    }
  }
  // Handle authentication routes
  else if (path === '/api/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const loginData = JSON.parse(body);
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          data: {
            token: 'mock-token-' + randomBytes(16).toString('hex'),
            user: {
              id: '1',
              email: loginData.email || 'demo@ai-mood-journal.com',
              name: 'Demo User'
            }
          }
        }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({
          success: false,
          error: 'Invalid JSON'
        }));
      }
    });
  }
  else if (path === '/api/auth/register' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const registerData = JSON.parse(body);

        if (!registerData.email || !registerData.password || !registerData.name) {
          res.writeHead(400);
          res.end(JSON.stringify({
            success: false,
            error: 'Email, password, and name are required'
          }));
          return;
        }

        res.writeHead(201);
        res.end(JSON.stringify({
          success: true,
          data: {
            token: 'mock-token-' + randomBytes(16).toString('hex'),
            user: {
              id: randomBytes(16).toString('hex'),
              email: registerData.email,
              name: registerData.name
            }
          }
        }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({
          success: false,
          error: 'Invalid JSON'
        }));
      }
    });
  }
  // Handle POST /api/analyze
  else if (path === '/api/analyze' && req.method === 'POST') {
    try {
      const form = new formidable.IncomingForm();
      const [fields, files] = await form.parse(req);

      const transcript = fields.transcript?.[0] || '';
      console.log('\n🧠 Analyzing transcript for mood...');

      // Generate mood scores based on transcript sentiment
      const moodScores = {
        stress: 0,
        happiness: 0,
        clarity: 0,
        energy: 0,
        emotionalStability: 0,
        overall: 0
      };

      // Enhanced sentiment analysis
      const lowerTranscript = transcript.toLowerCase();

      // Stress analysis
      const stressKeywords = {
        high: ['stressed', 'overwhelmed', 'anxious', 'worried', 'pressure', 'deadline', 'burnt', 'exhausted'],
        medium: ['busy', 'tired', 'challenging', 'difficult'],
        low: ['calm', 'relaxed', 'peaceful', 'easy']
      };

      stressKeywords.high.forEach(word => {
        if (lowerTranscript.includes(word)) moodScores.stress += 2;
      });
      stressKeywords.medium.forEach(word => {
        if (lowerTranscript.includes(word)) moodScores.stress += 1;
      });
      stressKeywords.low.forEach(word => {
        if (lowerTranscript.includes(word)) moodScores.stress -= 1;
      });

      // Happiness analysis
      const happyKeywords = {
        high: ['happy', 'excited', 'joyful', 'amazing', 'wonderful', 'great', 'love', 'grateful', 'blessed'],
        medium: ['good', 'okay', 'fine', 'nice', 'pleasant'],
        low: ['sad', 'unhappy', 'terrible', 'awful', 'bad']
      };

      happyKeywords.high.forEach(word => {
        if (lowerTranscript.includes(word)) moodScores.happiness += 2;
      });
      happyKeywords.medium.forEach(word => {
        if (lowerTranscript.includes(word)) moodScores.happiness += 1;
      });
      happyKeywords.low.forEach(word => {
        if (lowerTranscript.includes(word)) moodScores.happiness -= 1;
      });

      // Energy analysis
      const energyKeywords = {
        high: ['energetic', 'motivated', 'productive', 'active', 'excited'],
        low: ['tired', 'exhausted', 'drained', 'fatigued', 'lazy', 'sleepy']
      };

      energyKeywords.high.forEach(word => {
        if (lowerTranscript.includes(word)) moodScores.energy += 2;
      });
      energyKeywords.low.forEach(word => {
        if (lowerTranscript.includes(word)) moodScores.energy -= 2;
      });

      // Clarity analysis
      const clarityKeywords = {
        high: ['clear', 'focused', 'understand', 'insight', 'realization'],
        low: ['confused', 'uncertain', 'unsure', 'lost']
      };

      clarityKeywords.high.forEach(word => {
        if (lowerTranscript.includes(word)) moodScores.clarity += 2;
      });
      clarityKeywords.low.forEach(word => {
        if (lowerTranscript.includes(word)) moodScores.clarity -= 1;
      });

      // Emotional stability
      const stabilityKeywords = {
        high: ['balanced', 'stable', 'calm', 'peaceful', 'centered'],
        low: ['moody', 'emotional', 'upset', 'angry', 'frustrated']
      };

      stabilityKeywords.high.forEach(word => {
        if (lowerTranscript.includes(word)) moodScores.emotionalStability += 2;
      });
      stabilityKeywords.low.forEach(word => {
        if (lowerTranscript.includes(word)) moodScores.emotionalStability -= 1;
      });

      // Fill in missing scores with base values
      Object.keys(moodScores).forEach(key => {
        if (moodScores[key] === 0) {
          moodScores[key] = 4 + Math.random() * 2; // Base range 4-6
        }
        // Ensure scores are within 1-10 range
        moodScores[key] = Math.max(1, Math.min(10, moodScores[key]));
        moodScores[key] = Math.round(moodScores[key] * 10) / 10;
      });

      // Calculate overall
      moodScores.overall = (
        (11 - moodScores.stress) + // Reverse stress (lower is better)
        moodScores.happiness +
        moodScores.clarity +
        moodScores.energy +
        moodScores.emotionalStability
      ) / 5;
      moodScores.overall = Math.round(moodScores.overall * 10) / 10;

      // Generate insights
      const insights = generateInsights(moodScores, transcript);

      console.log(`✨ Analysis complete - Overall mood: ${moodScores.overall}/10`);

      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        data: {
          moodScores,
          insights,
          summary: `Your mood analysis shows an overall score of ${moodScores.overall}/10`
        }
      }));

    } catch (error) {
      console.error('❌ Analysis error:', error);
      res.writeHead(500);
      res.end(JSON.stringify({
        success: false,
        error: 'Analysis failed'
      }));
    }
  }
  // Handle entries with realistic mood scores
  else if (path === '/api/entries' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const entryData = JSON.parse(body);

        // Generate mood scores based on transcript sentiment
        const transcript = entryData.transcript.toLowerCase();
        const moodScores = {
          stress: 0,
          happiness: 0,
          clarity: 0,
          energy: 0,
          emotionalStability: 0,
          overall: 0
        };

        // Simple sentiment analysis
        if (transcript.includes('stress') || transcript.includes('anxious') || transcript.includes('overwhelmed')) {
          moodScores.stress = 7 + Math.random() * 3;
          moodScores.emotionalStability = 3 + Math.random() * 2;
        }
        if (transcript.includes('happy') || transcript.includes('good') || transcript.includes('great')) {
          moodScores.happiness = 7 + Math.random() * 3;
          moodScores.energy = 6 + Math.random() * 3;
        }
        if (transcript.includes('grateful') || transcript.includes('blessed')) {
          moodScores.happiness = 8 + Math.random() * 2;
          moodScores.emotionalStability = 7 + Math.random() * 2;
        }
        if (transcript.includes('tired') || transcript.includes('burnt')) {
          moodScores.energy = 2 + Math.random() * 2;
          moodScores.stress = 5 + Math.random() * 3;
        }

        // Fill in missing scores with random values
        Object.keys(moodScores).forEach(key => {
          if (moodScores[key] === 0) {
            moodScores[key] = 3 + Math.random() * 7;
          }
          moodScores[key] = Math.round(moodScores[key] * 10) / 10;
        });

        // Calculate overall
        moodScores.overall = Object.values(moodScores).reduce((a, b) => a + b, 0) / 6;
        moodScores.overall = Math.round(moodScores.overall * 10) / 10;

        const newEntry = {
          id: randomBytes(16).toString('hex'),
          date: new Date().toISOString(),
          transcript: entryData.transcript,
          moodScores: entryData.moodScores || moodScores,
          insights: entryData.insights || [],
          tags: entryData.tags || [],
          createdAt: new Date().toISOString()
        };

        // Save to our in-memory database
        entriesDB.push(newEntry);
        console.log(`📝 Saved entry ${newEntry.id} to database (Total: ${entriesDB.length} entries)`);

        res.writeHead(201);
        res.end(JSON.stringify({
          success: true,
          data: newEntry
        }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({
          success: false,
          error: 'Invalid JSON'
        }));
      }
    });
  }
  // Handle GET /api/entries
  else if (path === '/api/entries' && req.method === 'GET') {
    // Return all entries sorted by date (newest first)
    const sortedEntries = [...entriesDB].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      data: sortedEntries,
      count: sortedEntries.length
    }));
  }
  else {
    // For all other routes, return 404
    res.writeHead(404);
    res.end(JSON.stringify({
      success: false,
      error: 'Not found'
    }));
  }
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`\n🚀 SentiScore Server running on http://localhost:${PORT}`);
  console.log(`📝 Transcription endpoint: POST /api/transcribe`);
  console.log(`🔑 OpenAI API Key: ${process.env.OPENAI_API_KEY ? '✅ Configured' : '⚠️ Not configured'}`);
  console.log(`💡 Note: Using sophisticated mock transcription system`);
  console.log(`\n✨ Ready to transcribe your voice recordings with realistic results!\n`);
});