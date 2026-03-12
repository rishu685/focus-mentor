import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    // Forward request to backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 
      process.env.NODE_ENV === 'production' 
        ? 'https://focus-mentor.onrender.com'
        : 'http://localhost:8000';
    const backendResponse = await fetch(`${backendUrl}/api/syllabus/user/${userId}`, {
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
        success: false,
        error: result.error || 'Failed to fetch syllabi'
      }, { status: backendResponse.status });
    }

  } catch (error) {
    console.error('Fetch syllabi error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { syllabusId, userId } = body;

    if (!syllabusId || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Syllabus ID and User ID are required'
      }, { status: 400 });
    }

    // Forward request to backend
    const backendResponse = await fetch(`${backendUrl}/api/syllabus/${syllabusId}/activate`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    const result = await backendResponse.json();

    if (backendResponse.ok) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to activate syllabus'
      }, { status: backendResponse.status });
    }

  } catch (error) {
    console.error('Activate syllabus error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}