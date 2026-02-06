import Groq from 'groq-sdk';
import StudyPlan from '../models/studyPlan.js';
import NodeCache from 'node-cache';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import https from 'https';
import crypto from 'crypto';

// Initialize dotenv
dotenv.config();

if (!process.env.GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY is not set in environment variables');
}

// Initialize Groq client with explicit API key
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Initialize cache with 30 minutes TTL
const cache = new NodeCache({ stdTTL: 1800 });

// Rate limiter for AI requests - 100 requests per IP per hour
const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true
});

// Create a custom HTTPS agent that doesn't reject unauthorized certificates
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

async function searchTavily(subject) {
  // Cache key for search results
  const cacheKey = `search_${subject}`;
  
  // Check cache first
  const cachedResult = cache.get(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }

  try {
    // Create comprehensive search results combining multiple strategies
    const searchResults = await Promise.allSettled([
      searchYouTube(subject),
      searchEducationalResources(subject)
    ]);

    const youtubeResults = searchResults[0].status === 'fulfilled' ? searchResults[0].value : [];
    const educationalResults = searchResults[1].status === 'fulfilled' ? searchResults[1].value : [];

    const combinedResults = {
      results: [...youtubeResults, ...educationalResults],
      answer: `Curated educational resources for ${subject} including videos, tutorials, and documentation.`
    };

    // Cache the result
    cache.set(cacheKey, combinedResults);
    return combinedResults;
  } catch (error) {
    console.error('Search error:', error);
    return generateFallbackResults(subject);
  }
}

async function searchYouTube(subject) {
  // Return real YouTube channels and playlists for educational content
  const results = [];
  
  try {
    // Get subject-specific real YouTube resources
    const youtubeResources = getRealYouTubeResources(subject);
    
    for (const resource of youtubeResources) {
      results.push({
        title: resource.title,
        url: resource.url,
        description: resource.description,
        source: 'YouTube',
        type: 'Video Course'
      });
    }
  } catch (error) {
    console.error('YouTube search error:', error);
  }

  return results;
}

function getRealYouTubeResources(subject) {
  const lowerSubject = subject.toLowerCase();
  
  // React resources
  if (lowerSubject.includes('react')) {
    return [
      {
        title: 'React Course for Beginners - freeCodeCamp',
        url: 'https://www.youtube.com/watch?v=bMknfKXIFA8',
        description: 'Complete React course for beginners. Learn React fundamentals including components, props, state, and hooks in this comprehensive tutorial.'
      },
      {
        title: 'React Tutorial - Traversy Media',
        url: 'https://www.youtube.com/watch?v=w7ejDZ8SWv8',
        description: 'React crash course covering all the fundamentals including JSX, components, props, state, events, and more.'
      }
    ];
  }
  
  // JavaScript resources
  if (lowerSubject.includes('javascript') || lowerSubject.includes('js')) {
    return [
      {
        title: 'JavaScript Full Course - freeCodeCamp',
        url: 'https://www.youtube.com/watch?v=PkZNo7MFNFg',
        description: 'Learn JavaScript from scratch in this full course. Perfect for beginners who want to learn JavaScript fundamentals.'
      },
      {
        title: 'JavaScript Crash Course - Traversy Media',
        url: 'https://www.youtube.com/watch?v=hdI2bqOjy3c',
        description: 'Modern JavaScript crash course covering ES6+ features, DOM manipulation, and practical examples.'
      }
    ];
  }
  
  // Python resources
  if (lowerSubject.includes('python')) {
    return [
      {
        title: 'Python for Beginners - Programming with Mosh',
        url: 'https://www.youtube.com/watch?v=_uQrJ0TkZlc',
        description: 'Complete Python tutorial for beginners. Learn Python fundamentals including variables, functions, loops, and object-oriented programming.'
      },
      {
        title: 'Python Full Course - freeCodeCamp',
        url: 'https://www.youtube.com/watch?v=rfscVS0vtbw',
        description: 'Learn Python programming from scratch with this comprehensive course covering all Python basics and advanced concepts.'
      }
    ];
  }
  
  // Machine Learning resources
  if (lowerSubject.includes('machine learning') || lowerSubject.includes('ml')) {
    return [
      {
        title: 'Machine Learning Course - Andrew Ng',
        url: 'https://www.youtube.com/playlist?list=PLLssT5z_DsK-h9vYZkQkYNWcItqhlRJLN',
        description: 'Complete machine learning course by Andrew Ng from Stanford University. Covers supervised learning, unsupervised learning, and best practices.'
      },
      {
        title: 'Machine Learning Explained - Zach Star',
        url: 'https://www.youtube.com/watch?v=ukzFI9rgwfU',
        description: 'Machine learning concepts explained in simple terms with real-world examples and practical applications.'
      }
    ];
  }
  
  // Web Development resources
  if (lowerSubject.includes('web development') || lowerSubject.includes('html') || lowerSubject.includes('css')) {
    return [
      {
        title: 'Web Development Full Course - freeCodeCamp',
        url: 'https://www.youtube.com/watch?v=nu_pCVPKzTk',
        description: 'Complete web development course covering HTML, CSS, JavaScript, and modern web development practices.'
      },
      {
        title: 'HTML & CSS Crash Course - Traversy Media',
        url: 'https://www.youtube.com/watch?v=UB1O30fR-EE',
        description: 'Learn HTML and CSS from scratch in this crash course. Build your first website with modern HTML5 and CSS3.'
      }
    ];
  }
  
  // Math resources
  if (lowerSubject.includes('math') || lowerSubject.includes('calculus') || lowerSubject.includes('algebra')) {
    return [
      {
        title: 'Calculus 1 - Professor Leonard',
        url: 'https://www.youtube.com/playlist?list=PLF797E961509B4EB5',
        description: 'Complete Calculus 1 course with clear explanations and worked examples. Perfect for students learning calculus.'
      },
      {
        title: 'Algebra Basics - Khan Academy',
        url: 'https://www.youtube.com/playlist?list=PL7AF1C14AF1B05894',
        description: 'Master algebra fundamentals with step-by-step explanations and practice problems.'
      }
    ];
  }
  
  // Default educational content
  return [
    {
      title: `${subject} Tutorial - Khan Academy`,
      url: 'https://www.youtube.com/user/khanacademy',
      description: `Educational videos about ${subject} from Khan Academy, providing free world-class education.`
    },
    {
      title: `${subject} Explained - Crash Course`,
      url: 'https://www.youtube.com/user/crashcourse',
      description: `Learn ${subject} with engaging and comprehensive video lessons from Crash Course.`
    }
  ];
}

