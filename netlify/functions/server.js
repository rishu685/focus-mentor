import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { aiRateLimiter } from '../../server/services/aiService.js';
import dotenv from 'dotenv';
import curateResourcesRouter from '../../server/routes/curateResources.js';
import generatePlanRouter from '../../server/routes/generatePlan.js';
import pdfChatRouter from '../../server/routes/pdfChat.js';
import syllabusRouter from '../../server/routes/syllabus.js';
import studyBuddyRouter from '../../server/routes/studyBuddy.js';
import aiChatRouter from '../../server/routes/aiChat.js';
import rateLimit from 'express-rate-limit';
import serverless from 'serverless-http';

// Load environment variables
dotenv.config();

const app = express();

// Trust proxy - required for rate limiting behind reverse proxies
app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
  origin: [
    "https://mind-mentor-pearl.vercel.app",
    "https://mind-mentor.kartiklabhshetwar.me", 
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "https://www.mind-mentor.ink",
    "https://mind-mentor.ink",
    // Add your Netlify domain here when deployed
    process.env.NETLIFY_URL,
  ],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use('/api/', limiter);

// Connect to MongoDB
if (!mongoose.connection.readyState) {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mindmentor')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));
}

// Routes
app.use('/api/curate-resources', curateResourcesRouter);
app.use('/api/generate-plan', generatePlanRouter);
app.use('/api/pdf-chat', pdfChatRouter);
app.use('/api/syllabus', syllabusRouter);
app.use('/api/study-buddy', studyBuddyRouter);
app.use('/api/ai-chat', aiChatRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

export const handler = serverless(app);