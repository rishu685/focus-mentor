import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Debug endpoint - received data:', JSON.stringify(body, null, 2));
    
    return NextResponse.json({
      success: true,
      received: body,
      validation: {
        hasSubject: !!body.subject,
        hasUserId: !!body.userId,
        subjectType: typeof body.subject,
        userIdType: typeof body.userId,
        subjectValue: body.subject,
        userIdValue: body.userId
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}