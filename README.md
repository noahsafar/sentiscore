# SentiScore - AI Mood Journal

An AI-powered mood journaling application that helps users track their emotional well-being through voice recordings, mood analytics, and intelligent insights.

## Features

- 🎙️ **Voice Recording**: Record journal entries using voice-to-text
- 📊 **Mood Analytics**: Visualize mood patterns and trends over time
- 🤖 **AI-Powered Insights**: Get intelligent analysis of your emotional patterns
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🔍 **Search & Filter**: Easily find past entries
- 📈 **Dashboard**: Comprehensive overview of your emotional health
- 🎯 **Mood Tracking**: Track multiple mood dimensions (stress, happiness, clarity, etc.)

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations
- **Chart.js** - Data visualization
- **React Hook Form** - Form handling with validation
- **Zustand** - State management

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **TypeScript** - Type-safe JavaScript

## Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/noahsafar/sentiscore.git
   cd sentiscore
   ```

2. Install dependencies for all workspaces:
   ```bash
   npm run install:all
   ```

3. Set up environment variables:
   - Copy `frontend/.env.local.example` to `frontend/.env.local`
   - Copy `backend/.env.example` to `backend/.env`
   - Update with your API keys (optional for demo)

4. Run the development servers:
   ```bash
   npm run dev
   ```

5. Open your browser:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

### Demo Credentials

For testing the application:
- **Email**: demo@ai-mood-journal.com
- **Password**: password123

## Project Structure

```
sentiscore/
├── frontend/          # Next.js frontend application
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── pages/      # Next.js pages
│   │   ├── store/      # State management
│   │   ├── types/      # TypeScript type definitions
│   │   └── utils/      # Utility functions
│   ├── public/         # Static assets
│   └── package.json
├── backend/           # Node.js backend API
│   └── src/
│       └── server-basic.js  # Express server
└── package.json       # Root package.json (workspace configuration)
```

## Available Scripts

### Root Level

- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:frontend` - Start only the frontend
- `npm run dev:backend` - Start only the backend
- `npm run build` - Build both frontend and backend
- `npm run install:all` - Install all dependencies
- `npm run clean` - Clean all node_modules

### Frontend

- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Backend

- `npm run dev` - Start development server
- `npm run start` - Start production server

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Journal Entries
- `GET /api/entries` - Get all entries
- `POST /api/entries` - Create new entry

### Analytics
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/analytics` - Get mood analytics
- `GET /api/insights` - Get AI-generated insights

### Voice
- `POST /api/transcribe` - Transcribe audio to text

## Environment Variables

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000

# Optional: For enhanced features
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_AZURE_SPEECH_KEY=your_azure_speech_key
NEXT_PUBLIC_AZURE_SPEECH_REGION=your_azure_region
```

### Backend (.env)
```bash
# Optional: For production features
OPENAI_API_KEY=your_openai_api_key
AZURE_SPEECH_KEY=your_azure_speech_key
AZURE_SPEECH_REGION=your_azure_region
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with ❤️ for better mental health awareness
- Inspired by the importance of emotional self-awareness
