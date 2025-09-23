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

async function generatePlan(subject, userId, examDate) {
  // Cache key for study plan
  const cacheKey = `plan_${subject}_${examDate}`;
  
  // Check cache first
  const cachedResult = cache.get(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }

  // Calculate days until exam
  const daysUntilExam = Math.ceil(
    (new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24)
  );

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are an expert study planner who creates detailed and effective study plans. Always respond in JSON format."
        },
        {
          role: "user",
          content: `Create a detailed study plan for ${subject} with ${daysUntilExam} days until the exam on ${examDate}.
          
          Return the response in this exact JSON format:
          {
            "overview": {
              "subject": "${subject}",
              "duration": "${daysUntilExam} days",
              "examDate": "${examDate}"
            },
            "weeklyPlans": [
              {
                "week": "Week 1",
                "goals": ["Goal 1", "Goal 2"],
                "dailyTasks": [
                  {
                    "day": "YYYY-MM-DD (Day X)",
                    "tasks": ["Task 1", "Task 2"],
                    "duration": "X hours"
                  }
                ]
              }
            ],
            "recommendations": ["Tip 1", "Tip 2"]
          }`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      top_p: 1,
      stream: false,
      response_format: { type: "json_object" }
    });

    const parsedPlan = JSON.parse(completion.choices[0]?.message?.content || "{}");
    
    // Validate the required fields
    if (!parsedPlan.overview || !parsedPlan.weeklyPlans || !parsedPlan.recommendations) {
      throw new Error('Missing required fields in plan structure');
    }
    
    // Create a new StudyPlan instance
    const plan = new StudyPlan({
      userId,
      overview: {
        subject: parsedPlan.overview.subject,
        duration: parsedPlan.overview.duration,
        examDate: parsedPlan.overview.examDate
      },
      weeklyPlans: parsedPlan.weeklyPlans.map(week => ({
        week: week.week,
        goals: week.goals,
        dailyTasks: week.dailyTasks.map(task => ({
          day: task.day,
          tasks: task.tasks,
          duration: task.duration
        }))
      })),
      recommendations: parsedPlan.recommendations,
      isActive: true,
      progress: 0,
      lastUpdated: new Date()
    });

    cache.set(cacheKey, plan);
    return plan;
  } catch (error) {
    console.error('Groq error:', error);
    if (error.status === 429 || error.status === 413) {
      const retryAfter = error.headers?.['retry-after'] || 60;
      throw {
        status: error.status,
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter
      };
    }
    throw error;
  }
}

// Export the functions and rate limiter
export { aiRateLimiter, searchTavily, curateResources, generatePlan }; 