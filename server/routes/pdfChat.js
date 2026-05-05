import express from 'express';
import multer from 'multer';
import PdfDocument from '../models/pdfDocument.js';
import { processPdf } from '../services/pdfService.js';
import { chatWithPdf } from '../services/pdfService.js';
import { bufferToBase64, base64ToBuffer } from '../services/storageService.js';
import transformersEmbeddings from '../services/transformersEmbeddings.js';

const router = express.Router();

// Configure multer for disk storage (memory efficient)
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(path.dirname(__dirname), 'uploads', 'pdfs');

// Ensure upload directory exists
import { mkdir } from 'fs/promises';
await mkdir(uploadDir, { recursive: true }).catch(() => {});

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Generate unique filename
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      cb(null, `${timestamp}-${random}.pdf`);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // Reduce from 10MB to 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Health check endpoint for Transformers.js embeddings
router.get('/health', async (req, res) => {
  try {
    const health = await transformersEmbeddings.healthCheck();
    const serviceInfo = await transformersEmbeddings.getServiceInfo();
    
    res.json({
      status: health.status === 'healthy' ? 'healthy' : 'unhealthy',
      embeddings: {
        health: health,
        info: serviceInfo
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get all PDFs for a user
router.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }

    const pdfs = await PdfDocument.find({ userId })
      .select('title pageCount createdAt')
      .sort({ createdAt: -1 });

    res.json({ pdfs });
  } catch (error) {
    console.error('Error fetching PDFs:', error);
    res.status(500).json({ error: 'Failed to fetch PDFs' });
  }
});

// Get a specific PDF
router.get('/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }

    const pdf = await PdfDocument.findOne({ 
      _id: req.params.id,
      userId: userId 
    });

    if (!pdf) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (!pdf.pdfData) {
      return res.status(500).json({ error: 'PDF data is missing' });
    }

    // Add validation for base64 data
    if (!pdf.pdfData.startsWith('data:application/pdf;base64,')) {
      return res.status(500).json({ error: 'Invalid PDF data format' });
    }

    // Return the full PDF data
    res.json({ 
      data: pdf.pdfData,
      title: pdf.title,
      pageCount: pdf.pageCount
    });
  } catch (error) {
    console.error('Error fetching PDF:', error);
    res.status(500).json({ error: 'Failed to fetch PDF' });
  }
});

// Upload and process PDF
router.post('/upload', upload.single('pdf'), async (req, res) => {
  let tempFilePath = null;
  try {
    console.log('Upload request received');

    if (!req.file) {
      console.error('No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    tempFilePath = req.file.path;
    const userId = req.headers['x-user-id'];
    if (!userId) {
      console.error('No user ID in request');
      return res.status(400).json({ error: 'User ID is required' });
    }

    try {
      // Read PDF from disk
      const pdfBuffer = await fs.readFile(tempFilePath);
      
      console.log(`Processing PDF: ${req.file.originalname} (${pdfBuffer.length} bytes)`);

      // Process PDF using the service
      const { documentChunks, pageCount } = await processPdf(pdfBuffer);

      // Store only essential PDF data - store a truncated version for display
      // Full PDF processing happens when needed
      const pdfData = bufferToBase64(pdfBuffer.slice(0, 1024 * 100)); // Store only first 100KB for preview

      // Create new PDF document in database
      const pdfDoc = new PdfDocument({
        userId,
        title: req.file.originalname,
        pdfData,
        pageCount,
        documentChunks,
        chatHistory: [],
        fileSize: pdfBuffer.length
      });

      await pdfDoc.save();

      console.log(`✅ PDF saved: ${pdfDoc._id}`);

      res.json({
        _id: pdfDoc._id,
        title: pdfDoc.title,
        pageCount: pdfDoc.pageCount,
        createdAt: pdfDoc.createdAt
      });
    } catch (processingError) {
      console.error('Error processing PDF:', processingError);
      res.status(500).json({ 
        error: 'Error processing PDF file',
        details: processingError.message 
      });
    }
  } catch (error) {
    console.error('Error in upload route:', error);
    res.status(500).json({ 
      error: 'Server error during upload',
      details: error.message 
    });
  } finally {
    // Clean up temporary file
    if (tempFilePath) {
      fs.unlink(tempFilePath).catch(err => 
        console.warn('Failed to delete temp file:', err.message)
      );
    }
  }
});

// Delete PDF
router.delete('/:documentId', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }

    const doc = await PdfDocument.findOneAndDelete({
      _id: req.params.documentId,
      userId: userId
    });

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting PDF:', error);
    res.status(500).json({ error: 'Error deleting PDF' });
  }
});

// Chat with PDF
router.post('/:id/chat', async (req, res) => {
  try {
    console.log('=== PDF CHAT REQUEST ===');
    console.log('Document ID:', req.params.id);
    
    const userId = req.headers['x-user-id'];
    if (!userId) {
      console.warn('Missing user ID in request');
      return res.status(401).json({ error: 'User ID is required' });
    }

    console.log('User ID:', userId);

    if (!req.body?.content || typeof req.body.content !== 'string' || !req.body.content.trim()) {
      console.warn('Invalid content in request body');
      return res.status(400).json({ error: 'Question content is required' });
    }

    console.log('Content length:', req.body.content.length);

    const pdf = await PdfDocument.findOne({ 
      _id: req.params.id,
      userId: userId 
    });

    if (!pdf) {
      console.warn('PDF not found for user:', userId, 'document:', req.params.id);
      return res.status(404).json({ error: 'PDF not found' });
    }

    console.log('PDF found, starting chat processing...');

    // Process the chat message using the PDF content
    const pdfBuffer = base64ToBuffer(pdf.pdfData);
    console.log('PDF buffer created, size:', pdfBuffer.length);

    const { answer, sourcePages, sources } = await chatWithPdf(
      pdfBuffer,
      req.body.content,
      pdf.chatHistory
    );

    console.log('Chat response generated, adding to history...');

    // Add messages to chat history
    pdf.chatHistory.push({
      role: 'user',
      content: req.body.content,
      timestamp: new Date()
    });

    pdf.chatHistory.push({
      role: 'assistant',
      content: answer,
      sourcePages: sourcePages,
      sources: sources,
      timestamp: new Date()
    });

    await pdf.save();

    console.log('✅ Chat saved successfully');

    res.json({ 
      message: answer,
      sourcePages: sourcePages,
      sources: sources,
      chatHistory: pdf.chatHistory
    });
  } catch (error) {
    console.error('=== ERROR IN PDF CHAT ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      error: error.message || 'Failed to process chat request',
      details: process.env.NODE_ENV === 'production' ? undefined : error.stack
    });
  }
});

// Get chat history
router.get('/:documentId/history', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }

    const doc = await PdfDocument.findOne({
      _id: req.params.documentId,
      userId: userId
    });
    
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json(doc.chatHistory || []);
  } catch (error) {
    console.error('Error retrieving chat history:', error);
    res.status(500).json({ error: 'Error retrieving chat history' });
  }
});

export default router; 