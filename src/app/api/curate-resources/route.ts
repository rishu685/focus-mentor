import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, level, resources, userId } = body;

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    // Forward request to backend server
    const backendUrl = process.env.EXPRESS_BACKEND_URL || 'http://backend:8000';
    console.log('Forwarding to backend:', `${backendUrl}/api/curate-resources`);

    const response = await fetch(`${backendUrl}/api/curate-resources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject: topic, // Map topic to subject for backend compatibility
        level,
        resources,
        userId
      })
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