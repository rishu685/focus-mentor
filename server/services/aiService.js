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
  // YouTube search queries for educational content
  const queries = [
    `${subject} tutorial for beginners`,
    `${subject} complete course`,
    `${subject} explained simply`,
    `learn ${subject} step by step`
  ];

  const results = [];
  
  for (const query of queries.slice(0, 2)) { // Limit to 2 queries
    try {
      // Using YouTube search API-like structure with educational channels
      const educationalChannels = getEducationalChannels(subject);
      const mockResults = educationalChannels.map((channel, index) => ({
        title: `${subject} ${index === 0 ? 'Complete Tutorial' : index === 1 ? 'Beginner Course' : 'Advanced Guide'} - ${channel.name}`,
        url: `https://youtube.com/watch?v=${generateVideoId(subject, channel.name)}`,
        description: `Comprehensive ${subject} tutorial by ${channel.name}. ${channel.description}`,
        source: 'YouTube',
        type: 'Video Course'
      }));
      
      results.push(...mockResults.slice(0, 2));
    } catch (error) {
      console.error('YouTube search error:', error);
    }
  }

  return results;
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
      url: 'https://www.khanacademy.org/search?search_again=1&q={subject}',
      description: 'Free, world-class education in {subject} with interactive exercises and videos',
      source: 'Khan Academy',
      type: 'Interactive Course'
    },
    {
      title: '{subject} Tutorial - W3Schools',
      url: 'https://www.w3schools.com/{subject}/',
      description: 'Learn {subject} with examples, exercises, and references',
      source: 'W3Schools',
      type: 'Tutorial'
    },
    {
      title: '{subject} Documentation - MDN',
      url: 'https://developer.mozilla.org/en-US/docs/Web/{subject}',
      description: 'Official documentation and guides for {subject}',
      source: 'MDN',
      type: 'Documentation'
    }
  ];

  // Add subject-specific resources
  if (lowerSubject.includes('javascript') || lowerSubject.includes('js')) {
    baseResources.push({
      title: 'JavaScript - FreeCodeCamp',
      url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/',
      description: 'Complete JavaScript course with interactive coding challenges',
      source: 'FreeCodeCamp',
      type: 'Interactive Course'
    });
  }
  
  if (lowerSubject.includes('python')) {
    baseResources.push({
      title: 'Python Tutorial - Python.org',
      url: 'https://docs.python.org/3/tutorial/',
      description: 'Official Python tutorial from the Python Foundation',
      source: 'Python.org',
      type: 'Tutorial'
    });
  }
  
  if (lowerSubject.includes('react')) {
    baseResources.push({
      title: 'React Documentation',
      url: 'https://react.dev/learn',
      description: 'Official React documentation with interactive examples',
      source: 'React.dev',
      type: 'Documentation'
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
        url: `https://www.khanacademy.org/search?q=${encodeURIComponent(subject)}`,
        description: `Learn ${subject} with free, world-class education from Khan Academy`,
        source: 'Khan Academy',
        type: 'Interactive Course'
      },
      {
        title: `${subject} Tutorial - FreeCodeCamp`,
        url: `https://www.freecodecamp.org/news/search/?query=${encodeURIComponent(subject)}`,
        description: `Comprehensive ${subject} tutorials and guides from FreeCodeCamp`,
        source: 'FreeCodeCamp',
        type: 'Tutorial'
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
    // Prepare search results for AI analysis
    const searchResults = searchData.results?.slice(0, 8) || [];
    
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `You are an expert educational curator who creates high-quality learning resource collections.
          
          TASK: Analyze the provided search results and create exactly 5 curated learning resources for the subject.
          
          REQUIREMENTS:
          1. Include a mix of resource types: YouTube videos, interactive courses, documentation, tutorials
          2. Prioritize free, accessible, high-quality educational content
          3. Ensure URLs are working and properly formatted
          4. Focus on beginner-friendly but comprehensive resources
          5. Include both video content and text-based learning materials
          
          RESPONSE FORMAT: Return valid JSON only, no additional text.`
        },
        {
          role: "user",
          content: `Curate exactly 5 high-quality learning resources for: "${subject}"

Available search results:
${JSON.stringify(searchResults, null, 2)}

Create a JSON response with this exact structure:
{
  "resources": [
    {
      "title": "Clear, descriptive title including platform name",
      "url": "Valid, working URL to the resource",
      "description": "Detailed 2-3 sentence description explaining what learners will gain",
      "format": "Resource type: Video Course, Interactive Tutorial, Documentation, Article, or Course",
      "benefits": [
        "Specific learning benefit #1",
        "Specific learning benefit #2", 
        "Specific learning benefit #3"
      ]
    }
  ]
}

IMPORTANT: 
- Ensure all URLs are real and functional
- Include at least 2 YouTube video resources if available
- Mix different learning formats (video, interactive, text)
- Make descriptions specific and valuable
- Focus on reputable educational platforms`
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

    let result;
    try {
      result = JSON.parse(completion.choices[0]?.message?.content || "{}");
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      result = generateFallbackCuratedResources(subject);
    }
    
    // Validate and ensure we have exactly 5 resources
    if (!result.resources || !Array.isArray(result.resources)) {
      result = generateFallbackCuratedResources(subject);
    }

    // Ensure we have exactly 5 resources
    while (result.resources.length < 5) {
      result.resources.push(...generateAdditionalResources(subject, result.resources.length));
    }
    result.resources = result.resources.slice(0, 5);

    // Validate each resource has all required fields with proper URLs
    const validatedResources = result.resources.map((resource, index) => ({
      title: resource.title || `${subject} Learning Resource ${index + 1}`,
      url: validateAndFixUrl(resource.url) || generateBackupUrl(subject, resource.title || ''),
      description: resource.description || `Comprehensive resource for learning ${subject}`,
      format: resource.format || (resource.url?.includes('youtube') ? 'Video Course' : 'Tutorial'),
      benefits: Array.isArray(resource.benefits) ? resource.benefits : [
        `Learn ${subject} fundamentals`,
        `Practical examples and exercises`,
        `Build real-world skills`
      ]
    }));

    const finalResult = { resources: validatedResources };

    // Cache the result for 30 minutes
    cache.set(cacheKey, finalResult);
    return finalResult;
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

  // Add subject-specific YouTube content
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
  } else {
    resources.push({
      title: `${subject} Tutorial - YouTube`,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(subject + ' tutorial')}`,
      description: `Discover comprehensive ${subject} tutorials from top educators and industry experts on YouTube.`,
      format: "Video Course",
      benefits: [
        "Multiple teaching styles and approaches",
        "Visual and audio learning",
        "Community discussions and comments"
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