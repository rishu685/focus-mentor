import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    if (!params.roomId) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      );
    }

    // Forward request to backend
    const backendUrl = process.env.EXPRESS_BACKEND_URL || 'http://backend:8000';
    const response = await fetch(`${backendUrl}/api/meeting-rooms/${params.roomId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json(
        { error: errorData.message || 'Failed to fetch meeting room' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data.data || data, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
      }
    });
  } catch (error) {
    console.error('Error fetching meeting room:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}