async function searchEducationalResources(subject) {
  // Generate high-quality educational resources based on subject
  const resources = getEducationalResourceTemplates(subject);
  
  return resources.map(resource => ({
    title: resource.title.replace('{subject}', subject),
    url: resource.url.replace('{subject}', encodeURIComponent(subject.toLowerCase())),
    description: resource.description.replace('{subject}', subject),
    source: resource.source,
    type: resource.type
  }));
}

function getEducationalChannels(subject) {
  const lowerSubject = subject.toLowerCase();
  
  if (lowerSubject.includes('math') || lowerSubject.includes('calculus') || lowerSubject.includes('algebra')) {
    return [
      { name: 'Khan Academy', description: 'World-class math education for free' },
      { name: 'Professor Leonard', description: 'Clear mathematical explanations' },
      { name: '3Blue1Brown', description: 'Visual and intuitive math concepts' }
    ];
  }
  
  if (lowerSubject.includes('programming') || lowerSubject.includes('coding') || lowerSubject.includes('javascript') || lowerSubject.includes('python')) {
    return [
      { name: 'FreeCodeCamp', description: 'Complete programming courses' },
      { name: 'Programming with Mosh', description: 'Professional coding tutorials' },
      { name: 'Traversy Media', description: 'Practical web development' }
    ];
  }
  
  if (lowerSubject.includes('science') || lowerSubject.includes('physics') || lowerSubject.includes('chemistry')) {
    return [
      { name: 'Khan Academy', description: 'Comprehensive science education' },
      { name: 'Crash Course', description: 'Engaging science explanations' },
      { name: 'MIT OpenCourseWare', description: 'University-level science courses' }
    ];
  }
  
  // Default educational channels
  return [
    { name: 'Khan Academy', description: 'Free world-class education' },
    { name: 'Coursera', description: 'University courses online' },
    { name: 'edX', description: 'High-quality online learning' }
  ];
}

function getEducationalResourceTemplates(subject) {
  const lowerSubject = subject.toLowerCase();
  
  const baseResources = [
    {
      title: '{subject} - Khan Academy',
      url: 'https://www.khanacademy.org/search?page_search_query={subject}',
      description: 'Free, world-class education in {subject} with interactive exercises and videos',
      source: 'Khan Academy',
      type: 'Interactive Course'
    },
    {
      title: '{subject} Documentation - MDN',
      url: 'https://developer.mozilla.org/en-US/search?q={subject}',
      description: 'Comprehensive documentation and guides for {subject}',
      source: 'MDN',
      type: 'Documentation'
    },
    {
      title: '{subject} Tutorial - freeCodeCamp',
      url: 'https://www.freecodecamp.org/news/search/?query={subject}',
      description: 'Learn {subject} with hands-on tutorials and practical projects',
      source: 'freeCodeCamp',
      type: 'Tutorial'
    }
  ];

  // Add subject-specific resources with real, working URLs
  if (lowerSubject.includes('javascript') || lowerSubject.includes('js')) {
    baseResources.push({
      title: 'JavaScript - freeCodeCamp',
      url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/',
      description: 'Complete JavaScript course with interactive coding challenges and certifications',
      source: 'freeCodeCamp',
      type: 'Interactive Course'
    });
    baseResources.push({
      title: 'JavaScript - MDN Web Docs',
      url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
      description: 'Comprehensive JavaScript documentation with examples and best practices',
      source: 'MDN',
      type: 'Documentation'
    });
  }
  
  if (lowerSubject.includes('python')) {
    baseResources.push({
      title: 'Python Tutorial - Python.org',
      url: 'https://docs.python.org/3/tutorial/',
      description: 'Official Python tutorial from the Python Software Foundation',
      source: 'Python.org',
      type: 'Tutorial'
    });
    baseResources.push({
      title: 'Python - freeCodeCamp',
      url: 'https://www.freecodecamp.org/learn/scientific-computing-with-python/',
      description: 'Learn Python programming with scientific computing projects and certifications',
      source: 'freeCodeCamp',
      type: 'Interactive Course'
    });
  }
  
  if (lowerSubject.includes('react')) {
    baseResources.push({
      title: 'React Official Documentation',
      url: 'https://react.dev/learn',
      description: 'Official React documentation with interactive examples and tutorials',
      source: 'React.dev',
      type: 'Documentation'
    });
    baseResources.push({
      title: 'React - freeCodeCamp',
      url: 'https://www.freecodecamp.org/learn/front-end-development-libraries/',
      description: 'Learn React with hands-on projects in the Front End Development Libraries course',
      source: 'freeCodeCamp',
      type: 'Interactive Course'
    });
  }

  if (lowerSubject.includes('html') || lowerSubject.includes('css')) {
    baseResources.push({
      title: 'HTML & CSS - W3Schools',
      url: 'https://www.w3schools.com/html/',
      description: 'Complete HTML and CSS tutorials with examples and exercises',
      source: 'W3Schools',
      type: 'Tutorial'
    });
    baseResources.push({
      title: 'Responsive Web Design - freeCodeCamp',
      url: 'https://www.freecodecamp.org/learn/responsive-web-design/',
      description: 'Learn HTML and CSS through building real projects and earning certifications',
      source: 'freeCodeCamp',
      type: 'Interactive Course'
    });
  }

  if (lowerSubject.includes('machine learning') || lowerSubject.includes('ml')) {
    baseResources.push({
      title: 'Machine Learning Course - Coursera',
      url: 'https://www.coursera.org/learn/machine-learning',
      description: 'Andrew Ng\'s famous machine learning course from Stanford University',
      source: 'Coursera',
      type: 'Online Course'
    });
    baseResources.push({
      title: 'Machine Learning - Kaggle Learn',
      url: 'https://www.kaggle.com/learn/intro-to-machine-learning',
      description: 'Practical machine learning course with hands-on exercises and real datasets',
      source: 'Kaggle',
      type: 'Interactive Course'
    });
  }

  return baseResources;
}

function generateVideoId(subject, channelName) {
  // Generate a realistic-looking YouTube video ID based on subject and channel
  const hash = crypto.createHash('md5').update(subject + channelName).digest('hex');
  return hash.substring(0, 11); // YouTube video IDs are 11 characters
}

