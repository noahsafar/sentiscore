# AI Mood Journal - Setup Guide

A complete AI-powered mood journal application with voice input, sentiment analysis, and mood tracking.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL 14+
- Redis (optional, for background jobs)
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/ai-mood-journal.git
cd ai-mood-journal
```

### 2. Install Dependencies

```bash
npm run install:all
```

This will install dependencies for both frontend and backend.

### 3. Environment Configuration

#### Backend Environment

Create `.env` file in the `backend` directory:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and configure:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/mood_journal

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# OpenAI (optional but recommended)
OPENAI_API_KEY=your-openai-api-key

# Other optional services...
REDIS_URL=redis://localhost:6379
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### Frontend Environment

Create `.env.local` file in the `frontend` directory:

```bash
cp frontend/.env.local.example frontend/.env.local
```

### 4. Database Setup

#### Option A: Local PostgreSQL

1. Install PostgreSQL
2. Create a database:
   ```sql
   CREATE DATABASE mood_journal;
   ```

#### Option B: Docker PostgreSQL

```bash
docker run --name postgres-mood-journal \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=mood_journal \
  -p 5432:5432 \
  -d postgres:14
```

#### Run Migrations

```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

### 5. Start the Application

```bash
# Start both frontend and backend
npm run dev

# Or start individually:
npm run dev:frontend  # Frontend on http://localhost:3000
npm run dev:backend   # Backend on http://localhost:8000
```

### 6. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/api-docs

### 7. Demo Account

Login with:
- Email: `demo@ai-mood-journal.com`
- Password: `password123`

## 🛠️ Development

### Project Structure

```
ai-mood-journal/
├── frontend/          # Next.js app
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── types/
│   └── public/
├── backend/           # Node.js API
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── utils/
│   ├── prisma/        # Database schema
│   └── uploads/       # Audio uploads
└── docs/             # Documentation
```

### Available Scripts

#### Root Level

```bash
npm run dev          # Start both frontend and backend
npm run build        # Build both frontend and backend
npm run start        # Start production server
npm run lint         # Lint all code
npm run type-check   # Type check all code
```

#### Frontend

```bash
cd frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript check
```

#### Backend

```bash
cd backend
npm run dev          # Start dev server with nodemon
npm run build        # Compile TypeScript
npm run start        # Start production server
npm run test         # Run tests
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Prisma Studio
```

## 🔧 Configuration

### Voice Recording Features

The app supports multiple transcription services:

1. **OpenAI Whisper** (Recommended)
   - Set `OPENAI_API_KEY` in backend `.env`
   - Most accurate transcription

2. **Mock Transcription** (Default)
   - Works without API keys
   - Generates realistic sample transcripts

### Email Notifications

Configure SMTP for email notifications:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

For Gmail, enable "Less secure apps" or use an App Password.

### File Storage

By default, audio files are stored locally in `backend/uploads`. For production, configure AWS S3:

```env
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
S3_BUCKET=mood-journal-uploads
```

## 🚀 Deployment

### Option 1: Docker

Build and run with Docker:

```bash
docker-compose up -d
```

See `docker-compose.yml` for configuration.

### Option 2: Vercel + Railway

1. Deploy frontend to Vercel
2. Deploy backend to Railway/Heroku/Render
3. Configure environment variables
4. Set `NEXT_PUBLIC_API_URL` in Vercel

### Option 3: Self-hosted

1. Build the application:
   ```bash
   npm run build
   ```

2. Configure reverse proxy (nginx) pointing to:
   - Frontend: port 3000
   - Backend: port 8000

3. Set up SSL certificates

## 🔒 Security

- JWT tokens for authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS configuration
- Input validation and sanitization
- File upload restrictions

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📊 Monitoring

### Logs

- Backend logs: `backend/logs/`
- Rotated daily
- Different levels: error, info, debug

### Database

Use Prisma Studio to view data:

```bash
cd backend
npx prisma studio
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check PostgreSQL is running
   - Verify DATABASE_URL in `.env`
   - Ensure database exists

2. **Audio Recording Not Working**
   - Check microphone permissions
   - Use HTTPS in production
   - Verify Web Audio API support

3. **Transcription Failing**
   - Check OpenAI API key
   - Verify network connectivity
   - Check audio file format

4. **CORS Errors**
   - Verify FRONTEND_URL in backend `.env`
   - Check API base URL in frontend

## 📚 API Documentation

Once running, visit http://localhost:8000/api-docs for interactive API documentation.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make your changes
4. Add tests
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- Create an issue on GitHub
- Check the documentation
- Review existing issues