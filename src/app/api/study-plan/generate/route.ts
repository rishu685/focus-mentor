import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { subject, examDate, userId, prioritizeSyllabus } = await request.json();

    console.log('Frontend API received:', { subject, examDate, userId, prioritizeSyllabus });

    if (!subject || !examDate || !userId) {
      return NextResponse.json(
        { error: 'Subject, examDate, and userId are required' },
        { status: 400 }
      );
    }

    // Forward to backend API
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 
      process.env.NODE_ENV === 'production' 
        ? 'https://focus-mentor-backend.onrender.com'
        : 'http://localhost:3001';
    console.log('Forwarding to:', `${backendUrl}/study-plan`);
    
    const backendResponse = await fetch(`${backendUrl}/study-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject,
        examDate,
        userId,
        prioritizeSyllabus: prioritizeSyllabus || false
      }),
    });

    const result = await backendResponse.json();
    console.log('Backend response:', { status: backendResponse.status, success: result.success, error: result.error });

    if (backendResponse.ok && result.success) {
      return NextResponse.json({
        success: true,
        plan: result.plan,
        syllabusContext: result.syllabusContext,
        message: result.message || 'Study plan generated successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to generate study plan',
        message: result.message || 'Unknown error occurred'
      }, { status: backendResponse.status || 500 });
    }

  } catch (error) {
    console.error('Frontend API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate study plan',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}