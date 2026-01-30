import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Syllabus } from '../models/syllabus.js';
import { analyzeSyllabus, generateUniversityResources, analyzeSyllabusV2 } from '../services/aiService.js';
import { extractTextFromPdf } from '../services/pdfService.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = './uploads/syllabi';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'syllabus-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and text files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Upload and analyze syllabus
router.post('/upload', upload.single('syllabusFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { userId, university, course, semester, year } = req.body;

    if (!userId || !university || !course) {
      return res.status(400).json({ 
        error: 'UserId, university, and course are required' 
      });
    }

    // Extract text from uploaded file
    let extractedText;
    if (req.file.mimetype === 'application/pdf') {
      extractedText = await extractTextFromPdf(req.file.path);
    } else {
      extractedText = fs.readFileSync(req.file.path, 'utf8');
    }

    if (!extractedText || extractedText.trim().length < 50) {
      fs.unlinkSync(req.file.path); // Clean up file
      return res.status(400).json({ 
        error: 'Could not extract sufficient text from file' 
      });
    }

    // Analyze syllabus with AI
    let analysis;
    try {
      console.log('About to analyze syllabus for:', university, course);
      console.log('Extracted text length:', extractedText.length);
      console.log('Sample text:', extractedText.substring(0, 200));
      
      analysis = await analyzeSyllabus(extractedText, university, course);
      console.log('Analysis completed successfully:', JSON.stringify(analysis, null, 2));
    } catch (aiError) {
      console.error('AI Analysis Error Details:', aiError);
      console.error('AI Error Stack:', aiError.stack);
      
      // Use fallback analysis instead of failing completely
      analysis = {
        overview: `${course} course from ${university}`,
        subjects: [
          {
            name: "Course Content",
            topics: ["Content from uploaded syllabus"],
            weightage: "100%",
            description: "Full course content as uploaded"
          }
        ],
        aiAnalysis: {
          overview: `This is a ${course} course from ${university}. Analysis temporarily unavailable.`,
          keyTopics: ["Course fundamentals", "Core concepts"],
          difficulty: "intermediate",
          recommendations: ["Review uploaded syllabus", "Contact instructor for details"],
          estimatedHours: 120
        }
      };
      console.log('Using fallback analysis due to AI error');
    }

    // Deactivate previous syllabi for this user
    await Syllabus.updateMany(
      { userId, isActive: true },
      { isActive: false }
    );

    // Create new syllabus record
    const syllabus = new Syllabus({
      userId,
      university,
      course,
      semester,
      year,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      extractedText,
      subjects: analysis.subjects || [],
      aiAnalysis: analysis.aiAnalysis || {
        overview: 'Analysis pending',
        keyTopics: [],
        difficulty: 'intermediate',
        recommendations: [],
        estimatedHours: 0
      },
      isActive: true
    });

    await syllabus.save();

    res.json({
      success: true,
      syllabusId: syllabus._id,
      analysis: analysis,
      message: 'Syllabus uploaded and analyzed successfully'
    });

  } catch (error) {
    console.error('Error uploading syllabus:', error);
    
    // Clean up uploaded file if error occurs
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Failed to upload and analyze syllabus',
      details: error.message 
    });
  }
});

// Get user's syllabi
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('GET /user/:userId request for userId:', userId);
    
    const syllabi = await Syllabus.find({ userId })
      .sort({ createdAt: -1 })
      .select('-extractedText -filePath'); // Exclude large text content

    console.log('Found syllabi count:', syllabi.length);
    
    res.json(syllabi);
  } catch (error) {
    console.error('Error fetching user syllabi:', error);
    res.status(500).json({ error: 'Failed to fetch syllabi' });
  }
});

// Get active syllabus for user
router.get('/active/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const activeSyllabus = await Syllabus.findOne({ 
      userId, 
      isActive: true 
    });

    if (!activeSyllabus) {
      return res.status(404).json({ error: 'No active syllabus found' });
    }

    res.json(activeSyllabus);
  } catch (error) {
    console.error('Error fetching active syllabus:', error);
    res.status(500).json({ error: 'Failed to fetch active syllabus' });
  }
});