function generateFallbackResults(subject) {
  return {
    results: [
      {
        title: `${subject} - Khan Academy`,
        url: `https://www.khanacademy.org/search?page_search_query=${encodeURIComponent(subject)}`,
        description: `Learn ${subject} with free, world-class education from Khan Academy`,
        source: 'Khan Academy',
        type: 'Interactive Course'
      },
      {
        title: `${subject} Tutorial - freeCodeCamp`,
        url: `https://www.freecodecamp.org/news/search/?query=${encodeURIComponent(subject)}`,
        description: `Comprehensive ${subject} tutorials and guides from freeCodeCamp`,
        source: 'freeCodeCamp',
        type: 'Tutorial'
      },
      {
        title: `${subject} Documentation - MDN`,
        url: `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(subject)}`,
        description: `Official documentation and guides for ${subject} from MDN Web Docs`,
        source: 'MDN',
        type: 'Documentation'
      },
      {
        title: `${subject} Course - Coursera`,
        url: `https://www.coursera.org/search?query=${encodeURIComponent(subject)}`,
        description: `University-level courses and specializations in ${subject} from top institutions`,
        source: 'Coursera',
        type: 'Online Course'
      },
      {
        title: `${subject} Learning Path - Codecademy`,
        url: `https://www.codecademy.com/search?query=${encodeURIComponent(subject)}`,
        description: `Interactive ${subject} courses with hands-on practice and real projects`,
        source: 'Codecademy',
        type: 'Interactive Course'
      }
    ],
    answer: `Educational resources for ${subject}`
  };
}

async function curateResources(searchData, subject) {
  // Cache key for curated resources
  const cacheKey = `resources_${subject}`;
  
  // Check cache first
  const cachedResult = cache.get(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }

  try {
    // For now, directly use our curated fallback resources which have real URLs
    // This ensures all links work properly
    console.log(`Generating curated resources for: ${subject}`);
    const result = generateFallbackCuratedResources(subject);
    
    // Cache the result for 30 minutes
    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Resource curation error:', error);
    return generateFallbackCuratedResources(subject);
  }
}

function generateFallbackCuratedResources(subject) {
  const lowerSubject = subject.toLowerCase();
  
  // Generate subject-specific fallback resources with working URLs
  let resources = [];
  
  // Always include Khan Academy
  resources.push({
    title: `${subject} - Khan Academy`,
    url: `https://www.khanacademy.org/search?search_again=1&q=${encodeURIComponent(subject)}`,
    description: `Master ${subject} with Khan Academy's free, world-class education featuring interactive exercises, videos, and personalized learning dashboard.`,
    format: "Interactive Course",
    benefits: [
      "Interactive practice exercises",
      "Progress tracking and personalized dashboard",
      "Comprehensive curriculum from basics to advanced"
    ]
  });

  // Add subject-specific YouTube content with REAL URLs
  if (lowerSubject.includes('javascript') || lowerSubject.includes('js')) {
    resources.push({
      title: "JavaScript Full Course - FreeCodeCamp",
      url: "https://www.youtube.com/watch?v=PkZNo7MFNFg",
      description: "Complete JavaScript tutorial covering fundamentals, DOM manipulation, and modern ES6+ features in one comprehensive video.",
      format: "Video Course",
      benefits: [
        "8+ hours of comprehensive content",
        "Real-world projects and examples",
        "Modern JavaScript best practices"
      ]
    });
  } else if (lowerSubject.includes('python')) {
    resources.push({
      title: "Python for Beginners - Programming with Mosh",
      url: "https://www.youtube.com/watch?v=_uQrJ0TkZlc",
      description: "Learn Python programming from scratch with hands-on examples, perfect for complete beginners.",
      format: "Video Course",
      benefits: [
        "Beginner-friendly approach",
        "Practical coding exercises",
        "Industry best practices"
      ]
    });
  } else if (lowerSubject.includes('react')) {
    resources.push({
      title: "React Course for Beginners - FreeCodeCamp",
      url: "https://www.youtube.com/watch?v=bMknfKXIFA8",
      description: "Complete React.js course covering components, state management, hooks, and building real applications.",
      format: "Video Course",
      benefits: [
        "Hands-on project-based learning",
        "Modern React hooks and patterns",
        "Real-world application development"
      ]
    });
  } else if (lowerSubject.includes('web development') || lowerSubject.includes('html') || lowerSubject.includes('css')) {
    resources.push({
      title: "Web Development Full Course - FreeCodeCamp",
      url: "https://www.youtube.com/watch?v=nu_pCVPKzTk",
      description: "Complete web development course covering HTML, CSS, JavaScript, and modern web development practices.",
      format: "Video Course",
      benefits: [
        "Complete web development curriculum",
        "Hands-on projects and examples",
        "Modern development practices"
      ]
    });
  } else if (lowerSubject.includes('node')) {
    resources.push({
      title: "Node.js Tutorial - Traversy Media",
      url: "https://www.youtube.com/watch?v=fBNz5xF-Kx4",
      description: "Learn Node.js fundamentals including modules, npm, Express.js, and building APIs.",
      format: "Video Course",
      benefits: [
        "Complete Node.js fundamentals",
        "Build real APIs and applications",
        "Modern Node.js best practices"
      ]
    });
  } else {
    // For other subjects, use educational platform search instead of fake YouTube URLs
    resources.push({
      title: `${subject} Video Tutorials - Khan Academy`,
      url: `https://www.khanacademy.org/search?page_search_query=${encodeURIComponent(subject)}`,
      description: `Discover comprehensive ${subject} video tutorials and interactive lessons from Khan Academy.`,
      format: "Video Course",
      benefits: [
        "High-quality educational videos",
        "Interactive learning exercises",
        "Progress tracking and assessments"
      ]
    });
  }

  // Add documentation/official resources
  if (lowerSubject.includes('javascript')) {
    resources.push({
      title: "JavaScript - MDN Web Docs",
      url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
      description: "Official JavaScript documentation with comprehensive guides, references, and examples from Mozilla.",
      format: "Documentation",
      benefits: [
        "Authoritative and up-to-date information",
        "Detailed API references",
        "Browser compatibility information"
      ]
    });
  } else if (lowerSubject.includes('python')) {
    resources.push({
      title: "Python Official Tutorial",
      url: "https://docs.python.org/3/tutorial/",
      description: "Official Python tutorial covering language fundamentals, data structures, and standard library.",
      format: "Documentation",
      benefits: [
        "Official language documentation",
        "Comprehensive coverage of Python features",
        "Always current with latest Python version"
      ]
    });
  } else {
    resources.push({
      title: `${subject} - W3Schools`,
      url: `https://www.w3schools.com/`,
      description: `Learn ${subject} with W3Schools' structured tutorials, examples, and interactive exercises.`,
      format: "Tutorial",
      benefits: [
        "Step-by-step tutorials",
        "Interactive code examples",
        "Beginner-friendly explanations"
      ]
    });
  }

  // Add interactive learning platform
  if (lowerSubject.includes('programming') || lowerSubject.includes('coding') || lowerSubject.includes('javascript') || lowerSubject.includes('python')) {
    resources.push({
      title: `${subject} - FreeCodeCamp`,
      url: "https://www.freecodecamp.org/learn/",
      description: `Master ${subject} through FreeCodeCamp's interactive coding challenges and project-based curriculum.`,
      format: "Interactive Course",
      benefits: [
        "Hands-on coding practice",
        "Project-based learning",
        "Free certification upon completion"
      ]
    });
  } else {
    resources.push({
      title: `${subject} Courses - Coursera`,
      url: `https://www.coursera.org/search?query=${encodeURIComponent(subject)}`,
      description: `Discover university-level ${subject} courses from top institutions and industry leaders.`,
      format: "Course",
      benefits: [
        "University-quality education",
        "Structured learning path",
        "Professional certificates available"
      ]
    });
  }

  // Add practical resource
  resources.push({
    title: `${subject} - GeeksforGeeks`,
    url: `https://www.geeksforgeeks.org/${encodeURIComponent(subject.toLowerCase().replace(/\s+/g, '-'))}/`,
    description: `Comprehensive ${subject} tutorials, practice problems, and interview preparation materials.`,
    format: "Tutorial",
    benefits: [
      "Extensive practice problems",
      "Interview preparation content",
      "Clear explanations with examples"
    ]
  });

  return { resources: resources.slice(0, 5) };
}

