import express from 'express';
import { generateChatResponse } from '../services/aiService.js';

const router = express.Router();

// AI Chat endpoint
router.post('/', async (req, res) => {
  try {
    const { message, sessionId, userId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('AI Chat request:', { message: message.substring(0, 100) + '...', sessionId, userId });

    // Generate AI response
    const aiResponse = await generateChatResponse(message, {
      sessionId: sessionId || 'default',
      userId: userId || 'anonymous'
    });

    console.log('AI Chat response generated successfully');

    res.json({
      success: true,
      response: aiResponse,
      sessionId: sessionId || 'default'
    });
  } catch (error) {
    console.error('Error in AI chat:', error);
    res.status(500).json({
      error: 'Failed to generate response',
      message: 'I\'m sorry, I\'m having trouble connecting right now. Please try again in a moment!',
      details: error.message
    });
  }
});

export default router;