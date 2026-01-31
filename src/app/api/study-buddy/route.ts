import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function POST(request: NextRequest) {
  console.log('🚀 API Route: study-buddy POST called');
  
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    console.log('🔑 Checking GROQ API key...');
    // Check if GROQ API key is available
    if (!process.env.GROQ_API_KEY) {
      console.error('❌ GROQ_API_KEY is not set');
      const fallbackResponse = generateFallbackResponse('Hello', 'encouraging', 'Student');
      return NextResponse.json({
        content: fallbackResponse,
        response: fallbackResponse,
        messageType: 'explanation',
        success: true,
        fallbackUsed: true
      }, { headers });
    }
    console.log('✅ GROQ_API_KEY is available');

    console.log('👤 Getting session...');
    const session = await getServerSession();
    console.log('Session:', session?.user?.name || 'Anonymous');
    
    console.log('📦 Parsing request body...');
    const body = await request.json();
    console.log('Request body keys:', Object.keys(body));
    console.log('Message:', body.message?.substring(0, 100));
    
    const { message, sessionId, userId, personality, userName, chatHistory, conversationHistory } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      const fallbackResponse = generateFallbackResponse('Hello', personality || 'encouraging', userName || session?.user?.name || 'Student');
      return NextResponse.json(
        { 
          content: fallbackResponse,
          response: fallbackResponse,
          messageType: 'explanation',
          success: true,
          error: 'Message was empty - showing welcome message'
        },
        { status: 200, headers }
      );
    }

    console.log('Processing study buddy request with Groq API...');

    // Use frontend AI route directly
    try {
      const historyToUse = chatHistory || conversationHistory || [];
      const groqResponse = await callGroqAPI(message, personality || 'encouraging', userName || session?.user?.name || 'Student', historyToUse);
      const messageType = determineMessageType(groqResponse, message);

      return NextResponse.json({
        content: groqResponse,
        response: groqResponse,
        messageType,
        success: true
      }, { headers });
    } catch (groqError) {
      console.error('Groq API failed, using fallback:', groqError);
      
      // Use fallback response if Groq fails
      const fallbackResponse = generateFallbackResponse(message, personality || 'encouraging', userName || session?.user?.name || 'Student');
      const messageType = determineMessageType(fallbackResponse, message);

      return NextResponse.json({
        content: fallbackResponse,
        response: fallbackResponse,
        messageType,
        success: true,
        fallbackUsed: true
      }, { headers });
    }

  } catch (error) {
    console.error('Error in study-buddy API route:', error);
    
    // Return fallback response even on critical errors
    const fallbackResponse = generateFallbackResponse('Hello', 'encouraging', 'Student');
    
    return NextResponse.json(
      { 
        content: fallbackResponse,
        response: fallbackResponse,
        messageType: 'explanation',
        success: true,
        fallbackUsed: true,
        error: 'API temporarily unavailable'
      },
      { status: 200, headers }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

async function callGroqAPI(message: string, personality: string, userName: string, conversationHistory: Array<{role: string, content: string}> = []): Promise<string> {
  const isMCQAnswer = /^[A-Da-d]$/i.test(message.trim()) && conversationHistory.length > 0;
  
  const systemPrompt = `You are an AI Study Buddy named StudyBot helping ${userName}. You are an expert tutor across all academic subjects with a ${personality} personality.

CORE CAPABILITIES:
• Deep knowledge in: Mathematics, Science, Literature, History, Programming, Languages, Engineering, Medicine, Law, Arts
• Explain complex concepts using analogies, examples, and step-by-step breakdowns
• Create engaging practice questions, quizzes, and interactive exercises
• Provide personalized study strategies and learning techniques
• Offer motivation and study guidance
• Generate detailed solutions with explanations
• Adapt teaching style to different learning preferences

PERSONALITY: ${personality}
- Encouraging: Use positive reinforcement, celebrate progress, provide motivational quotes
- Challenging: Ask probing questions, encourage critical thinking, push for deeper analysis
- Patient: Take time for thorough explanations, repeat concepts differently, be understanding
- Analytical: Focus on logical reasoning, systematic approaches, data-driven insights

RESPONSE GUIDELINES:
1. Always be specific and actionable rather than generic
2. Use real-world examples and practical applications
3. Include emojis and formatting to make responses engaging
4. When explaining concepts, use the "Explain-Example-Practice" structure
5. For math/science: Show step-by-step solutions
6. For languages: Provide grammar rules with examples
7. For coding: Include code snippets with explanations
8. For MCQ answers: Always explain why the answer is correct/incorrect and provide learning points
9. Always end with a follow-up question or next step

Remember: Be genuinely helpful, not just friendly. Provide value in every response!`;

  const messages = [
    { role: 'system', content: systemPrompt }
  ];

  const recentHistory = conversationHistory.slice(-10);
  for (const historyItem of recentHistory) {
    if (historyItem.content && historyItem.role) {
      messages.push({
        role: historyItem.role === 'assistant' ? 'assistant' : 'user',
        content: historyItem.content
      });
    }
  }

  if (isMCQAnswer) {
    messages.push({
      role: 'user',
      content: `My answer is: ${message}. Please tell me if this is correct and explain why.`
    });
  } else {
    messages.push({
      role: 'user',
      content: message
    });
  }

  // Create an AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: messages,
        max_tokens: 800,
        temperature: 0.8
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from Groq API');
    }

    return data.choices[0].message.content;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

function determineMessageType(content: string, userMessage: string): string {
  const lowerContent = content.toLowerCase();
  const lowerUserMessage = userMessage.toLowerCase();
  
  if (lowerUserMessage.includes('quiz') || lowerUserMessage.includes('test') || lowerUserMessage.includes('question')) {
    return 'quiz';
  }
  
  if (lowerContent.includes('great job') || lowerContent.includes('excellent') || lowerContent.includes('keep up')) {
    return 'encouragement';
  }
  
  if (lowerUserMessage.includes('help') || lowerUserMessage.includes('stuck') || lowerUserMessage.includes('confused')) {
    return 'explanation';
  }
  
  return 'explanation';
}

function generateFallbackResponse(message: string, personality: string, userName: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('quiz') || lowerMessage.includes('test')) {
    return `Great question! I'd love to create a quiz for you. Here's a practice question based on what you're studying:

**Question**: What is the main concept you'd like me to focus on for this quiz?

Please let me know the specific topic, and I'll create some challenging practice questions to help you prepare! 📝✨`;
  }
  
  if (lowerMessage.includes('stuck') || lowerMessage.includes('help') || lowerMessage.includes('confused')) {
    return `I understand you're feeling stuck, ${userName || 'friend'}! That's completely normal when learning something new. 😊

Let's break this down step by step:

1. **First**, tell me specifically what concept or problem is giving you trouble
2. **Then**, I'll explain it in a simpler way
3. **Finally**, we'll practice with some examples

Remember, every expert was once a beginner! What specific part would you like me to help clarify? 🤔💡`;
  }
  
  return `Hello ${userName || 'there'}! 👋 I'm excited to be your study buddy today!

I can help you with:
• 📚 **Explaining concepts** in simple terms
• 📝 **Creating practice questions** and quizzes
• 💡 **Providing study tips** and strategies
• 🎯 **Breaking down complex problems** step by step
• 💪 **Keeping you motivated** throughout your learning journey

What would you like to study or work on today? Just ask me anything, and I'll do my best to help you understand and succeed! ✨`;
}