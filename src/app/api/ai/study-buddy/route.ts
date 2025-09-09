import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    // Allow non-authenticated users to test the feature
    if (!session?.user?.email) {
      console.log('No session found, proceeding with anonymous user');
    }

    const { message, context, personality, chatHistory, userName } = await request.json();

    // Validate required fields
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    console.log('Processing study buddy request...');

    // For now, use intelligent fallback responses while we debug Groq
    const fallbackResponse = generateFallbackResponse(message, personality || 'encouraging', userName || 'Student');
    const messageType = determineMessageType(fallbackResponse, message);

    return NextResponse.json({
      content: fallbackResponse,
      messageType,
      updatedContext: context
    });

  } catch (error) {
    console.error('Study buddy API error:', error);
    return NextResponse.json(
      { error: 'Failed to get AI response' }, 
      { status: 500 }
    );
  }
}

function createSystemPrompt(personality: string, context: any, userName: string): string {
  return `You are an AI Study Buddy helping ${userName || 'a student'}. You are knowledgeable, helpful, and ${personality}.

Your role:
- Answer academic questions clearly
- Explain concepts in simple terms  
- Provide study tips and motivation
- Create practice questions when asked
- Be supportive and encouraging

Respond in a friendly, conversational way that helps the student learn effectively.`;
}

function formatChatHistory(chatHistory: any[]): any[] {
  if (!chatHistory || chatHistory.length === 0) return [];
  
  return chatHistory.slice(-6).map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content
  }));
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