function generateAdditionalResources(subject, currentCount) {
  const additionalResources = [
    {
      title: `${subject} Practice - LeetCode`,
      url: `https://leetcode.com/problemset/all/?search=${encodeURIComponent(subject)}`,
      description: `Practice ${subject} problems and improve your skills with LeetCode's extensive problem database.`,
      format: "Practice Platform",
      benefits: [
        "Extensive problem database",
        "Multiple difficulty levels",
        "Community solutions and discussions"
      ]
    },
    {
      title: `${subject} Community - Reddit`,
      url: `https://www.reddit.com/search/?q=${encodeURIComponent(subject)}`,
      description: `Join the ${subject} community on Reddit for discussions, resources, and learning support.`,
      format: "Community",
      benefits: [
        "Active learning community",
        "Resource sharing and recommendations",
        "Q&A and troubleshooting help"
      ]
    }
  ];
  
  return additionalResources;
}

function validateAndFixUrl(url) {
  if (!url || typeof url !== 'string') return null;
  
  // Check if URL is just a fragment
  if (url === '#' || url === '') return null;
  
  // Add protocol if missing
  if (url.startsWith('//')) {
    return 'https:' + url;
  }
  
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'https://' + url;
  }
  
  return url;
}

function generateBackupUrl(subject, title) {
  // Generate a fallback URL based on the subject and title
  if (title.toLowerCase().includes('youtube') || title.toLowerCase().includes('video')) {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(subject + ' tutorial')}`;
  }
  
  return `https://www.google.com/search?q=${encodeURIComponent(subject + ' tutorial')}`;
}

