import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import rateLimit from 'express-rate-limit';
import path from 'path';

// Import routes
import generateRoutes from './routes/generate';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Create WebSocket server for real-time progress updates
const wss = new WebSocketServer({ server });

// Store active WebSocket connections by job ID
const jobConnections = new Map<string, Set<any>>();

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || '10'), // limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many video generation requests. Please try again later.'
  }
});

app.use('/api/', limiter);

// Serve static files (generated videos)
app.use('/videos', express.static(path.join(__dirname, '../videos')));

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection established');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === 'subscribe' && data.jobId) {
        // Add connection to job-specific group
        if (!jobConnections.has(data.jobId)) {
          jobConnections.set(data.jobId, new Set());
        }
        jobConnections.get(data.jobId)!.add(ws);

        // Send confirmation
        ws.send(JSON.stringify({
          type: 'subscribed',
          jobId: data.jobId
        }));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    // Remove connection from all job groups
    jobConnections.forEach((connections, jobId) => {
      connections.delete(ws);
      if (connections.size === 0) {
        jobConnections.delete(jobId);
      }
    });
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Export WebSocket broadcast function for use in services
export const broadcastToJob = (jobId: string, message: any) => {
  const connections = jobConnections.get(jobId);
  if (connections) {
    const messageStr = JSON.stringify(message);
    connections.forEach(ws => {
      if (ws.readyState === ws.OPEN) {
        ws.send(messageStr);
      }
    });
  }
};

// API Routes
app.use('/api/generate', generateRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 AI Video Generator Backend running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for connections`);
  console.log(`🔗 CORS enabled for: ${FRONTEND_URL}`);
});

export default app;