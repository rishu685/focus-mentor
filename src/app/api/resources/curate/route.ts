import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { subject, userId, difficulty, type } = await request.json();

    console.log('Frontend API: Received request with:', {
      subject,
      userId,
      difficulty,
      type,
      hasSubject: !!subject,
      hasUserId: !!userId,
      subjectType: typeof subject,
      userIdType: typeof userId
    });

    if (!subject || !userId) {
      console.log('Frontend API: Missing required fields:', { subject: !!subject, userId: !!userId });
      return NextResponse.json(
        { error: 'Subject and userId are required' },
        { status: 400 }
      );
    }

    // Forward to backend with syllabus priority
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 
      process.env.NODE_ENV === 'production' 
        ? 'https://focus-mentor.onrender.com'
        : 'http://localhost:8000';
    console.log('Frontend API: Backend URL being called:', `${backendUrl}/api/curate-resources`);
    
    // TEMPORARY DEBUG: Return mock data to test if frontend works
    if (subject.toLowerCase() === 'debug') {
      return NextResponse.json({
        success: true,
        resources: [
          {
            title: "Debug Resource",
            link: "https://example.com",
            type: "Test",
            description: "This is a debug resource",
            benefits: ["Testing the frontend"]
          }
        ],
        syllabusContext: null,
        message: "Debug resources returned successfully"
      });
    }

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

    const result = await backendResponse.json().catch(() => ({ error: 'Invalid JSON response' }));
    console.log('Backend response status:', backendResponse.status);
    console.log('Backend response data:', JSON.stringify(result, null, 2));

    if (backendResponse.ok) {
      return NextResponse.json({
        success: true,
        resources: result.resource?.resources || [], // Backend returns resource.resources
        syllabusContext: result.syllabusContext,
        message: result.message || 'Resources curated successfully'
      });
    } else {
      console.log('Backend error details:', result);
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to curate resources',
        backendStatus: backendResponse.status,
        backendError: result
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