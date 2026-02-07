import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { planId: string } }
) {
  try {
    if (!params.planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    // Forward to backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 
      process.env.NODE_ENV === 'production' 
        ? 'https://focus-mentor.onrender.com'
        : 'http://localhost:3001';
    
    console.log('Deleting study plan with ID:', params.planId);
    console.log('Backend URL:', `${backendUrl}/api/study-plan/delete/${params.planId}`);
    
    const response = await fetch(`${backendUrl}/api/study-plan/delete/${params.planId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });

    console.log('Backend response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Failed to delete study plan:', response.status, errorData);
      return NextResponse.json(
        { error: errorData.message || 'Failed to delete study plan', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Study plan deleted successfully:', data);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error deleting study plan:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}