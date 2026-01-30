import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const backendUrl = process.env.EXPRESS_BACKEND_URL || 'http://backend:8000';
    const response = await fetch(`${backendUrl}/api/curate-resources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Resources generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate resources' },
      { status: 500 }
    );
  }
}