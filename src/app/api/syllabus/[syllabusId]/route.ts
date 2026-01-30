import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { syllabusId: string } }) {
  try {
    const { syllabusId } = params;

    if (!syllabusId) {
      return NextResponse.json({
        error: 'Syllabus ID is required'
      }, { status: 400 });
    }

    // Forward request to backend
    const backendUrl = process.env.EXPRESS_BACKEND_URL || 'http://backend:8000';
    const backendResponse = await fetch(`${backendUrl}/api/syllabus/${syllabusId}/analysis`, {
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
        error: result.error || 'Failed to fetch syllabus'
      }, { status: backendResponse.status });
    }

  } catch (error) {
    console.error('Fetch user syllabi error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { syllabusId: string } }) {
  try {
    const { syllabusId } = params;
    const body = await request.json();
    const { userId } = body;

    if (!syllabusId || !userId) {
      return NextResponse.json({
        error: 'Syllabus ID and User ID are required'
      }, { status: 400 });
    }

    // Forward request to backend
    const backendUrl = process.env.EXPRESS_BACKEND_URL || 'http://backend:8000';
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
        error: result.error || 'Failed to activate syllabus'
      }, { status: backendResponse.status });
    }

  } catch (error) {
    console.error('Activate syllabus error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { syllabusId: string } }) {
  try {
    const { syllabusId } = params;
    const body = await request.json();
    const { userId } = body;

    if (!syllabusId || !userId) {
      return NextResponse.json({
        error: 'Syllabus ID and User ID are required'
      }, { status: 400 });
    }

    // Forward request to backend
    const backendUrl = process.env.EXPRESS_BACKEND_URL || 'http://backend:8000';
    const backendResponse = await fetch(`${backendUrl}/api/syllabus/${syllabusId}`, {
      method: 'DELETE',
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
        error: result.error || 'Failed to delete syllabus'
      }, { status: backendResponse.status });
    }

  } catch (error) {
    console.error('Delete syllabus error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}