import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    if (!params.userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Forward to backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 
      process.env.NODE_ENV === 'production' 
        ? 'https://focus-mentor.onrender.com'
        : 'http://localhost:3001';
    console.log('Frontend API: Backend URL:', backendUrl);
    console.log('Frontend API: Full URL:', `${backendUrl}/api/curate-resources/${params.userId}`);

    const response = await fetch(`${backendUrl}/api/curate-resources/${params.userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'NextJS-Frontend',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });
    console.log('Frontend API: Response status', response.status);
    console.log('Frontend API: Response headers', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.log('Frontend API: Backend error response', response.status, errorData);
      return NextResponse.json(
        { error: errorData.message || 'Failed to fetch curated resources' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Frontend API: Full backend response:', JSON.stringify(data, null, 2));
    console.log('Frontend API: Resources array length:', data.resources?.length);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching curated resources:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}