// Set syllabus as active
router.put('/:syllabusId/activate', async (req, res) => {
  try {
    const { syllabusId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'UserId is required' });
    }

    // Deactivate all syllabi for this user
    await Syllabus.updateMany(
      { userId, isActive: true },
      { isActive: false }
    );

    // Activate the selected syllabus
    const syllabus = await Syllabus.findOneAndUpdate(
      { _id: syllabusId, userId },
      { isActive: true },
      { new: true }
    );

    if (!syllabus) {
      return res.status(404).json({ error: 'Syllabus not found' });
    }

    res.json({ 
      success: true, 
      message: 'Syllabus activated successfully',
      syllabus 
    });
  } catch (error) {
    console.error('Error activating syllabus:', error);
    res.status(500).json({ error: 'Failed to activate syllabus' });
  }
});

// Delete syllabus
router.delete('/:syllabusId', async (req, res) => {
  try {
    const { syllabusId } = req.params;
    const { userId } = req.body;

    const syllabus = await Syllabus.findOneAndDelete({ 
      _id: syllabusId, 
      userId 
    });

    if (!syllabus) {
      return res.status(404).json({ error: 'Syllabus not found' });
    }

    // Clean up uploaded file
    if (syllabus.filePath && fs.existsSync(syllabus.filePath)) {
      fs.unlinkSync(syllabus.filePath);
    }

    res.json({ 
      success: true, 
      message: 'Syllabus deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting syllabus:', error);
    res.status(500).json({ error: 'Failed to delete syllabus' });
  }
});

// Get syllabus-based resources
router.post('/resources', async (req, res) => {
  try {
    const { userId, subject, limit = 10 } = req.body;

    if (!userId || !subject) {
      return res.status(400).json({ 
        error: 'UserId and subject are required' 
      });
    }

    // Get active syllabus
    const syllabus = await Syllabus.findOne({ 
      userId, 
      isActive: true 
    });

    if (!syllabus) {
      return res.status(404).json({ 
        error: 'No active syllabus found. Please upload a syllabus first.' 
      });
    }

    // Extract relevant topics from syllabus
    const relevantSubject = syllabus.subjects.find(s => 
      s.name.toLowerCase().includes(subject.toLowerCase())
    );
    
    const syllabusTopics = relevantSubject ? 
      relevantSubject.topics : 
      syllabus.aiAnalysis.keyTopics;

    // Generate university-specific resources
    const resources = await generateUniversityResources(
      subject,
      syllabus.university,
      syllabus.course,
      syllabusTopics
    );

    res.json({
      success: true,
      resources: resources.slice(0, limit),
      syllabusContext: {
        university: syllabus.university,
        course: syllabus.course,
        relevantTopics: syllabusTopics
      }
    });

  } catch (error) {
    console.error('Error generating syllabus-based resources:', error);
    res.status(500).json({ 
      error: 'Failed to generate syllabus-based resources',
      details: error.message 
    });
  }
});

// Get detailed syllabus analysis
router.get('/:syllabusId/analysis', async (req, res) => {
  try {
    const { syllabusId } = req.params;
    
    const syllabus = await Syllabus.findById(syllabusId)
      .select('university course subjects aiAnalysis createdAt');

    if (!syllabus) {
      return res.status(404).json({ error: 'Syllabus not found' });
    }

    res.json({
      university: syllabus.university,
      course: syllabus.course,
      subjects: syllabus.subjects,
      aiAnalysis: syllabus.aiAnalysis,
      analyzedAt: syllabus.createdAt
    });
  } catch (error) {
    console.error('Error fetching syllabus analysis:', error);
    res.status(500).json({ error: 'Failed to fetch syllabus analysis' });
  }
});

export default router;