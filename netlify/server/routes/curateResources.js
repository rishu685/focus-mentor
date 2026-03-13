import express from 'express';
import { searchTavily, curateResources, generateUniversityResources, curateStudyResources } from '../services/aiService.js';
import CuratedResource from '../models/curatedResource.js';
import { Syllabus } from '../models/syllabus.js';

const router = express.Router();

function normalizeExternalUrl(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue || trimmedValue === '#' || /^(?:javascript|data|vbscript):/i.test(trimmedValue)) {
    return null;
  }

  const candidate = /^[a-z][a-z\d+.-]*:/i.test(trimmedValue)
    ? trimmedValue
    : /^[a-z0-9.-]+\.[a-z]{2,}(?:[/:?#]|$)/i.test(trimmedValue)
      ? `https://${trimmedValue}`
      : trimmedValue;

  try {
    const parsedUrl = new URL(candidate);
    return ['http:', 'https:'].includes(parsedUrl.protocol) ? parsedUrl.toString() : null;
  } catch {
    return null;
  }
}

// Get resources for a user
router.get('/:userId', async (req, res) => { 
  try {
    const { userId } = req.params;
    console.log('Backend: GET request for userId:', userId);
    
    if (!userId) {
      console.log('Backend: No userId provided');
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    const resources = await CuratedResource.find({ userId })
      .sort({ createdAt: -1 });
    
    console.log('Backend: Database query for userId:', userId);
    console.log('Backend: MongoDB connection state:', require('mongoose').connection.readyState);
    console.log('Backend: Found resources count:', resources.length);
    if (resources.length > 0) {
      console.log('Backend: Resources sample:', resources.map(r => ({ 
        id: r._id, 
        topic: r.topic, 
        resourceCount: r.resources?.length || 0,
        userId: r.userId 
      })));
    }
    
    res.json({ 
      success: true, 
      resources 
    });
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch resources' 
    });
  }
});

// Create new resources
router.post('/', async (req, res) => {
  try {
    const { subject, userId } = req.body;

    if (!subject?.trim() || !userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'INVALID_INPUT',
        message: 'Subject and userId are required' 
      });
    }

    // Normalize the subject string
    const normalizedSubject = subject.trim().toLowerCase().replace(/\s+/g, ' ');

    // Check for existing resources with case-insensitive matching
    const existingResources = await CuratedResource.findOne({
      userId,
      topic: { $regex: new RegExp(`^${normalizedSubject}$`, 'i') }
    });

    if (existingResources) {
      return res.json({
        success: true,
        resource: existingResources, // Return the full resource object
        message: `Returning existing resources for "${subject}".`,
        syllabusContext: existingResources.syllabusContext || { used: false },
        isExisting: true
      });
    }

    // Check if user has active syllabus for context-aware resource generation
    const activeSyllabus = await Syllabus.findOne({ 
      userId, 
      isActive: true 
    });

    let searchData;
    let syllabusContext = null;

    if (activeSyllabus) {
      // Use syllabus-aware resource generation
      const relevantSubject = activeSyllabus.subjects.find(s => 
        s.name.toLowerCase().includes(subject.toLowerCase())
      );
      
      const syllabusTopics = relevantSubject ? 
        relevantSubject.topics : 
        activeSyllabus.aiAnalysis.keyTopics;

      searchData = await generateUniversityResources(
        subject,
        activeSyllabus.university,
        activeSyllabus.course,
        syllabusTopics
      );

      syllabusContext = {
        university: activeSyllabus.university,
        course: activeSyllabus.course,
        relevantTopics: syllabusTopics
      };
    } else {
      // Fallback to regular search
      searchData = await searchTavily(subject);
    }
    
    if (!searchData || !searchData.results) {
      return res.status(500).json({
        success: false,
        error: 'SEARCH_FAILED',
        message: 'Failed to search for resources. Please try again.'
      });
    }

    const curatedData = await curateResources(searchData, subject);
    
    if (!curatedData || !curatedData.resources) {
      return res.status(500).json({
        success: false,
        error: 'CURATION_FAILED',
        message: 'Failed to curate resources. Please try again.'
      });
    }

    // Validate and transform resources to match schema
    const validatedResources = curatedData.resources
      .map(resource => ({
        title: resource.title || 'Untitled Resource',
        link: normalizeExternalUrl(resource.url || resource.link),
        type: resource.format || resource.type || 'website',
        description: resource.description || 'No description available',
        benefits: resource.benefits || ['Resource for learning ' + subject]
      }))
      .filter(resource => Boolean(resource.link));

    if (validatedResources.length === 0) {
      return res.status(502).json({
        success: false,
        error: 'INVALID_RESOURCE_LINKS',
        message: 'No valid resource links were generated. Please try again.'
      });
    }

    // Create new resource document with syllabus context
    const newResource = new CuratedResource({
      userId,
      topic: normalizedSubject, // Use topic instead of subject
      resources: validatedResources,
      lastUpdated: new Date(),
      syllabusContext // Add syllabus context if available
    });

    const savedResource = await newResource.save();

    return res.json({
      success: true,
      message: syllabusContext ? 
        `Resources curated successfully for ${syllabusContext.university} ${syllabusContext.course} curriculum` :
        'Resources curated successfully',
      resource: savedResource, // Return the single created resource
      syllabusContext
    });

  } catch (error) {
    console.error('Error in resource curation:', error);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: error.message || 'An error occurred while curating resources. Please try again.'
    });
  }
});

// Delete a resource
router.delete('/:resourceId', async (req, res) => {
  try {
    const { resourceId } = req.params;
    
    if (!resourceId) {
      return res.status(400).json({
        success: false,
        error: 'resourceId is required'
      });
    }

    // Find and delete the resource
    const deletedResource = await CuratedResource.findByIdAndDelete(resourceId);
    
    if (!deletedResource) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found'
      });
    }

    res.json({
      success: true,
      message: 'Resource deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete resource'
    });
  }
});

// Syllabus-prioritized resource curation
router.post('/curate', async (req, res) => {
  try {
    const { subject, userId, difficulty = 'intermediate', type = 'mixed', prioritizeSyllabus = false } = req.body;

    if (!subject?.trim() || !userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Subject and userId are required' 
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
        syllabusContent: activeSyllabus.extractedText
      };
    }

    // Enhanced subject query when prioritizing syllabus
    let enhancedSubject = subject.trim();
    if (prioritizeSyllabus && syllabusContext) {
      enhancedSubject = `${subject} for ${syllabusContext.university} ${syllabusContext.course} curriculum`;
    }

    // Use university-specific resource generation if syllabus is available
    let resources;
    if (syllabusContext && prioritizeSyllabus) {
      resources = await generateUniversityResources(enhancedSubject, syllabusContext, {
        difficulty,
        type,
        count: 8
      });
    } else {
      // Fallback to regular resource curation
      const searchData = await searchTavily(enhancedSubject, 10);
      resources = await curateResources(searchData, enhancedSubject);
    }

    res.json({
      success: true,
      resources: resources.resources || resources,
      syllabusContext: syllabusContext ? {
        university: syllabusContext.university,
        course: syllabusContext.course,
        used: true
      } : { used: false },
      message: syllabusContext ? 
        `Resources curated specifically for your ${syllabusContext.university} ${syllabusContext.course} curriculum` :
        'Resources curated successfully (upload syllabus for personalized results)'
    });

  } catch (error) {
    console.error('Error in syllabus-aware resource curation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to curate resources',
      details: error.message
    });
  }
});

export default router;