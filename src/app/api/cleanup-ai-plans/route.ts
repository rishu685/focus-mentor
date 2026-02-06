import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId is required' },
        { status: 400 }
      );
    }

    console.log('Cleaning up AI plans for user:', userId);

    // Forward to backend cleanup endpoint
    const backendUrl = process.env.EXPRESS_BACKEND_URL || 'https://focus-mentor.onrender.com';
    console.log('Forwarding cleanup request to:', `${backendUrl}/api/study-plan/cleanup/${encodeURIComponent(userId)}`);
    
    const backendResponse = await fetch(`${backendUrl}/api/study-plan/cleanup/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await backendResponse.json();
    console.log('Backend cleanup response:', { status: backendResponse.status, result });

    if (backendResponse.ok && result.success) {
      return NextResponse.json({
        success: true,
        message: result.message || 'AI plans cleaned up successfully',
        deletedCount: result.deletedCount
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to cleanup AI plans',
        message: result.message || 'Unknown error occurred'
      }, { status: backendResponse.status || 500 });
    }

  } catch (error: any) {
    console.error('Error in cleanup API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error.message
    }, { status: 500 });
  }
}