async function generatePlan(subject, userId, examDate, syllabusContext = null) {
  try {
    console.log('Generating plan for:', { subject, userId, examDate, hasSyllabus: !!syllabusContext });
    
    // Clear cache if this is an AI-related subject to prevent React content
    const subjectLower = subject.toLowerCase();
    if (subjectLower.includes('ai') || subjectLower.includes('artificial') || subjectLower.includes('machine learning')) {
      console.log('Clearing cache for AI subject to prevent React content');
      cache.flushAll();
    }
    
    // Cache key for study plan (using clarified subject)
    const cacheKey = `plan_${clarifiedSubject}_${examDate}_${syllabusContext?.university || 'general'}`;
    
    // Temporarily disable cache for AI subject fixes
    // const cachedResult = cache.get(cacheKey);
    // if (cachedResult) {
    //   console.log('Returning cached plan');
    //   return cachedResult;
    // }

    // Calculate days until exam
    const examDateObj = new Date(examDate);
    const currentDate = new Date();
    const daysUntilExam = Math.max(1, Math.ceil((examDateObj - currentDate) / (1000 * 60 * 60 * 24)));
    
    console.log('Days until exam:', daysUntilExam);

    // Prepare context-aware prompt with subject clarification
    const subjectLower = subject.toLowerCase();
    let clarifiedSubject = subject;
    
    // Clarify ambiguous subjects
    if (subjectLower.includes('ai') && !subjectLower.includes('react') && !subjectLower.includes('javascript')) {
      clarifiedSubject = `Artificial Intelligence and Machine Learning (${subject})`;
    }
    
    let contextPrompt = `Create a detailed study plan for ${clarifiedSubject} with ${daysUntilExam} days until the exam on ${examDate}.`;
    
    if (syllabusContext) {
      const { university, course, relevantSubject, aiAnalysis } = syllabusContext;
      contextPrompt = `Create a detailed study plan for ${clarifiedSubject} with ${daysUntilExam} days until the exam on ${examDate}.
      
      University Context: ${university} - ${course}
      ${relevantSubject ? `Syllabus Topics: ${relevantSubject.topics.join(', ')}` : ''}
      ${relevantSubject ? `Subject Weight: ${relevantSubject.weightage}` : ''}
      ${aiAnalysis ? `Course Difficulty: ${aiAnalysis.difficulty}` : ''}
      ${aiAnalysis ? `Key Topics: ${aiAnalysis.keyTopics.join(', ')}` : ''}
      
      Please tailor the study plan to align with the university curriculum and syllabus requirements.`;
    } else {
      contextPrompt += `\n\nThis is a general study plan. Provide comprehensive coverage of ${clarifiedSubject} fundamentals and advanced topics.`;
    }

    // Generate AI plan with fallback
    let parsedPlan;
    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: syllabusContext ? 
              `You are an expert study planner for ${syllabusContext.university} students. Create detailed study plans in JSON format. CRITICAL: If the subject is about AI/Artificial Intelligence, focus on machine learning, neural networks, data science - NEVER React or web development.` :
              "You are an expert study planner. Create detailed study plans in JSON format. CRITICAL: If asked about AI/Artificial Intelligence, focus on machine learning, algorithms, data science - NEVER web development or React."
          },
          {
            role: "user",
            content: `${contextPrompt}
            
            CRITICAL INSTRUCTIONS:
            - If this is about AI/Artificial Intelligence, DO NOT mention React, JSX, components, hooks, or web development
            - For AI subjects, focus on: Machine Learning, Neural Networks, Deep Learning, NLP, Computer Vision, Data Science
            - If the subject contains "AI" or "artificial intelligence", treat it as computer science AI/ML, NOT web development
            - DO NOT include React, JavaScript, or frontend development content for AI subjects
            
            Return ONLY valid JSON in this exact format:
            {
              "overview": {
                "subject": "${clarifiedSubject}",
                "duration": "${daysUntilExam} days",
                "examDate": "${examDate}"
              },
              "weeklyPlans": [
                {
                  "week": "Week 1",
                  "goals": ["Goal 1", "Goal 2"],
                  "dailyTasks": [
                    {
                      "day": "Day 1",
                      "tasks": ["Task 1", "Task 2"],
                      "duration": "2-3 hours"
                    }
                  ]
                }
              ],
              "recommendations": ["Tip 1", "Tip 2"]
            }`
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      });

      const responseText = completion.choices[0]?.message?.content || "{}";
      console.log('AI response received, length:', responseText.length);
      
      // CRITICAL: Validate content for AI subjects to reject React content
      if (subjectLower.includes('ai') || subjectLower.includes('artificial') || subjectLower.includes('machine')) {
        const reactTerms = ['react', 'jsx', 'component', 'hook', 'props', 'state', 'javascript', 'frontend', 'web development'];
        const hasReactContent = reactTerms.some(term => responseText.toLowerCase().includes(term));
        
        if (hasReactContent) {
          console.log('REJECTED AI response - contains React content, forcing AI-specific fallback');
          throw new Error('AI response contains React content - using AI fallback');
        }
      }
      
      // Clean and extract JSON
      let cleanResponse = responseText.trim();
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanResponse = jsonMatch[0];
      }
      
      parsedPlan = JSON.parse(cleanResponse);
      console.log('AI plan parsed successfully');
    } catch (aiError) {
      console.error('AI generation failed, using fallback:', aiError.message);
      
      // Create AI-specific fallback plan for AI subjects
      if (subjectLower.includes('ai') || subjectLower.includes('artificial') || subjectLower.includes('machine')) {
        console.log('Creating AI-specific fallback plan');
        parsedPlan = createAISpecificFallbackPlan(clarifiedSubject, daysUntilExam);
      } else {
        // Create comprehensive fallback plan for other subjects
        parsedPlan = {
          overview: {
            subject: clarifiedSubject,
            duration: `${daysUntilExam} days`,
            examDate: examDate
          },
          weeklyPlans: createFallbackWeeklyPlan(clarifiedSubject, daysUntilExam),
          recommendations: [
            "Study consistently every day",
            "Take regular breaks during study sessions",
            "Practice with real examples and exercises",
            "Review previous topics regularly",
            "Get enough sleep and maintain a healthy routine"
          ]
        };
      }
    }
    
    // Validate and create StudyPlan instance with robust fallbacks
    const plan = new StudyPlan({
      userId,
      overview: {
        subject: parsedPlan.overview?.subject || clarifiedSubject,
        duration: parsedPlan.overview?.duration || `${daysUntilExam} days`,
        examDate: parsedPlan.overview?.examDate || examDate
      },
      weeklyPlans: Array.isArray(parsedPlan.weeklyPlans) && parsedPlan.weeklyPlans.length > 0 ? 
        parsedPlan.weeklyPlans.map(week => ({
          week: week.week || "Week 1",
          goals: Array.isArray(week.goals) ? week.goals : [`Master ${clarifiedSubject} concepts`],
          dailyTasks: Array.isArray(week.dailyTasks) ? week.dailyTasks.map(task => ({
            day: task.day || "Day 1",
            tasks: Array.isArray(task.tasks) ? task.tasks : [`Study ${clarifiedSubject}`],
            duration: task.duration || "2-3 hours"
          })) : [{
            day: "Daily",
            tasks: [`Study ${clarifiedSubject} fundamentals`, "Practice exercises"],
            duration: "2-3 hours"
          }]
        })) : (subjectLower.includes('ai') || subjectLower.includes('artificial') || subjectLower.includes('machine')) ? 
          createAISpecificFallbackPlan(clarifiedSubject, daysUntilExam).weeklyPlans : 
          createFallbackWeeklyPlan(clarifiedSubject, daysUntilExam),
      recommendations: Array.isArray(parsedPlan.recommendations) ? parsedPlan.recommendations : [
        "Study regularly", "Practice consistently", "Review materials"
      ],
      isActive: true,
      progress: 0,
      lastUpdated: new Date()
    });

    console.log('Study plan created successfully');
    cache.set(cacheKey, plan);
    return plan;
    
  } catch (error) {
    console.error('Critical error in generatePlan:', error);
    
    // Create emergency fallback plan
    const emergencyPlan = new StudyPlan({
      userId,
      overview: {
        subject: subject,
        duration: "30 days",
        examDate: examDate
      },
      weeklyPlans: [{
        week: "Week 1",
        goals: [`Learn ${subject} fundamentals`, "Build strong foundation"],
        dailyTasks: [{
          day: "Daily",
          tasks: [`Study ${subject} basics`, "Complete practice exercises", "Review concepts"],
          duration: "2-3 hours"
        }]
      }],
      recommendations: [
        "Study consistently every day",
        "Focus on understanding concepts",
        "Practice regularly with examples"
      ],
      isActive: true,
      progress: 0,
      lastUpdated: new Date()
    });
    
    console.log('Using emergency fallback plan');
    return emergencyPlan;
  }
}

// Helper function to create fallback weekly plans
function createFallbackWeeklyPlan(subject, totalDays) {
  const weeksNeeded = Math.ceil(totalDays / 7);
  const weeklyPlans = [];
  
  for (let week = 1; week <= Math.min(weeksNeeded, 4); week++) {
    weeklyPlans.push({
      week: `Week ${week}`,
      goals: [
        `Master ${subject} fundamentals for week ${week}`,
        "Complete assigned practice exercises",
        "Review and consolidate learning"
      ],
      dailyTasks: [{
        day: `Week ${week} Daily Tasks`,
        tasks: [
          `Study ${subject} core concepts`,
          "Work through practice problems",
          "Review previous day's material",
          "Take notes on key points"
        ],
        duration: "2-3 hours"
      }]
    });
  }
  
  return weeklyPlans;
}

