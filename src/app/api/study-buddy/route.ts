import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId, userId } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Forward request to backend server
    const backendUrl = process.env.EXPRESS_BACKEND_URL || 'http://backend:8000';
    console.log('Forwarding to backend:', `${backendUrl}/api/chat`);

    const response = await fetch(`${backendUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        sessionId,
        userId
      })
    });

    if (!response.ok) {
      console.error('Backend response not ok:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Backend error response:', errorText);
      return NextResponse.json(
        { error: 'Failed to get response from AI service', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in study-buddy API route:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to process your request. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}