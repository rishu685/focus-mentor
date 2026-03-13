import express from 'express';
import mongoose from 'mongoose';
import { searchTavily, curateResources, generateUniversityResources, curateStudyResources } from '../services/aiService.js';
import CuratedResource from '../models/curatedResource.js';
import { Syllabus } from '../models/syllabus.js';

const router = express.Router();

// Generate subject-specific resources with real, working URLs
function generateSubjectResources(subject) {
  const lowerSubject = subject.toLowerCase();
  let resources = [];

  // Add subject-specific real resources
  const subjectResources = {
    javascript: [
      {
        title: 'JavaScript Full Course - FreeCodeCamp',
        url: 'https://www.youtube.com/watch?v=PkZNo7MFNFg',
        description: 'Complete JavaScript tutorial covering fundamentals, DOM manipulation, and modern ES6+ features. Perfect for beginners to advanced learners.',
        format: 'Video Course',
        benefits: ['8+ hours comprehensive', 'Real-world projects', 'Modern best practices']
      },
      {
        title: 'JavaScript - MDN Web Docs',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
        description: 'Comprehensive JavaScript documentation with examples, guides, and reference materials from Mozilla Developer Network.',
        format: 'Documentation',
        benefits: ['Official reference', 'Detailed examples', 'Best practices']
      },
      {
        title: 'JavaScript Algorithms - FreeCodeCamp',
        url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/',
        description: 'Interactive JavaScript and data structures course with hands-on coding challenges and certification.',
        format: 'Interactive Course',
        benefits: ['Hands-on practice', 'Certification', 'Job-ready skills']
      }
    ],
    python: [
      {
        title: 'Python for Beginners - Programming with Mosh',
        url: 'https://www.youtube.com/watch?v=_uQrJ0TkZlc',
        description: 'Learn Python programming from scratch with hands-on examples and practical applications.',
        format: 'Video Course',
        benefits: ['Beginner-friendly', 'Practical examples', 'Fast-paced learning']
      },
      {
        title: 'Python Full Course - FreeCodeCamp',
        url: 'https://www.youtube.com/watch?v=rfscVS0vtbw',
        description: 'Comprehensive Python tutorial covering basics to advanced topics including OOP, file handling, and libraries.',
        format: 'Video Course',
        benefits: ['Complete coverage', 'All Python basics', 'Advanced concepts']
      },
      {
        title: 'Python Official Documentation',
        url: 'https://docs.python.org/3/',
        description: 'Official Python documentation with tutorials, reference guides, and API documentation.',
        format: 'Documentation',
        benefits: ['Official reference', 'Complete guide', 'Examples']
      }
    ],
    react: [
      {
        title: 'React Course for Beginners - FreeCodeCamp',
        url: 'https://www.youtube.com/watch?v=bMknfKXIFA8',
        description: 'Complete React.js course covering components, hooks, state management, and building real applications.',
        format: 'Video Course',
        benefits: ['Comprehensive', 'Hands-on projects', 'Modern React patterns']
      },
      {
        title: 'React Official Documentation',
        url: 'https://react.dev/',
        description: 'Official React documentation with interactive examples, hooks guide, and best practices.',
        format: 'Documentation',
        benefits: ['Official source', 'Interactive tutorials', 'Latest practices']
      },
      {
        title: 'React Router Tutorial',
        url: 'https://www.youtube.com/watch?v=ZqFa2xzccqE',
        description: 'Learn client-side routing in React using React Router for building multi-page applications.',
        format: 'Video Tutorial',
        benefits: ['Routing mastery', 'SPA concepts', 'Practical apps']
      }
    ],
    'data structures': [
      {
        title: 'Data Structures - Abdul Bari',
        url: 'https://www.youtube.com/playlist?list=PLDN4rrl48XKpZkp46eTJx8aZAJ_DwJ0PC',
        description: 'Complete data structures course covering arrays, linked lists, trees, graphs, and algorithms.',
        format: 'Video Playlist',
        benefits: ['Animated visuals', 'Complete coverage', 'Interview prep']
      },
      {
        title: 'Data Structures & Algorithms - FreeCodeCamp',
        url: 'https://www.freecodecamp.org/learn/scientific-computing-with-python/data-structures/',
        description: 'Interactive course on data structures and algorithms with hands-on coding exercises.',
        format: 'Interactive Course',
        benefits: ['Hands-on practice', 'Real problems', 'Certification']
      },
      {
        title: 'LeetCode - Coding Problems',
        url: 'https://leetcode.com/problemset/all/',
        description: 'Platform with thousands of coding problems to practice data structures and algorithms.',
        format: 'Practice Platform',
        benefits: ['Real interview questions', 'Practice solutions', 'Community']
      }
    ],
    'web development': [
      {
        title: 'Web Development Full Course - FreeCodeCamp',
        url: 'https://www.youtube.com/watch?v=nu_pCVPKzTk',
        description: 'Complete web development course covering HTML, CSS, JavaScript, and full-stack concepts.',
        format: 'Video Course',
        benefits: ['Full-stack overview', 'Modern tools', 'Real projects']
      },
      {
        title: 'MDN Web Docs - Web Development',
        url: 'https://developer.mozilla.org/en-US/docs/Learn',
        description: 'Mozilla\'s comprehensive web development learning guide with tutorials and references.',
        format: 'Tutorial Series',
        benefits: ['Official tutorial', 'Structured learning', 'Best practices']
      },
      {
        title: 'CSS Tricks - Daily Articles',
        url: 'https://css-tricks.com/',
        description: 'Daily articles, tutorials, and guides about CSS, web design, and front-end development.',
        format: 'Blog/Tutorials',
        benefits: ['Daily learning', 'Advanced CSS', 'Design tips']
      }
    ]
  };

  // Find matching resources for the subject
  for (const [key, resourceList] of Object.entries(subjectResources)) {
    if (lowerSubject.includes(key) || key.includes(lowerSubject)) {
      resources.push(...resourceList);
      break;
    }
  }

  // If no specific match, add general learning resources
  if (resources.length === 0) {
    resources = [
      {
        title: `${subject} - Khan Academy`,
        url: `https://www.khanacademy.org/search?page_search_query=${encodeURIComponent(subject)}`,
        description: `Master ${subject} with Khan Academy's free, world-class education featuring interactive exercises and videos.`,
        format: 'Interactive Course',
        benefits: ['Free education', 'Interactive practice', 'Progress tracking']
      },
      {
        title: `${subject} Tutorials - YouTube`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(subject + ' tutorial')}`,
        description: `Find comprehensive video tutorials about ${subject} from educational YouTube channels.`,
        format: 'Video Tutorials',
        benefits: ['Video learning', 'Multiple sources', 'Free access']
      },
      {
        title: `${subject} Courses - Coursera`,
        url: `https://www.coursera.org/search?query=${encodeURIComponent(subject)}`,
        description: `University-level ${subject} courses on Coursera with certificates and guided learning paths.`,
        format: 'Online Course',
        benefits: ['University courses', 'Certificates', 'Expert instruction']
      }
    ];
  }

  return {
    resources: resources.slice(0, 8) // Return top 8 resources
  };
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

    let syllabusContext = null;
    let curatedData;

    // Try to generate resources with multiple fallback layers
    try {
      if (activeSyllabus) {
        console.log('Generating resources using syllabus context...');
        
        // Find relevant topics from syllabus
        const relevantSubject = activeSyllabus.subjects.find(s => 
          s.name.toLowerCase().includes(subject.toLowerCase())
        );
        
        const syllabusTopics = relevantSubject ? 
          relevantSubject.topics : 
          activeSyllabus.aiAnalysis?.keyTopics || [];

        // Properly construct syllabusContext object
        const contextObject = {
          university: activeSyllabus.university || 'University',
          course: activeSyllabus.course || 'Course',
          semester: activeSyllabus.semester || '1',
          subjects: syllabusTopics || [],
          syllabusContent: activeSyllabus.aiAnalysis?.summary || ''
        };

        try {
          curatedData = await generateUniversityResources(subject, contextObject);
          
          syllabusContext = {
            university: activeSyllabus.university,
            course: activeSyllabus.course,
            relevantTopics: syllabusTopics
          };
          console.log('Syllabus-based generation complete, resources:', curatedData?.resources?.length || 0);
        } catch (genError) {
          console.warn('Syllabus-based generation failed:', genError.message);
          console.log('Falling back to subject-specific resources');
          curatedData = generateSubjectResources(subject);
        }
      } else {
        console.log('Generating resources without syllabus context...');
        curatedData = generateSubjectResources(subject);
      }
    } catch (searchError) {
      console.error('Search/generation error:', searchError.message);
      console.log('All search methods failed, using subject fallback');
      curatedData = generateSubjectResources(subject);
    }

    // Ensure we have curated data
    if (!curatedData || !curatedData.resources || curatedData.resources.length === 0) {
      console.log('No resources available, generating minimal fallback...');
      curatedData = generateSubjectResources(subject);
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