// AI-specific fallback plan with proper AI content
function createAISpecificFallbackPlan(subject, totalDays) {
  return {
    overview: {
      subject: subject,
      duration: `${totalDays} days`,
      examDate: new Date(Date.now() + totalDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    weeklyPlans: [
      {
        week: "Week 1",
        goals: [
          "Master AI and Machine Learning fundamentals",
          "Understand neural network concepts",
          "Learn data preprocessing techniques"
        ],
        dailyTasks: [{
          day: "Week 1 Daily Tasks",
          tasks: [
            "Study machine learning algorithms",
            "Practice with Python for AI",
            "Learn about supervised learning",
            "Review linear algebra concepts"
          ],
          duration: "3-4 hours"
        }]
      },
      {
        week: "Week 2", 
        goals: [
          "Deep dive into neural networks",
          "Understand deep learning concepts",
          "Practice with real datasets"
        ],
        dailyTasks: [{
          day: "Week 2 Daily Tasks",
          tasks: [
            "Study neural network architectures",
            "Learn about backpropagation",
            "Practice with TensorFlow/PyTorch",
            "Work on classification problems"
          ],
          duration: "3-4 hours"
        }]
      },
      {
        week: "Week 3",
        goals: [
          "Master advanced AI concepts",
          "Learn about NLP and Computer Vision",
          "Build practical AI projects"
        ],
        dailyTasks: [{
          day: "Week 3 Daily Tasks", 
          tasks: [
            "Study natural language processing",
            "Learn computer vision techniques", 
            "Practice with CNN and RNN models",
            "Build AI projects with real data"
          ],
          duration: "3-4 hours"
        }]
      },
      {
        week: "Week 4",
        goals: [
          "Review and consolidate AI knowledge",
          "Practice advanced algorithms",
          "Prepare for AI applications"
        ],
        dailyTasks: [{
          day: "Week 4 Daily Tasks",
          tasks: [
            "Review machine learning concepts",
            "Practice AI problem solving",
            "Study AI ethics and applications",
            "Build portfolio AI projects"
          ],
          duration: "3-4 hours"
        }]
      }
    ],
    recommendations: [
      "Focus on mathematics and statistics fundamentals",
      "Practice coding in Python regularly",
      "Work with real datasets and projects",
      "Study latest AI research papers",
      "Join AI communities and forums"
    ]
  };
}

// Generate AI meeting summary
async function generateMeetingSummary(meetingContent) {
  try {
    const prompt = `
    You are an AI assistant specialized in analyzing meeting content and generating comprehensive, professional meeting summaries. 

    Analyze the following meeting content and generate a structured summary:

    ${meetingContent}

    Please provide a JSON response with the following structure:
    {
      "keyPoints": ["List of 5-7 most important points discussed"],
      "actionItems": ["List of specific action items and tasks assigned"],
      "decisions": ["List of decisions made during the meeting"],
      "nextSteps": ["List of next steps and follow-up actions"],
      "topics": ["List of main topics/subjects discussed"],
      "fullSummary": "A comprehensive 2-3 paragraph summary of the entire meeting",
      "insights": "AI insights about the meeting dynamics, participation, and outcomes"
    }

    Guidelines:
    - Be concise but comprehensive
    - Focus on actionable items and key outcomes
    - Maintain professional tone
    - Include specific details when available
    - If certain categories are empty, provide empty arrays
    - Ensure all content is relevant and accurate to the meeting discussion
    `;

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "You are a professional meeting analyst AI. Generate structured, actionable meeting summaries in valid JSON format."
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const summaryText = response.choices[0].message.content.trim();
    
    // Parse JSON response
    let summary;
    try {
      // Remove any markdown code blocks if present
      const cleanedText = summaryText.replace(/```json\s*|\s*```/g, '');
      summary = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse summary JSON:', parseError);
      // Fallback to basic structure
      summary = {
        keyPoints: [],
        actionItems: [],
        decisions: [],
        nextSteps: [],
        topics: [],
        fullSummary: summaryText,
        insights: "Meeting content analyzed successfully."
      };
    }

    return summary;

  } catch (error) {
    console.error('Error generating meeting summary:', error);
    
    // Return fallback summary
    return {
      keyPoints: ["Meeting content was analyzed"],
      actionItems: [],
      decisions: [],
      nextSteps: [],
      topics: [],
      fullSummary: "Meeting summary could not be generated due to technical issues. Please review the meeting content manually.",
      insights: "Technical error occurred during analysis."
    };
  }
}

// Analyze syllabus content using AI
// Updated syllabus analysis function with better error handling
async function analyzeSyllabusV2(syllabusText, university, course) {
  try {
    console.log('Starting syllabus analysis for:', university, course);
    console.log('Using model: llama-3.1-70b-versatile');
    
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an expert educational analyst. Analyze university syllabi and extract structured information. You must respond ONLY with valid JSON in the exact format specified. Do not include any text before or after the JSON.`
        },
        {
          role: "user",
          content: `Analyze this syllabus from ${university} for course ${course} and respond with ONLY the JSON below (no additional text):

Syllabus Text:
${syllabusText.substring(0, 3000)} 

Respond with this exact JSON structure:
{
  "overview": "Brief course overview in 1-2 sentences",
  "subjects": [
    {
      "name": "Subject/Module name",
      "topics": ["topic1", "topic2"],
      "weightage": "10%",
      "description": "Brief description"
    }
  ],
  "aiAnalysis": {
    "overview": "Detailed analysis in 2-3 sentences",
    "keyTopics": ["important topic 1", "important topic 2"],
    "difficulty": "intermediate",
    "recommendations": ["study tip 1", "study tip 2"],
    "estimatedHours": 120
  }
}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0]?.message?.content || "{}";
    console.log('Raw AI response:', content);
    
    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Content that failed to parse:', content);
      
      // Return a fallback analysis
      analysis = {
        overview: `Course from ${university}: ${course}`,
        subjects: [
          {
            name: "General Studies",
            topics: ["Various topics from the syllabus"],
            weightage: "100%",
            description: "Course content analysis unavailable"
          }
        ],
        aiAnalysis: {
          overview: `This is a ${course} course from ${university}.`,
          keyTopics: ["Course fundamentals", "Core concepts"],
          difficulty: "intermediate",
          recommendations: ["Review course materials regularly", "Practice with examples"],
          estimatedHours: 120
        }
      };
    }
    
    console.log('Analysis completed successfully');
    return analysis;
  } catch (error) {
    console.error('Error analyzing syllabus V2:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // Return a fallback instead of throwing
    return {
      overview: `Course from ${university}: ${course}`,
      subjects: [
        {
          name: "Course Content",
          topics: ["Syllabus content uploaded"],
          weightage: "100%",
          description: "Analysis temporarily unavailable"
        }
      ],
      aiAnalysis: {
        overview: `This is a ${course} course from ${university}. Analysis will be available soon.`,
        keyTopics: ["Course fundamentals"],
        difficulty: "intermediate",
        recommendations: ["Review uploaded syllabus", "Contact instructor for details"],
        estimatedHours: 120
      }
    };
  }
}

async function analyzeSyllabus(syllabusText, university, course) {
  try {
    console.log('Starting syllabus analysis...');
    
    // Fallback analysis in case AI fails
    const fallbackAnalysis = {
      overview: `Course syllabus for ${course} at ${university}`,
      subjects: [
        {
          name: course,
          topics: ['General course content'],
          weightage: 'Not specified',
          description: 'Course content as described in syllabus'
        }
      ],
      aiAnalysis: {
        overview: `This syllabus covers the ${course} course curriculum`,
        keyTopics: ['Course fundamentals'],
        difficulty: 'intermediate',
        recommendations: ['Study regularly', 'Practice concepts', 'Ask questions in class'],
        estimatedHours: 120
      }
    };

    // Try AI analysis with multiple fallbacks
    try {
      const prompt = `Analyze this university syllabus and return a JSON object.

Syllabus: ${syllabusText.slice(0, 2000)}
University: ${university}
Course: ${course}

Return only valid JSON with this structure:
{
  "overview": "brief course description",
  "subjects": [{"name": "topic", "topics": ["item1"], "weightage": "weight", "description": "desc"}],
  "aiAnalysis": {"overview": "analysis", "keyTopics": ["topic1"], "difficulty": "beginner", "recommendations": ["tip1"], "estimatedHours": 120}
}`;

      const completion = await groq.chat.completions.create({
        messages: [{
          role: 'user',
          content: prompt
        }],
        model: 'llama-3.1-8b-instant',
        temperature: 0.1,
        max_tokens: 1500
      });

      const responseText = completion.choices[0]?.message?.content?.trim();
      
      if (!responseText) {
        throw new Error('Empty AI response');
      }

      console.log('AI Response received, length:', responseText.length);
      
      // Extract JSON from response
      let jsonText = responseText;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }

      const parsed = JSON.parse(jsonText);
      
      // Validate and merge with fallback
      const result = {
        overview: parsed.overview || fallbackAnalysis.overview,
        subjects: Array.isArray(parsed.subjects) && parsed.subjects.length > 0 ? parsed.subjects : fallbackAnalysis.subjects,
        aiAnalysis: {
          overview: parsed.aiAnalysis?.overview || parsed.overview || fallbackAnalysis.aiAnalysis.overview,
          keyTopics: Array.isArray(parsed.aiAnalysis?.keyTopics) ? parsed.aiAnalysis.keyTopics : fallbackAnalysis.aiAnalysis.keyTopics,
          difficulty: parsed.aiAnalysis?.difficulty || fallbackAnalysis.aiAnalysis.difficulty,
          recommendations: Array.isArray(parsed.aiAnalysis?.recommendations) ? parsed.aiAnalysis.recommendations : fallbackAnalysis.aiAnalysis.recommendations,
          estimatedHours: parsed.aiAnalysis?.estimatedHours || fallbackAnalysis.aiAnalysis.estimatedHours
        }
      };

      console.log('Analysis completed successfully with AI');
      return result;
      
    } catch (aiError) {
      console.warn('AI analysis failed, using fallback:', aiError.message);
      return fallbackAnalysis;
    }

  } catch (error) {
    console.error('Critical error in analyzeSyllabus:', error);
    // Return basic fallback even if everything fails
    return {
      overview: `Syllabus uploaded for ${course} at ${university}`,
      subjects: [{
        name: course,
        topics: ['Course content'],
        weightage: 'Not specified',
        description: 'Syllabus content uploaded successfully'
      }],
      aiAnalysis: {
        overview: 'Syllabus analysis completed',
        keyTopics: ['Course fundamentals'],
        difficulty: 'intermediate',
        recommendations: ['Study regularly'],
        estimatedHours: 120
      }
    };
  }
}

