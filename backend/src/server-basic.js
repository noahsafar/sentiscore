const http = require('http');
const { randomBytes } = require('crypto');
const url = require('url');

// Enable CORS
const enableCORS = (res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
};

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

      if (email === 'demo@ai-mood-journal.com' && password === 'password123') {
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          data: {
            user: sampleUser,
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
      const { name, email } = JSON.parse(body);

      res.writeHead(201);
      res.end(JSON.stringify({
        success: true,
        data: {
          user: { ...sampleUser, name, email },
          accessToken: randomBytes(32).toString('hex'),
          refreshToken: randomBytes(32).toString('hex')
        }
      }));
    });
  }
  else if (path === '/api/entries' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
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
    }));
  }
  else if (path === '/api/entries' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const { transcript, tags = [] } = JSON.parse(body);

      const newEntry = {
        id: randomBytes(16).toString('hex'),
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

      res.writeHead(201);
      res.end(JSON.stringify({
        success: true,
        data: newEntry
      }));
    });
  }
  else if (path === '/api/dashboard/stats' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
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
    res.writeHead(200);
    res.end(JSON.stringify({
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
    }));
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
  console.log(`\n🚀 AI Mood Journal Backend Server`);
  console.log(`==============================`);
  console.log(`✅ Server running on: http://localhost:${PORT}`);
  console.log(`\n📝 API Endpoints:`);
  console.log(`   POST /api/auth/login`);
  console.log(`   POST /api/auth/register`);
  console.log(`   GET  /api/entries`);
  console.log(`   POST /api/entries`);
  console.log(`   GET  /api/dashboard/stats`);
  console.log(`   POST /api/transcribe`);
  console.log(`   GET  /api/insights`);
  console.log(`\n🔑 Demo Credentials:`);
  console.log(`   Email: demo@ai-mood-journal.com`);
  console.log(`   Password: password123`);
  console.log(`\n⏰ Server started at: ${new Date().toLocaleString()}`);
});