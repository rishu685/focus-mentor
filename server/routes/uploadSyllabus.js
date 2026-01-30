const express = require('express');
const multer = require('multer');
const router = express.Router();
const aiService = require('../services/aiService');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Upload and analyze syllabus
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { university, course, semester, year, userId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Syllabus upload request:', { 
      university, 
      course, 
      semester, 
      year, 
      fileName: file.originalname,
      fileSize: file.size 
    });

    // Analyze syllabus with AI
    const analysis = await aiService.analyzeSyllabus(file.path, {
      university,
      course,
      semester,
      year,
      userId
    });

    console.log('Syllabus analysis completed successfully');

    res.json({
      success: true,
      analysis,
      message: 'Syllabus uploaded and analyzed successfully',
      syllabusId: analysis.id || Date.now().toString()
    });
  } catch (error) {
    console.error('Error uploading/analyzing syllabus:', error);
    res.status(500).json({
      error: 'Failed to process syllabus',
      message: 'There was an error processing your syllabus. Please try again.',
      details: error.message
    });
  }
});

module.exports = router;