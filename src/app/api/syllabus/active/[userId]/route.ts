import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json({
        error: 'User ID is required'
      }, { status: 400 });
    }

    // Forward request to backend
    const backendUrl = process.env.EXPRESS_BACKEND_URL || 'http://backend:8000';
    const backendResponse = await fetch(`${backendUrl}/api/syllabus/active/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await backendResponse.json();

    if (backendResponse.ok) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json({
        error: result.error || 'No active syllabus found'
      }, { status: backendResponse.status });
    }

  } catch (error) {
    console.error('Fetch active syllabus error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}