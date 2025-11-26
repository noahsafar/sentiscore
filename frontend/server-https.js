const https = require('https');
const fs = require('fs');
const { execSync } = require('child_process');

// Generate a self-signed certificate
if (!fs.existsSync('./localhost-key.pem')) {
  console.log('Generating SSL certificate...');
  execSync('openssl req -x509 -newkey rsa:4096 -keyout localhost-key.pem -out localhost.pem -days 365 -nodes -subj "/CN=localhost"', { cwd: __dirname });
}

const options = {
  key: fs.readFileSync('./localhost-key.pem'),
  cert: fs.readFileSync('./localhost.pem')
};

const { spawn } = require('child_process');

const port = 3001;

// Create HTTPS server that proxies to Next.js
const server = https.createServer(options, (req, res) => {
  // This is a simple workaround - we'll just redirect to HTTP
  // since Next.js handles HTTPS better with proper configuration
  res.writeHead(302, { Location: `http://localhost:${port}${req.url}` });
  res.end();
});

server.listen(3443, () => {
  console.log(`\nHTTPS proxy server running on https://localhost:3443`);
  console.log(`Redirecting to Next.js at http://localhost:${port}`);
  console.log('\nUse https://localhost:3443 in your browser for microphone access!\n');
});

// Start Next.js in HTTP mode
const next = spawn('npm', ['run', 'dev'], {
  cwd: process.cwd(),
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: port.toString()
  }
});

// Cleanup on exit
process.on('SIGINT', () => {
  server.close();
  next.kill();
  process.exit();
});