import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { subject, userId, difficulty, type } = await request.json();

    if (!subject || !userId) {
      return NextResponse.json(
        { error: 'Subject and userId are required' },
        { status: 400 }
      );
    }

    // Forward to backend with syllabus priority
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 
      process.env.NODE_ENV === 'production' 
        ? 'https://focus-mentor.onrender.com'
        : 'http://localhost:3001';
    console.log('Forwarding resource request to:', `${backendUrl}/api/curate-resources`);
    
    const backendResponse = await fetch(`${backendUrl}/api/curate-resources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject,
        userId,
        difficulty: difficulty || 'intermediate',
        type: type || 'mixed',
        prioritizeSyllabus: true // Always prioritize syllabus content
      }),
    });

    const result = await backendResponse.json();
    console.log('Backend response:', JSON.stringify(result, null, 2));

    if (backendResponse.ok) {
      return NextResponse.json({
        success: true,
        resources: result.resource?.resources || [], // Backend returns resource.resources
        syllabusContext: result.syllabusContext,
        message: result.message || 'Resources curated successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to curate resources'
      }, { status: backendResponse.status });
    }

  } catch (error) {
    console.error('Resource curator API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to curate resources',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}