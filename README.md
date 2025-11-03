# AI Video Generator Dashboard

A web-based dashboard for generating AI-powered stickman style videos. Transform your scripts into animated videos using Google Gemini for image generation and ElevenLabs for text-to-speech.

## Features

- 📝 **Script Input**: Write or paste your script with real-time validation
- 🎨 **Multiple Art Styles**: Choose from simple stickman, detailed stickman, cartoon, or minimalist styles
- 🎤 **Voice Options**: Multiple voice options for narration (Rachel, Adam, Bella, Sam)
- 🎵 **Background Music**: Optional background music (upbeat, calm, dramatic)
- 📊 **Real-time Progress**: Live progress updates via WebSocket
- 🎥 **Video Preview**: Built-in video player with custom controls
- 📥 **Download & Share**: Download generated videos or share them with others
- ⚙️ **Advanced Settings**: Control resolution, frame rate, and video quality

## Technology Stack

### Backend
- **Node.js** with **Express** - Server and API
- **TypeScript** - Type safety
- **Google Gemini API** - AI image generation
- **ElevenLabs API** - Text-to-speech
- **FFmpeg** - Video processing and assembly
- **WebSocket** - Real-time progress updates
- **Joi** - Request validation

### Frontend
- **React 18** with **TypeScript** - UI components
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Custom Hooks** - State management

## Quick Start

### Prerequisites

1. **Node.js** (v18 or higher)
2. **FFmpeg** installed and available in PATH
3. **API Keys**:
   - Google Gemini API key
   - ElevenLabs API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd videogpt
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Configure environment variables**
   ```bash
   cd ..
   cp .env.example .env
   # Edit .env and add your API keys
   ```

5. **Create upload directories**
   ```bash
   mkdir -p backend/uploads/images backend/uploads/audio backend/videos backend/temp
   ```

6. **Start the development servers**

   **Terminal 1 - Backend:**
   ```bash
   cd backend
   npm run dev
   ```

   **Terminal 2 - Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

7. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## API Configuration

### Google Gemini API

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

### ElevenLabs API

1. Sign up at [ElevenLabs](https://elevenlabs.io/)
2. Get your API key from the profile settings
3. Add it to your `.env` file:
   ```
   ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
   ```

## Usage

1. **Write Your Script**: Enter your script in the text area (minimum 50 characters, 3 lines)
2. **Choose Settings**: Select art style, voice, and other preferences
3. **Generate Video**: Click "Generate Video" to start the process
4. **Monitor Progress**: Watch real-time progress updates
5. **Preview & Download**: Once complete, preview your video and download it

## Project Structure

```
videogpt/
├── backend/                 # Express server
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utility functions
│   │   └── app.ts          # Main app file
│   ├── uploads/            # Generated media files
│   ├── videos/             # Final video output
│   └── package.json
├── frontend/               # React app
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API services
│   │   └── App.tsx         # Main app component
│   └── package.json
├── shared/                 # Shared types
│   └── types/
├── .env.example            # Environment template
└── README.md
```

## API Endpoints

### POST /api/generate
Start video generation

**Request:**
```json
{
  "script": "Your script here...",
  "settings": {
    "videoLength": 60,
    "artStyle": "stickman-simple",
    "voiceId": "rachel",
    "backgroundMusic": "none",
    "frameRate": 30,
    "resolution": "1920x1080"
  }
}
```

**Response:**
```json
{
  "jobId": "uuid-string",
  "estimatedTime": 120,
  "message": "Video generation started"
}
```

### GET /api/health
Health check endpoint

## WebSocket Events

Connect to `ws://localhost:3001` and subscribe to job updates:

```javascript
ws.send(JSON.stringify({
  type: 'subscribe',
  jobId: 'your-job-id'
}));
```

**Progress Update:**
```json
{
  "jobId": "uuid-string",
  "progress": 45,
  "currentStep": "Generating images",
  "message": "Generated 5/10 images"
}
```

## Development

### Available Scripts

**Backend:**
- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run typecheck` - Run TypeScript type checking

**Frontend:**
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

### Environment Variables

See `.env.example` for all available configuration options.

## Troubleshooting

### Common Issues

1. **FFmpeg not found**: Install FFmpeg and ensure it's in your PATH
2. **API key errors**: Verify your API keys are correct and have sufficient quotas
3. **Port conflicts**: Change the PORT in your `.env` file if needed
4. **CORS errors**: Ensure FRONTEND_URL matches your frontend URL

### Logs

- Backend logs are shown in the terminal where you run `npm run dev`
- Browser console shows frontend logs and WebSocket messages
- Check network tab for API request/response details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
- Check the troubleshooting section
- Review the logs for error messages
- Open an issue on GitHub with details about your problem