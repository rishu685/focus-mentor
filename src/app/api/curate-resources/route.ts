import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, level, resources, userId, subject, difficulty, type, prioritizeSyllabus } = body;

    // Support both old (topic) and new (subject) parameter names
    const resourceSubject = subject || topic;
    
    if (!resourceSubject) {
      return NextResponse.json(
        { error: 'Subject/topic is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId is required' },
        { status: 400 }
      );
    }

    // Forward request to backend server
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 
      process.env.NODE_ENV === 'production' 
        ? 'https://focus-mentor-backend.onrender.com'
        : 'http://localhost:3001';
    console.log('Forwarding to backend:', `${backendUrl}/curate-resources`);

    const response = await fetch(`${backendUrl}/curate-resources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject: resourceSubject,
        level: level || difficulty,
        resources,
        userId,
        difficulty: difficulty || level,
        type: type || 'mixed',
        prioritizeSyllabus: prioritizeSyllabus || false
      })
    });
    });

    if (!response.ok) {
      console.error('Backend response not ok:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Backend error response:', errorText);
      return NextResponse.json(
        { error: 'Failed to curate resources', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in curate-resources API route:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to curate resources. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}