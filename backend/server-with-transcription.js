const http = require('http');
const fs = require('fs');
const { formidable } = require('formidable');
const randomBytes = require('crypto').randomBytes;

// Load environment variables
require('dotenv').config();

// Transcription function
async function transcribeAudio(buffer) {
  // If you have OpenAI API key, use it
  if (process.env.OPENAI_API_KEY) {
    try {
      const FormData = require('form-data');
      const https = require('https');

      const form = new FormData();
      form.append('file', buffer, 'audio.webm');
      form.append('model', 'whisper-1');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: form
      });

      if (!response.ok) {
        throw new Error('OpenAI transcription failed');
      }

      const result = await response.json();
      return result.text || result.text || "Transcription completed";
    } catch (error) {
      console.error('OpenAI error:', error);
      return "This is a sample transcription since the real transcription service is not available.";
    }
  }

  // Return mock transcription if no API key
  return "This is a sample transcription. Your actual audio would be transcribed here if an API key was provided.";
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
      const form = formidable({});
      const [fields, files] = await form.parse(req);

      if (!files.audio) {
        res.writeHead(400);
        res.end(JSON.stringify({
          success: false,
          error: 'No audio file provided'
        }));
        return;
      }

      const audioFile = files.audio[0];
      if (!audioFile) {
        res.writeHead(400);
        res.end(JSON.stringify({
          success: false,
          error: 'Audio file is empty'
        }));
        return;
      }

      // Read the audio file
      const audioBuffer = fs.readFileSync(audioFile.filepath);

      // Transcribe the audio
      const transcription = await transcribeAudio(audioBuffer);

      console.log('Transcription completed:', transcription.substring(0, 100));

      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        data: {
          text: transcription,
          confidence: 0.95,
          duration: 0
        }
      }));
    } catch (error) {
      console.error('Transcription error:', error);
      res.writeHead(500);
      res.end(JSON.stringify({
        success: false,
        error: 'Transcription failed'
      }));
    }
  }
  // Handle other routes with mock data
  else if (path === '/api/auth/login' && req.method === 'POST') {
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      data: {
        token: 'mock-token',
        user: {
          id: '1',
          email: 'demo@ai-mood-journal.com',
          name: 'Demo User'
        }
      }
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
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Transcription endpoint: POST /api/transcribe`);
  console.log(`🔑 OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'Configured' : 'Not configured'}`);
});