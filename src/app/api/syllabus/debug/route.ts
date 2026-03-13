import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 
  process.env.NODE_ENV === 'production' 
    ? 'https://focus-mentor.onrender.com'
    : 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    console.log('DEBUG: Fetching syllabi for userId:', userId);

    // Fetch syllabi for user
    const response = await fetch(`${BACKEND_URL}/api/syllabus/user/${userId}`);
    const syllabi = await response.json();
    
    console.log('DEBUG: Found syllabi:', syllabi);
    
    return NextResponse.json({
      success: true,
      debug: true,
      userId: userId,
      syllabi: syllabi,
      count: Array.isArray(syllabi) ? syllabi.length : 0,
      backendUrl: BACKEND_URL
    });
  } catch (error) {
    console.error('Debug syllabus error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Debug failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { syllabusId, userId, forceDelete } = body;
    
    console.log('DEBUG DELETE: syllabusId:', syllabusId, 'userId:', userId, 'forceDelete:', forceDelete);
    
    if (forceDelete) {
      // Try to delete without userId constraint
      const response = await fetch(`${BACKEND_URL}/api/syllabus/debug/force-delete/${syllabusId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const result = await response.json();
      return NextResponse.json(result);
    }
    
    // Normal delete
    const response = await fetch(`${BACKEND_URL}/api/syllabus/${syllabusId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    const result = await response.json();
    console.log('DEBUG DELETE result:', result);
    
    return NextResponse.json({
      debug: true,
      syllabusId,
      userId,
      backendResponse: result,
      success: result.success || false
    });
  } catch (error) {
    console.error('Debug delete error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Debug delete failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}