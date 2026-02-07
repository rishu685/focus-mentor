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
        ? 'https://focus-mentor.onrender.com'
        : 'http://localhost:3001';
    console.log('Forwarding to:', `${backendUrl}/api/study-plan`);
    
    const backendResponse = await fetch(`${backendUrl}/api/study-plan`, {
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

    console.log('Backend response status:', backendResponse.status);
    console.log('Backend response headers:', Object.fromEntries(backendResponse.headers.entries()));

    // Check if response has content before parsing JSON
    const responseText = await backendResponse.text();
    console.log('Backend response text:', responseText);

    let result;
    try {
      // Only parse JSON if we have content
      if (responseText.trim()) {
        result = JSON.parse(responseText);
      } else {
        result = { 
          success: false, 
          error: 'Empty response from backend',
          message: 'Backend returned empty response'
        };
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      result = { 
        success: false, 
        error: 'Invalid JSON response from backend',
        message: `Backend returned invalid JSON: ${responseText.substring(0, 100)}`
      };
    }

    console.log('Parsed backend result:', { status: backendResponse.status, success: result.success, error: result.error });

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