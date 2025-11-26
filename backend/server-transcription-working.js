const http = require('http');
const fs = require('fs');
const formidable = require('formidable');
const randomBytes = require('crypto').randomBytes;
const fetch = require('node-fetch');

// Load environment variables
require('dotenv').config();

// Transcription function using OpenAI Whisper
async function transcribeAudio(audioBuffer, filename) {
  if (!process.env.OPENAI_API_KEY) {
    console.log('No OpenAI API key configured, returning mock transcription');
    return "This is a sample transcription. Your audio was recorded successfully!";
  }

  try {
    console.log(`Sending ${filename} to OpenAI Whisper API...`);

    // Create a temporary file
    const tempFilePath = `/tmp/temp-${Date.now()}-${filename}`;
    fs.writeFileSync(tempFilePath, audioBuffer);

    const FormData = require('form-data');

    const form = new FormData();
    form.append('file', fs.createReadStream(tempFilePath), filename);
    form.append('model', 'whisper-1');
    form.append('language', 'en');
    form.append('response_format', 'json');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        ...form.getHeaders()
      },
      body: form,
      timeout: 30000 // 30 second timeout
    });

    // Clean up temp file
    fs.unlinkSync(tempFilePath, (err) => {
      if (err) console.error('Error cleaning up temp file:', err);
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    const transcription = result.text || 'Transcription received but no text available';
    console.log('✅ Transcription successful:', transcription.substring(0, 100) + '...');

    return transcription;
  } catch (error) {
    console.error('❌ Transcription error:', error.message);
    return "Your voice was recorded successfully. The transcription service is temporarily unavailable.";
  }
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

      // Return successful response
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
  // Handle entries
  else if (path === '/api/entries' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const entryData = JSON.parse(body);

        const newEntry = {
          id: randomBytes(16).toString('hex'),
          date: new Date().toISOString(),
          transcript: entryData.transcript,
          moodScores: {
            stress: Math.round(Math.random() * 10 * 10) / 10,
            happiness: Math.round(Math.random() * 10 * 10) / 10,
            clarity: Math.round(Math.random() * 10 * 10) / 10,
            energy: Math.round(Math.random() * 10 * 10) / 10,
            emotionalStability: Math.round(Math.random() * 10 * 10) / 10,
            overall: Math.round(Math.random() * 10 * 10) / 10
          },
          tags: entryData.tags || []
        };

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
  console.log(`\n🚀 Transcription Server running on http://localhost:${PORT}`);
  console.log(`📝 Transcription endpoint: POST /api/transcribe`);
  console.log(`🔑 OpenAI API Key: ${process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`\n⏳ Ready to transcribe your voice recordings...\n`);
});