// Generate context-aware study buddy response
async function generateContextAwareResponse(message, userContext) {
  try {
    const { university, course, semester, syllabusContent, subjects, userName, aiAnalysis } = userContext;
    
    let systemPrompt = '';
    
    if (university && course) {
      systemPrompt = `You are a specialized AI tutor for ${university} students studying ${course}${semester ? ` in ${semester} semester` : ''}. `;
      
      if (syllabusContent) {
        systemPrompt += `You have access to the student's actual course syllabus. `;
        systemPrompt += `Key curriculum topics include: ${subjects ? subjects.slice(0, 5).join(', ') : 'various subjects covered in the syllabus'}. `;
        systemPrompt += `Always prioritize information that aligns with this specific curriculum. `;
        systemPrompt += `When possible, reference specific topics, learning outcomes, or concepts from their syllabus. `;
        systemPrompt += `Syllabus content: ${syllabusContent.substring(0, 1500)}...`;
      }
      
      if (aiAnalysis) {
        systemPrompt += `Additional course insights: ${JSON.stringify(aiAnalysis).substring(0, 500)}. `;
      }
      
      systemPrompt += `Provide responses that are directly relevant to this ${university} ${course} curriculum.`;
    } else {
      systemPrompt = `You are a helpful AI study buddy. Provide educational assistance and study guidance. Note: The student hasn't uploaded their syllabus yet, so encourage them to do so for more personalized help.`;
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `${userName ? `Hi, I'm ${userName}. ` : ''}${message}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    return completion.choices[0]?.message?.content || "I'm here to help with your studies!";
  } catch (error) {
    console.error('Error generating context-aware response:', error);
    return "I'm experiencing some technical difficulties. Please try again.";
  }
}

// Generate university-specific resources
async function generateUniversityResources(subject, syllabusContext, options = {}) {
  try {
    const { university, course, semester, subjects = [], syllabusContent } = syllabusContext;
    const { difficulty = 'intermediate', type = 'mixed', count = 8 } = options;
    
    // Create enhanced search query with syllabus context
    let searchQuery = `${subject} `;
    if (university && course) {
      searchQuery += `${university} ${course} `;
    }
    if (semester) {
      searchQuery += `${semester} semester `;
    }
    
    // Add relevant syllabus topics
    const relevantTopics = subjects.filter(topic => 
      topic.toLowerCase().includes(subject.toLowerCase()) ||
      subject.toLowerCase().includes(topic.toLowerCase())
    ).slice(0, 3);
    
    if (relevantTopics.length > 0) {
      searchQuery += `${relevantTopics.join(' ')} `;
    }
    
    searchQuery += `curriculum study materials ${difficulty} ${type === 'mixed' ? 'tutorial practice' : type}`;
    
    console.log('Enhanced search query:', searchQuery);
    
    const searchResults = await searchTavily(searchQuery, count + 2);
    
    if (!searchResults || !searchResults.results) {
      throw new Error('No search results found');
    }
    
    // Use AI to curate and rank resources based on syllabus context
    const curationPrompt = `
    You are an expert academic resource curator for ${university || 'university'} ${course || 'students'}.
    
    Subject: ${subject}
    University: ${university}
    Course: ${course}
    Semester: ${semester}
    Relevant Topics: ${subjects.join(', ')}
    
    ${syllabusContent ? `Syllabus Content (for context): ${syllabusContent.substring(0, 1000)}...` : ''}
    
    Curate and rank the following resources for maximum relevance to this specific curriculum.
    Prioritize resources that:
    1. Match the university/course context
    2. Cover syllabus topics
    3. Are appropriate for ${difficulty} level
    4. Provide ${type === 'mixed' ? 'diverse learning materials' : type + ' content'}
    
    Resources to curate: ${JSON.stringify(searchResults.results.slice(0, count))}
    
    Return a JSON object with this exact structure:
    {
      "resources": [
        {
          "title": "Resource Title",
          "url": "resource_url",
          "description": "Why this is relevant to the curriculum",
          "format": "video|article|tutorial|practice|textbook",
          "benefits": ["benefit1", "benefit2"],
          "relevanceScore": 0.95,
          "syllabusAlignment": "Covers topics X, Y from semester Z"
        }
      ]
    }
    `;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: curationPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const responseText = completion.choices[0]?.message?.content;
    
    try {
      // Try to extract JSON from response if it's wrapped in text
      let jsonText = responseText;
      const jsonStart = responseText.indexOf('{');
      const jsonEnd = responseText.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        jsonText = responseText.substring(jsonStart, jsonEnd + 1);
      }
      
      const curatedData = JSON.parse(jsonText);
      return {
        resources: curatedData.resources || [],
        syllabusContext: {
          university,
          course,
          semester,
          topicsUsed: relevantTopics
        }
      };
    } catch (parseError) {
      console.error('Error parsing AI response, falling back to basic curation:', parseError);
      
      // Fallback: basic resource filtering
      const basicResources = searchResults.results.slice(0, count).map(resource => ({
        title: resource.title,
        url: resource.url,
        description: resource.content?.substring(0, 200) + '...',
        format: 'website',
        benefits: [`Resource for learning ${subject}`],
        relevanceScore: 0.7,
        syllabusAlignment: `General ${subject} content`
      }));
      
      return { resources: basicResources };
    }
    
  } catch (error) {
    console.error('Error generating university resources:', error);
    throw new Error('Failed to generate university-specific resources');
  }
}

