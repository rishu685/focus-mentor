import express from 'express';
import mongoose from 'mongoose';
import { searchTavily, curateResources, generateUniversityResources, curateStudyResources } from '../services/aiService.js';
import CuratedResource from '../models/curatedResource.js';
import { Syllabus } from '../models/syllabus.js';

const router = express.Router();

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

    // Test basic database connectivity first
    console.log('Backend: Testing database connection...');
    const connectionState = mongoose.connection.readyState;
    console.log('Backend: MongoDB connection state:', connectionState);
    
    if (connectionState !== 1) {
      return res.status(500).json({
        success: false,
        error: 'Database not connected',
        connectionState
      });
    }

    console.log('Backend: Performing database query...');
    const resources = await CuratedResource.find({ userId })
      .sort({ createdAt: -1 })
      .lean(); // Use lean() for better performance
    
    console.log('Backend: Database query completed');
    console.log('Backend: Found resources count:', resources.length);
    
    if (resources.length > 0) {
      console.log('Backend: Sample resource:', {
        id: resources[0]._id,
        topic: resources[0].topic,
        userId: resources[0].userId,
        resourceCount: resources[0].resources?.length || 0
      });
    }
    
    console.log('Backend: Sending response...');
    return res.json({ 
      success: true, 
      resources,
      count: resources.length
    });
    
  } catch (error) {
    console.error('Backend: Error fetching resources:', error);
    console.error('Backend: Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500) // Truncate stack for readability
    });
    
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch resources',
      details: error.message,
      errorName: error.name
    });
  }
});

// Create new resources
router.post('/', async (req, res) => {
  try {
    console.log('Resource curation POST - Request body:', Object.keys(req.body));
    
    const { subject, userId, difficulty, type } = req.body;
    console.log('Extracted fields:', { subject: !!subject, userId: !!userId, difficulty, type });

    if (!subject?.trim() || !userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'INVALID_INPUT',
        message: 'Subject and userId are required' 
      });
    }

    // Normalize the subject string
    const normalizedSubject = subject.trim().toLowerCase().replace(/\s+/g, ' ');
    console.log('Normalized subject:', normalizedSubject);

    // Check for existing resources with case-insensitive matching
    const existingResources = await CuratedResource.findOne({
      userId,
      topic: { $regex: new RegExp(`^${normalizedSubject}$`, 'i') }
    });

    if (existingResources) {
      console.log('Returning existing resources for subject:', normalizedSubject);
      return res.json({
        success: true,
        resource: existingResources,
        message: `Returning existing resources for "${subject}".`,
        syllabusContext: existingResources.syllabusContext || { used: false },
        isExisting: true
      });
    }

    // Check if user has active syllabus for context-aware resource generation
    console.log('Looking for active syllabus for userId:', userId);
    const activeSyllabus = await Syllabus.findOne({ 
      userId, 
      isActive: true 
    });
    console.log('Active syllabus found:', !!activeSyllabus);

    let searchData;
    let syllabusContext = null;
    let curatedData;

    // Try to search/generate resources, with multiple fallback layers
    try {
      if (activeSyllabus) {
        console.log('Generating resources using syllabus context...');
        // Use syllabus-aware resource generation
        const relevantSubject = activeSyllabus.subjects.find(s => 
          s.name.toLowerCase().includes(subject.toLowerCase())
        );
        
        const syllabusTopics = relevantSubject ? 
          relevantSubject.topics : 
          activeSyllabus.aiAnalysis.keyTopics;

        try {
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
          console.log('Syllabus-based generation complete');
        } catch (genError) {
          console.warn('Syllabus-based generation failed, trying regular search:', genError.message);
          searchData = await searchTavily(subject);
        }
      } else {
        console.log('Generating resources without syllabus context...');
        // Fallback to regular search
        searchData = await searchTavily(subject);
        console.log('Tavily search complete');
      }

      // Curate the search results
      if (searchData && searchData.results && searchData.results.length > 0) {
        try {
          console.log('Curating resources from search data...');
          curatedData = await curateResources(searchData, subject);
          console.log('Curation complete, resources count:', curatedData?.resources?.length || 0);
        } catch (curationError) {
          console.error('Curation error:', curationError.message);
          console.log('Curation failed, using mock fallback resources');
          curatedData = null; // Will trigger mock generation below
        }
      } else {
        console.log('Search returned no results, using mock fallback');
        curatedData = null; // Will trigger mock generation below
      }
    } catch (searchError) {
      console.error('Search/generation error:', searchError.message);
      console.log('All search methods failed, using complete fallback');
      curatedData = null; // Will trigger mock generation below
    }

    // Generate mock/fallback resources if any step failed
    if (!curatedData || !curatedData.resources || curatedData.resources.length === 0) {
      console.log('Generating fallback mock resources...');
      curatedData = {
        resources: [
          {
            title: `Introduction to ${subject}`,
            url: 'https://www.google.com/search?q=' + encodeURIComponent(subject),
            description: 'Start with a Google search to find basic resources about ' + subject,
            format: 'search',
            benefits: ['General overview', 'Multiple perspectives']
          },
          {
            title: `${subject} on Wikipedia`,
            url: 'https://en.wikipedia.org/wiki/Special:Search?search=' + encodeURIComponent(subject),
            description: 'Comprehensive encyclopedia article on ' + subject,
            format: 'encyclopedia',
            benefits: ['Detailed information', 'Well-sourced']
          },
          {
            title: `Learn ${subject}`,
            url: 'https://www.coursera.org/search?query=' + encodeURIComponent(subject),
            description: 'Find courses about ' + subject + ' on Coursera',
            format: 'course',
            benefits: ['Structured learning', 'Professional instruction']
          }
        ]
      };
    }
    // Validate and transform resources to match schema
    const validatedResources = curatedData.resources.map(resource => ({
      title: resource.title || 'Untitled Resource',
      link: resource.url || '#', // Map url to link
      type: resource.format || 'website',
      description: resource.description || 'No description available',
      benefits: resource.benefits || ['Resource for learning ' + subject]
    }));

    // Create new resource document with syllabus context
    console.log('Creating CuratedResource with', validatedResources.length, 'resources');
    const newResource = new CuratedResource({
      userId,
      topic: normalizedSubject,
      resources: validatedResources,
      lastUpdated: new Date(),
      syllabusContext
    });

    let savedResource;
    try {
      savedResource = await newResource.save();
      console.log('Resource saved successfully');
    } catch (saveError) {
      console.error('Database save error:', saveError);
      console.log('Returning resources without database persistence');
      return res.json({
        success: true,
        message: 'Resources generated but could not be saved',
        resource: { resources: validatedResources, topic: normalizedSubject },
        syllabusContext,
        cached: true
      });
    }

    return res.json({
      success: true,
      message: syllabusContext ? 
        `Resources curated successfully for ${syllabusContext.university} ${syllabusContext.course} curriculum` :
        'Resources curated successfully',
      resource: savedResource,
      syllabusContext
    });

  } catch (error) {
    console.error('Error in resource curation:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message
    });
    
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Could not generate resources at this time. Please try again in a moment.'
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