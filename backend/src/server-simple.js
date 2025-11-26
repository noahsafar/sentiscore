const express = require('express');
const cors = require('cors');
const { randomBytes } = require('crypto');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Sample data
const sampleEntries = [
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

// Sample user
const sampleUser = {
  id: 'demo-user',
  email: 'demo@ai-mood-journal.com',
  name: 'Demo User'
};

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (email === 'demo@ai-mood-journal.com' && password === 'password123') {
    res.json({
      success: true,
      data: {
        user: sampleUser,
        accessToken: randomBytes(32).toString('hex'),
        refreshToken: randomBytes(32).toString('hex')
      }
    });
  } else {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      }
    });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { name, email } = req.body;

  res.json({
    success: true,
    data: {
      user: { ...sampleUser, name, email },
      accessToken: randomBytes(32).toString('hex'),
      refreshToken: randomBytes(32).toString('hex')
    }
  });
});

// Entry routes
app.get('/api/entries', (req, res) => {
  res.json({
    success: true,
    data: {
      entries: sampleEntries,
      pagination: {
        page: 1,
        limit: 20,
        total: 3,
        totalPages: 1
      }
    }
  });
});

app.post('/api/entries', (req, res) => {
  const { transcript, tags = [] } = req.body;

  const newEntry = {
    id: randomBytes(16).toString('hex'),
    date: new Date().toISOString(),
    transcript,
    moodScores: {
      stress: Math.random() * 10,
      happiness: Math.random() * 10,
      clarity: Math.random() * 10,
      energy: Math.random() * 10,
      emotionalStability: Math.random() * 10,
      overall: Math.random() * 10
    },
    tags
  };

  res.status(201).json({
    success: true,
    data: newEntry
  });
});

// Dashboard routes
app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      currentStreak: 5,
      longestStreak: 12,
      totalEntries: 30,
      averageMood: {
        thisWeek: 7.2,
        thisMonth: 6.8,
        lastMonth: 6.5
      }
    }
  });
});

// Transcription route (mock)
app.post('/api/transcribe', (req, res) => {
  setTimeout(() => {
    res.json({
      success: true,
      data: {
        text: "This is a sample transcription of your audio. The AI would normally transcribe your voice here.",
        confidence: 0.95,
        duration: 30
      }
    });
  }, 1000);
});

// Insights route
app.get('/api/insights', (req, res) => {
  res.json({
    success: true,
    data: {
      insights: [
        {
          id: '1',
          type: 'pattern',
          title: 'Weekend Mood Improvement',
          description: 'Your mood scores tend to be 20% higher on weekends.',
          confidence: 0.85,
          actionItems: ['Consider weekend activities', 'Schedule more leisure time'],
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          type: 'advice',
          title: 'Morning Energy Boost',
          description: 'Your energy levels are lowest in morning entries. Consider starting your day with meditation.',
          confidence: 0.72,
          actionItems: ['Try a 5-minute morning meditation'],
          createdAt: new Date().toISOString()
        }
      ]
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log('\n🔑 Demo credentials:');
  console.log('   Email: demo@ai-mood-journal.com');
  console.log('   Password: password123');
});