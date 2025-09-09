import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Test basic Groq API connection
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: 'Hello, can you respond with just "API connection successful"?'
          }
        ],
        model: 'llama3-8b-8192',
        temperature: 0.1,
        max_tokens: 50
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json({
        error: `Groq API error: ${response.status}`,
        details: errorData
      }, { status: response.status });
    }

    const aiResponse = await response.json();
    
    return NextResponse.json({
      success: true,
      response: aiResponse.choices[0].message.content,
      apiKey: process.env.GROQ_API_KEY ? 'Present' : 'Missing'
    });

  } catch (error) {
    console.error('Groq test error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to test Groq API',
        details: error instanceof Error ? error.message : 'Unknown error',
        apiKey: process.env.GROQ_API_KEY ? 'Present' : 'Missing'
      }, 
      { status: 500 }
    );
  }
}
