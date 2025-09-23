import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    // Allow non-authenticated users to test the feature
    if (!session?.user?.email) {
      console.log('No session found, proceeding with anonymous user');
    }

    const { message, context, personality, userName, chatHistory, conversationHistory } = await request.json();

    // Validate required fields
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    console.log('Processing study buddy request...');

    // Try Groq API first, fallback if it fails
    try {
      const historyToUse = chatHistory || conversationHistory || [];
      const groqResponse = await callGroqAPI(message, personality || 'encouraging', userName || 'Student', historyToUse);
      const messageType = determineMessageType(groqResponse, message);

      return NextResponse.json({
        content: groqResponse,
        messageType,
        updatedContext: context
      });
    } catch (groqError) {
      console.error('Groq API failed, using fallback:', groqError);
      
      // Use fallback response if Groq fails
      const fallbackResponse = generateFallbackResponse(message, personality || 'encouraging', userName || 'Student');
      const messageType = determineMessageType(fallbackResponse, message);

      return NextResponse.json({
        content: fallbackResponse,
        messageType,
        updatedContext: context
      });
    }

  } catch (error) {
    console.error('Study buddy API error:', error);
    return NextResponse.json(
      { error: 'Failed to get AI response' }, 
      { status: 500 }
    );
  }
}

async function callGroqAPI(message: string, personality: string, userName: string, conversationHistory: Array<{role: string, content: string}> = []): Promise<string> {
  // Check if this looks like an MCQ answer (single letter or short answer)
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

SPECIAL CONTEXT AWARENESS:
• Pay attention to the conversation history to understand context
• If user gives a single letter (A, B, C, D), treat it as an answer to a previous multiple choice question
• Always acknowledge MCQ answers appropriately and provide explanation
• Keep track of quiz progress and provide constructive feedback

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

  // Build conversation messages including history
  const messages = [
    { role: 'system', content: systemPrompt }
  ];

  // Add conversation history (limit to last 10 messages to avoid token limits)
  const recentHistory = conversationHistory.slice(-10);
  for (const historyItem of recentHistory) {
    if (historyItem.content && historyItem.role) {
      messages.push({
        role: historyItem.role === 'assistant' ? 'assistant' : 'user',
        content: historyItem.content
      });
    }
  }

  // Add current message with special handling for MCQ answers
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
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${errorData}`);
  }

  const data = await response.json();
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Invalid response format from Groq API');
  }

  return data.choices[0].message.content;
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
  
  // Generate contextual responses based on the message
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
  
  if (lowerMessage.includes('simplify') || lowerMessage.includes('explain')) {
    return `Absolutely! I love making complex topics easier to understand. 🧠✨

Here's my approach to simplifying concepts:

• **Break it down** into smaller, digestible pieces
• **Use analogies** and real-world examples
• **Focus on the main idea** first, then add details
• **Practice with examples** to reinforce understanding

What specific concept would you like me to explain in simpler terms? I'll make sure to use clear language and practical examples! 📚`;
  }
  
  if (lowerMessage.includes('practice') || lowerMessage.includes('problems')) {
    return `Perfect! Practice is key to mastering any subject! 💪📖

I can help you with:

• **Practice problems** tailored to your level
• **Step-by-step solutions** with explanations
• **Different difficulty levels** to challenge you progressively
• **Real-world applications** to make it relevant

Which subject or topic would you like to practice? Let me know your current level so I can create appropriate challenges for you! 🎯`;
  }
  
  if (lowerMessage.includes('math') || lowerMessage.includes('mathematics')) {
    return `Mathematics is such a fascinating subject! 🔢✨

I can help you with:
• Algebra and equations
• Calculus concepts
• Geometry problems
• Statistics and probability
• And much more!

What specific math topic are you working on? I'll explain it clearly and provide plenty of practice examples! 📊`;
  }
  
  if (lowerMessage.includes('science') || lowerMessage.includes('physics') || lowerMessage.includes('chemistry') || lowerMessage.includes('biology')) {
    return `Science is amazing! There's so much to discover and understand. 🔬🌟

Whether it's:
• Physics principles and formulas
• Chemistry reactions and concepts
• Biology processes and systems
• Scientific method and experiments

I'm here to help make it all clear and interesting! What scientific concept would you like to explore today? 🧪`;
  }

  if (lowerMessage.includes('react')) {
    return `Can you quiz me on the topic react?`;
  }
  
  // Default friendly response
  return `Hello ${userName || 'there'}! 👋 I'm excited to be your study buddy today!

I can help you with:
• 📚 **Explaining concepts** in simple terms
• 📝 **Creating practice questions** and quizzes
• 💡 **Providing study tips** and strategies
• 🎯 **Breaking down complex problems** step by step
• 💪 **Keeping you motivated** throughout your learning journey

What would you like to study or work on today? Just ask me anything, and I'll do my best to help you understand and succeed! ✨`;
}