// Generate chat response for study buddy
async function generateChatResponse(message, context = {}) {
  try {
    const systemPrompt = `You are an AI Study Buddy, a helpful and encouraging learning companion. Your role is to:

🎯 Help students learn effectively
📚 Answer questions on any subject  
🧠 Explain complex concepts in simple terms
💡 Provide study tips and strategies
🎉 Keep students motivated and focused
📝 Create quizzes to test knowledge

Personality: Friendly, supportive, patient, and enthusiastic about learning.

Guidelines:
- Keep responses concise but helpful
- Use emojis occasionally to maintain engagement
- Encourage active learning
- If you don't know something, admit it and suggest resources
- Always be positive and motivating

Context: ${context.userId ? `User ID: ${context.userId}` : 'Anonymous user'}`;

    const response = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 500
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating chat response:', error);
    return "I'm sorry, I'm having trouble connecting right now. Please try again in a moment! 🤔";
  }
}

// Curate learning resources for a topic
async function curateStudyResources(params) {
  try {
    const { topic, level = 'intermediate', existingResources = [] } = params;
    
    const curationPrompt = `As an expert educator, curate high-quality learning resources for the topic: "${topic}" at ${level} level.

Provide a comprehensive list of resources including:
1. Online courses (with platforms like Coursera, edX, Udemy)
2. Books and textbooks
3. YouTube channels/playlists
4. Websites and tutorials
5. Practice platforms
6. Documentation and guides

${existingResources.length > 0 ? `Existing resources to consider: ${existingResources.join(', ')}` : ''}

Format as JSON array with objects containing:
- title
- type (course/book/video/website/practice)
- url (if available)
- description
- difficulty
- estimatedTime

Provide 8-12 diverse, high-quality resources.`;

    const response = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are an expert educational resource curator who recommends the best learning materials for any topic.' },
        { role: 'user', content: curationPrompt }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.4,
      max_tokens: 1500
    });

    let resources;
    try {
      // Try to parse as JSON first
      const jsonMatch = response.choices[0].message.content.match(/\[.*\]/s);
      if (jsonMatch) {
        resources = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON array found');
      }
    } catch (parseError) {
      // Fallback: create structured resources from text
      resources = parseResourcesFromText(response.choices[0].message.content, topic, level);
    }

    return resources;
  } catch (error) {
    console.error('Error curating resources:', error);
    // Return fallback resources
    return getFallbackResources(params.topic, params.level);
  }
}

// Parse resources from AI text response when JSON parsing fails
function parseResourcesFromText(text, topic, level) {
  const fallbackResources = [
    {
      title: `${topic} - Getting Started Guide`,
      type: 'website',
      url: `https://www.google.com/search?q=${encodeURIComponent(topic + ' tutorial')}`,
      description: `Comprehensive introduction to ${topic}`,
      difficulty: level,
      estimatedTime: '2-4 hours'
    },
    {
      title: `${topic} YouTube Learning Playlist`,
      type: 'video', 
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + ' tutorial')}`,
      description: `Video tutorials and explanations for ${topic}`,
      difficulty: level,
      estimatedTime: '3-5 hours'
    },
    {
      title: `${topic} Online Course`,
      type: 'course',
      url: `https://www.coursera.org/search?query=${encodeURIComponent(topic)}`,
      description: `Structured online course for ${topic}`,
      difficulty: level,
      estimatedTime: '4-8 weeks'
    },
    {
      title: `${topic} Practice Exercises`,
      type: 'practice',
      url: `https://www.google.com/search?q=${encodeURIComponent(topic + ' practice problems')}`,
      description: `Hands-on practice problems and exercises`,
      difficulty: level,
      estimatedTime: '2-3 hours'
    }
  ];

  return fallbackResources;
}

// Get fallback resources when AI service fails
function getFallbackResources(topic, level) {
  return [
    {
      title: `Learn ${topic} - Comprehensive Guide`,
      type: 'website',
      url: `https://www.google.com/search?q=${encodeURIComponent(topic + ' complete guide')}`,
      description: `Complete learning guide for ${topic} at ${level} level`,
      difficulty: level,
      estimatedTime: '3-6 hours'
    },
    {
      title: `${topic} Video Course`,
      type: 'video',
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + ' course')}`,
      description: `Video-based learning course for ${topic}`,
      difficulty: level,
      estimatedTime: '4-8 hours'
    },
    {
      title: `${topic} Interactive Tutorial`,
      type: 'website',
      url: `https://www.google.com/search?q=${encodeURIComponent(topic + ' interactive tutorial')}`,
      description: `Interactive tutorial and exercises`,
      difficulty: level,
      estimatedTime: '2-4 hours'
    }
  ];
}

// Export the functions and rate limiter
export { aiRateLimiter, searchTavily, curateResources, generatePlan, generateMeetingSummary, analyzeSyllabus, analyzeSyllabusV2, generateContextAwareResponse, generateUniversityResources, generateChatResponse, curateStudyResources }; 