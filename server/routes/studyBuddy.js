import express from 'express';
import { generateContextAwareResponse } from '../services/aiService.js';
import { Syllabus } from '../models/syllabus.js';

const router = express.Router();

// Context-aware study buddy chat
router.post('/chat', async (req, res) => {
  try {
    const { message, userId, prioritizeSyllabus = false } = req.body;

    if (!message || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Message and userId are required'
      });
    }

    // Get active syllabus for context
    const activeSyllabus = await Syllabus.findOne({
      userId,
      isActive: true
    });

    let syllabusContext = { userId };
    let syllabusUsed = false;

    if (activeSyllabus) {
      syllabusContext = {
        userId,
        university: activeSyllabus.university,
        course: activeSyllabus.course,
        semester: activeSyllabus.semester,
        syllabusContent: activeSyllabus.extractedText?.substring(0, 3000), // More content when prioritizing
        subjects: activeSyllabus.subjects || [],
        aiAnalysis: activeSyllabus.aiAnalysis
      };
      syllabusUsed = true;
    }

    // Enhanced prompt when prioritizing syllabus
    let enhancedMessage = message;
    if (prioritizeSyllabus && syllabusUsed) {
      enhancedMessage = `Based on my ${syllabusContext.university} ${syllabusContext.course} syllabus, ${message}. Please prioritize information that aligns with my curriculum and mention specific topics from my syllabus when relevant.`;
    }

    // Generate context-aware response
    const response = await generateContextAwareResponse(enhancedMessage, syllabusContext);

    res.json({
      success: true,
      response,
      syllabusUsed,
      context: {
        hasUniversityContext: !!syllabusContext.university,
        university: syllabusContext.university,
        course: syllabusContext.course,
        semester: syllabusContext.semester,
        syllabusContent: syllabusUsed ? 'Syllabus content used for personalized response' : 'No syllabus uploaded yet'
      }
    });

  } catch (error) {
    console.error('Error in study buddy chat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate response',
      details: error.message || 'Unknown error'
    });
  }
});

// Get study recommendations based on syllabus
router.post('/recommendations', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    const activeSyllabus = await Syllabus.findOne({
      userId,
      isActive: true
    });

    if (!activeSyllabus) {
      return res.json({
        success: true,
        recommendations: [
          'Upload your university syllabus to get personalized study recommendations',
          'Start with creating a study plan for your upcoming exams',
          'Use the resource curator to find relevant study materials'
        ]
      });
    }

    const contextMessage = `Based on my ${activeSyllabus.university} ${activeSyllabus.course} curriculum, what are the top 5 study recommendations for succeeding in this course?`;

    const response = await generateContextAwareResponse(contextMessage, {
      userId,
      university: activeSyllabus.university,
      course: activeSyllabus.course,
      syllabusContent: activeSyllabus.extractedText?.substring(0, 1000)
    });

    // Extract recommendations from response (simple parsing)
    const recommendations = response
      .split('\n')
      .filter(line => line.trim().match(/^\d+\.|^-|^\*/))
      .map(line => line.replace(/^\d+\.|^-|^\*/, '').trim())
      .filter(rec => rec.length > 10);

    res.json({
      success: true,
      recommendations: recommendations.length > 0 ? recommendations : [response],
      university: activeSyllabus.university,
      course: activeSyllabus.course
    });

  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate recommendations',
      details: error.message
    });
  }
});

export default router;