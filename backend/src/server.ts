import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import path from 'path';
import { randomBytes } from 'crypto';

const app = express();
const server = createServer(app);
const PORT = process.env['PORT'] || 8000;

// Middleware
app.use(cors({
  origin: process.env['FRONTEND_URL'] || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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

const sampleUser = {
  id: 'demo-user',
  email: 'demo@ai-mood-journal.com',
  name: 'Demo User'
};

// In-memory storage
let entries = [...sampleEntries];
let authToken = 'demo-token';

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (email === 'demo@ai-mood-journal.com' && password === 'password123') {
    res.json({
      success: true,
      data: {
        user: sampleUser,
        accessToken: authToken,
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
      accessToken: authToken,
      refreshToken: randomBytes(32).toString('hex')
    }
  });
});

// Entry routes
app.get('/api/entries', (_req, res) => {
  res.json({
    success: true,
    data: {
      entries,
      pagination: {
        page: 1,
        limit: 20,
        total: entries.length,
        totalPages: 1
      }
    }
  });
});

app.post('/api/entries', (req, res) => {
  const { transcript, tags = [] } = req.body;

  const newEntry = {
    id: Date.now().toString(),
    date: new Date().toISOString(),
    transcript,
    moodScores: {
      stress: Math.round(Math.random() * 10 * 10) / 10,
      happiness: Math.round(Math.random() * 10 * 10) / 10,
      clarity: Math.round(Math.random() * 10 * 10) / 10,
      energy: Math.round(Math.random() * 10 * 10) / 10,
      emotionalStability: Math.round(Math.random() * 10 * 10) / 10,
      overall: Math.round(Math.random() * 10 * 10) / 10
    },
    tags
  };

  entries.unshift(newEntry);

  res.status(201).json({
    success: true,
    data: newEntry
  });
});

app.delete('/api/entries/:id', (req, res) => {
  const { id } = req.params;
  entries = entries.filter(e => e.id !== id);
  res.json({
    success: true,
    data: { message: 'Entry deleted successfully' }
  });
});

// Dashboard routes
app.get('/api/dashboard/stats', (_req, res) => {
  res.json({
    success: true,
    data: {
      currentStreak: 5,
      longestStreak: 12,
      totalEntries: entries.length,
      averageMood: {
        thisWeek: 7.2,
        thisMonth: 6.8,
        lastMonth: 6.5
      }
    }
  });
});

// Transcription route (mock)
app.post('/api/transcribe', (_req, res) => {
  setTimeout(() => {
    const mockTranscripts = [
      "Today was quite productive. I managed to complete all my tasks and even had time for a walk in the park.",
      "I've been feeling a bit overwhelmed lately with all the responsibilities, but I'm trying to stay positive.",
      "Had a great conversation with a friend today. It's amazing how talking can change your perspective.",
      "Meditation this morning really helped me start the day on a calm note. I should make this a daily habit.",
      "Feeling grateful for my family and the support they provide. Sometimes I forget how lucky I am."
    ];

    const randomIndex = Math.floor(Math.random() * mockTranscripts.length);

    res.json({
      success: true,
      data: {
        text: mockTranscripts[randomIndex],
        confidence: 0.95,
        duration: Math.floor(Math.random() * 120) + 30 // 30-150 seconds
      }
    });
  }, 1500); // Simulate processing time
});

// Insights route
app.get('/api/insights', (_req, res) => {
  res.json({
    success: true,
    data: {
      insights: [
        {
          id: '1',
          type: 'pattern',
          title: 'Weekend Mood Improvement',
          description: 'Your mood scores tend to be 20% higher on weekends compared to weekdays.',
          confidence: 0.85,
          actionItems: ['Consider what contributes to your better weekend mood', 'Try to incorporate weekend activities into weekdays'],
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          type: 'trend',
          title: 'Stress Levels Decreasing',
          description: 'Your stress levels have decreased by 30% over the past month.',
          confidence: 0.78,
          actionItems: ['Continue with your current stress management techniques'],
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          type: 'advice',
          title: 'Morning Energy Boost',
          description: 'Your energy levels are lowest in morning entries. Consider starting your day with meditation or light exercise.',
          confidence: 0.72,
          actionItems: ['Try a 5-minute morning meditation', 'Consider a short walk before starting your day'],
          createdAt: new Date().toISOString()
        }
      ]
    }
  });
});

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`\n🚀 AI Mood Journal Backend Server`);
  console.log(`==============================`);
  console.log(`✅ Server running on: http://localhost:${PORT}`);
  console.log(`\n📝 API Endpoints:`);
  console.log(`   POST /api/auth/login`);
  console.log(`   POST /api/auth/register`);
  console.log(`   GET  /api/entries`);
  console.log(`   POST /api/entries`);
  console.log(`   DELETE /api/entries/:id`);
  console.log(`   GET  /api/dashboard/stats`);
  console.log(`   POST /api/transcribe`);
  console.log(`   GET  /api/insights`);
  console.log(`\n🔑 Demo Credentials:`);
  console.log(`   Email: demo@ai-mood-journal.com`);
  console.log(`   Password: password123`);
  console.log(`\n⏰ Server started at: ${new Date().toLocaleString()}`);
});