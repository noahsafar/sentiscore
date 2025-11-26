const http = require('http');
const fs = require('fs');
const randomBytes = require('crypto').randomBytes;

// Load environment variables
require('dotenv').config();

// A simple multipart parser
function parseMultipart(data, boundary) {
  const parts = data.split(`--${boundary}`);
  const result = {};

  for (const part of parts) {
    if (part.includes('Content-Disposition')) {
      const nameMatch = part.match(/name="([^"]+)"/);
      const filenameMatch = part.match(/filename="([^"]+)"/);
      const contentTypeMatch = part.match(/Content-Type:\s*(.+)/i);

      const name = nameMatch ? nameMatch[1] : null;

      if (name && filenameMatch) {
        // This is a file
        const headersEnd = part.indexOf('\r\n\r\n');
        if (headersEnd !== -1) {
          const contentStart = headersEnd + 4;
          const contentEnd = part.indexOf(`\r\n--${boundary}`);
          if (contentEnd > contentStart) {
            // Extract the raw buffer for this part
            const content = part.slice(contentStart, contentEnd);
            result[name] = Buffer.from(content, 'binary');
            console.log(`Found file field: ${name}, size: ${result[name].length} bytes`);
          }
        }
      }
    }
  }

  return result;
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
      const buffers = [];
      for await (req of req) {
        buffers.push(req);
      }
      const data = Buffer.concat(buffers);

      // Helper function to get header (case-insensitive)
      function getHeader(headers, name) {
        for (const key in headers) {
          if (key.toLowerCase() === name.toLowerCase()) {
            return headers[key];
          }
        }
        return null;
      }

      // Get content-type header
      const contentType = getHeader(req.headers, 'content-type') || '';

      console.log('Content-Type:', contentType);
      console.log('Request body size:', data.length);

      // Extract boundary
      const boundaryMatch = contentType.match(/boundary=([^;]+)/);
      const boundary = boundaryMatch ? boundaryMatch[1] : null;

      if (!boundary) {
        console.error('No boundary found in content-type:', contentType);
        console.error('Headers:', Object.keys(req.headers));
        throw new Error('No boundary found in content-type. Make sure you are sending multipart/form-data.');
      }

      // Parse the multipart data
      const formData = parseMultipart(data, boundary);
      const audioBuffer = formData.audio;

      if (!audioBuffer) {
        throw new Error('No audio data found in request');
      }

      console.log(`Received audio: ${audioBuffer.length} bytes`);

      // Try to use OpenAI Whisper API
      let transcription = "Audio recording received successfully";

      if (process.env.OPENAI_API_KEY) {
        try {
          console.log('Sending audio to OpenAI Whisper API...');

          // Create a proper multipart form for OpenAI API
          const FormData = require('form-data');
          const fetch = require('node-fetch');

          const form = new FormData();
          form.append('file', audioBuffer, {
            filename: 'audio.webm',
            contentType: 'audio/webm'
          });
          form.append('model', 'whisper-1');
          form.append('language', 'en'); // Optional: specify language
          form.append('response_format', 'json');

          const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              ...form.getHeaders()
            },
            body: form
          });

          if (!response.ok) {
            const errorData = await response.text();
            console.error('OpenAI API error:', errorData);
            throw new Error(`OpenAI API error: ${response.status}`);
          }

          const result = await response.json();
          transcription = result.text || 'Transcription received but no text available';
          console.log('Transcription successful:', transcription.substring(0, 100));
        } catch (error) {
          console.error('Transcription API error:', error.message);
          transcription = "Audio recorded successfully. Transcription service temporarily unavailable.";
        }
      } else {
        console.log('No OpenAI API key configured, returning mock transcription');
        transcription = "This is a sample transcription. Your audio was recorded successfully!";
      }

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
        error: error.message || 'Transcription failed'
      }));
    }
  }
  // Handle other routes with mock data
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

        // Validate required fields
        if (!registerData.email || !registerData.password || !registerData.name) {
          res.writeHead(400);
          res.end(JSON.stringify({
            success: false,
            error: 'Email, password, and name are required'
          }));
          return;
        }

        // In a real app, you'd hash the password and save to database
        // For now, just return success with a mock user
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
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Transcription endpoint: POST /api/transcribe`);
  console.log(`🔑 OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'Configured' : 'Not configured'}`);
});