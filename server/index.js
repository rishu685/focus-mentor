import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { aiRateLimiter } from './services/aiService.js';
import dotenv from 'dotenv';
import curateResourcesRouter from './routes/curateResources.js';
import generatePlanRouter from './routes/generatePlan.js';
import pdfChatRouter from './routes/pdfChat.js';
import meetingRoomsRouter from './routes/meetingRooms.js';
import syllabusRouter from './routes/syllabus.js';
import studyBuddyRouter from './routes/studyBuddy.js';
import aiChatRouter from './routes/aiChat.js';
import cleanupAIRouter from './routes/cleanupAI.js';
import rateLimit from 'express-rate-limit';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import MeetingRoom from './models/meetingRoom.js';
// Load environment variables
dotenv.config();

// Ensure required directories exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!existsSync(uploadsDir)) {
  await mkdir(uploadsDir, { recursive: true });
  console.log('Created uploads directory');
}

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "https://mind-mentor-pearl.vercel.app",
      "https://mind-mentor.kartiklabhshetwar.me", 
      "https://focus-mentor.netlify.app",
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "https://www.mind-mentor.ink",
      "https://mind-mentor.ink",
    ],
    methods: ["GET", "POST"]
  }
});
const port = process.env.PORT || 8000;

// Trust proxy - required for rate limiting behind reverse proxies
app.set('trust proxy', 1);
app.use(express.json());

// Middleware
app.use(
  cors({
    origin: [
      "https://mind-mentor-pearl.vercel.app",
      "https://mind-mentor.kartiklabhshetwar.me",
      "https://focus-mentor.netlify.app",
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "https://www.mind-mentor.ink",
      "https://mind-mentor.ink",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  // Add trusted proxy configuration
  trustProxy: true
});

// Apply rate limiter to all routes
app.use(limiter);

// Apply rate limiter to AI-related routes
app.use('/api/resources', aiRateLimiter);
app.use('/api/study-plan', aiRateLimiter);

// Basic health check
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Focus Mentor API is running' });
});

// Lightweight health check for Docker (no embeddings)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Focus Mentor API is running',
    timestamp: new Date().toISOString()
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Apply routes with proper path mounting
app.use('/api/study-plan', generatePlanRouter);
app.use('/api/curate-resources', curateResourcesRouter);
app.use('/api/chat', aiChatRouter);
app.use('/pdf', pdfChatRouter);
app.use('/api/meeting-rooms', meetingRoomsRouter);
app.use('/api/syllabus', syllabusRouter);
app.use('/api/study-buddy', studyBuddyRouter);
app.use('/api/cleanup-ai-plans', cleanupAIRouter);

// Socket.io for real-time meeting communication
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join meeting room
  socket.on('join-room', async (data) => {
    const { roomId, participantId, participantName } = data;
    
    try {
      const room = await MeetingRoom.findByRoomId(roomId);
      if (room) {
        socket.join(roomId);
        socket.to(roomId).emit('participant-joined', {
          participantId,
          participantName
        });
        
        console.log(`${participantName} joined room ${roomId}`);
      }
    } catch (error) {
      console.error('Error joining room:', error);
    }
  });

  // Leave meeting room
  socket.on('leave-room', (data) => {
    const { roomId, participantId, participantName } = data;
    socket.leave(roomId);
    socket.to(roomId).emit('participant-left', {
      participantId,
      participantName
    });
    console.log(`${participantName} left room ${roomId}`);
  });

  // WebRTC signaling
  socket.on('webrtc-signal', (data) => {
    const { roomId, targetParticipantId, signal } = data;
    socket.to(roomId).emit('webrtc-signal', {
      fromParticipantId: socket.id,
      signal
    });
  });

  // Chat messages
  socket.on('chat-message', async (data) => {
    const { roomId, message, participantId, participantName } = data;
    
    try {
      const room = await MeetingRoom.findByRoomId(roomId);
      if (room && room.settings.allowChat) {
        const chatMessage = {
          id: Date.now().toString(),
          participantId,
          participantName,
          message,
          timestamp: new Date(),
          type: 'text'
        };
        
        room.chatMessages.push(chatMessage);
        await room.save();
        
        io.to(roomId).emit('chat-message', chatMessage);
      }
    } catch (error) {
      console.error('Error sending chat message:', error);
    }
  });

  // Participant updates (audio/video toggle)
  socket.on('participant-update', (data) => {
    const { roomId, participantId, audioEnabled, videoEnabled, screenSharing } = data;
    socket.to(roomId).emit('participant-update', {
      participantId,
      audioEnabled,
      videoEnabled,
      screenSharing
    });
  });

  // Screen sharing
  socket.on('screen-share', (data) => {
    const { roomId, participantId, isSharing } = data;
    socket.to(roomId).emit('screen-share', {
      participantId,
      isSharing
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
  console.log('Socket.io enabled for real-time communication');
});
