import express from 'express';
import { generatePlan } from '../services/aiService.js';
import StudyPlan from '../models/studyPlan.js';
import { Syllabus } from '../models/syllabus.js';

const router = express.Router();

// Get plans for a user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    const plans = await StudyPlan.find({ 
      userId, 
      isActive: true 
    }).sort({ createdAt: -1 });
    
    console.log(`Found ${plans.length} active plans for user ${userId}`);
    
    res.json({ 
      success: true, 
      plans 
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch plans' 
    });
  }
});

// Create new plan
router.post('/', async (req, res) => {
  try {
    const { subject, examDate, userId, prioritizeSyllabus } = req.body;

    console.log('Plan generation request:', { subject, examDate, userId, prioritizeSyllabus });

    if (!subject?.trim() || !examDate || !userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'INVALID_INPUT',
        message: 'Subject, examDate and userId are required' 
      });
    }

    // Check for existing plans
    const normalizedSubject = subject.trim().toLowerCase().replace(/\s+/g, ' ');
    const existingPlan = await StudyPlan.findOne({
      userId,
      'overview.subject': { $regex: new RegExp(`^${normalizedSubject}$`, 'i') },
      isActive: true
    });

    if (existingPlan) {
      return res.status(400).json({
        success: false,
        error: 'PLAN_EXISTS',
        message: `You already have an active study plan for ${subject}. Please check your existing plans.`
      });
    }

    // Check for syllabus context if prioritizing syllabus
    let syllabusContext = null;
    if (prioritizeSyllabus !== false) {
      try {
        const activeSyllabus = await Syllabus.findOne({ 
          userId, 
          isActive: true 
        });

        if (activeSyllabus) {
          const relevantSubject = activeSyllabus.subjects.find(s => 
            s.name.toLowerCase().includes(subject.toLowerCase()) ||
            subject.toLowerCase().includes(s.name.toLowerCase())
          );
          
          syllabusContext = {
            university: activeSyllabus.university,
            course: activeSyllabus.course,
            subjects: activeSyllabus.subjects,
            aiAnalysis: activeSyllabus.aiAnalysis,
            relevantSubject
          };
          console.log('Using syllabus context:', syllabusContext.university, syllabusContext.course);
        } else {
          console.log('No active syllabus found, generating general plan');
        }
      } catch (syllabusError) {
        console.error('Error fetching syllabus:', syllabusError);
        // Continue without syllabus context
      }
    }

    // Generate and save plan
    console.log('Generating plan with context:', !!syllabusContext);
    const plan = await generatePlan(subject, userId, examDate, syllabusContext);
    const savedPlan = await plan.save();
    console.log('Plan saved successfully:', savedPlan._id);

    return res.json({ 
      success: true, 
      plan: savedPlan,
      syllabusContext: syllabusContext ? {
        university: syllabusContext.university,
        course: syllabusContext.course,
        relevantTopics: syllabusContext.relevantSubject?.topics || []
      } : null,
      message: syllabusContext ? 
        `Study plan generated for your ${syllabusContext.university} ${syllabusContext.course} curriculum` :
        'Study plan generated successfully'
    });

  } catch (error) {
    console.error('Error in plan generation:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'SERVER_ERROR',
      message: error.message || 'Failed to generate study plan. Please try again.'
    });
  }
});

// Delete a plan
router.delete('/:planId', async (req, res) => {
  try {
    const { planId } = req.params;
    
    if (!planId) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_INPUT',
        message: 'Plan ID is required'
      });
    }

    // Hard delete the plan instead of soft delete to ensure it's completely gone
    console.log('Hard deleting plan:', planId);
    const deletedPlan = await StudyPlan.findByIdAndDelete(planId);
    
    console.log('Plan deletion result:', deletedPlan ? 'Successfully deleted' : 'Plan not found');
    
    if (!deletedPlan) {
      return res.status(404).json({
        success: false,
        error: 'PLAN_NOT_FOUND',
        message: 'Study plan not found'
      });
    }

    return res.json({
      success: true,
      message: 'Study plan deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting plan:', error);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to delete plan'
    });
  }
});

// Syllabus-aware study plan generation
router.post('/generate', async (req, res) => {
  try {
    const { subject, duration, goals = [], userId, prioritizeSyllabus = false } = req.body;

    if (!subject?.trim() || !duration || !userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Subject, duration, and userId are required' 
      });
    }

    // Get active syllabus for context
    let syllabusContext = null;
    const activeSyllabus = await Syllabus.findOne({
      userId,
      isActive: true
    });

    if (activeSyllabus) {
      syllabusContext = {
        university: activeSyllabus.university,
        course: activeSyllabus.course,
        semester: activeSyllabus.semester,
        subjects: activeSyllabus.subjects || [],
        syllabusContent: activeSyllabus.extractedText,
        aiAnalysis: activeSyllabus.aiAnalysis
      };
    }

    // Enhanced prompt when prioritizing syllabus
    let enhancedSubject = subject.trim();
    let enhancedGoals = goals;

    if (prioritizeSyllabus && syllabusContext) {
      enhancedSubject = `${subject} according to ${syllabusContext.university} ${syllabusContext.course} curriculum`;
      enhancedGoals = [
        ...goals,
        `Follow the ${syllabusContext.university} curriculum structure`,
        'Prioritize topics mentioned in the uploaded syllabus',
        'Align with course objectives and learning outcomes'
      ];
    }

    // Generate plan with syllabus context
    const studyPlan = await generatePlan(enhancedSubject, duration, enhancedGoals, syllabusContext);

    // Save the plan with syllabus reference
    const newPlan = new StudyPlan({
      userId,
      subject: enhancedSubject,
      examDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000), // duration in days
      plan: studyPlan,
      syllabusId: activeSyllabus ? activeSyllabus._id : null,
      syllabusContext: syllabusContext ? {
        university: syllabusContext.university,
        course: syllabusContext.course,
        semester: syllabusContext.semester
      } : null,
      isActive: true
    });

    const savedPlan = await newPlan.save();

    res.json({
      success: true,
      studyPlan: savedPlan,
      syllabusContext: syllabusContext ? {
        university: syllabusContext.university,
        course: syllabusContext.course,
        used: true
      } : { used: false },
      message: syllabusContext ? 
        `Study plan generated specifically for your ${syllabusContext.university} ${syllabusContext.course} curriculum` :
        'Study plan generated successfully (upload syllabus for personalized curriculum alignment)'
    });

  } catch (error) {
    console.error('Error in syllabus-aware plan generation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate study plan',
      details: error.message
    });
  }
});

export default router;