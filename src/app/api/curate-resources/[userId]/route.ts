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
    const rawBackendUrl = process.env.EXPRESS_BACKEND_URL || 'https://focus-mentor.onrender.com';
    const backendUrl = rawBackendUrl.trim().replace(/\s+/g, '');
    console.log('Frontend API: Raw backend URL:', JSON.stringify(rawBackendUrl));
    console.log('Frontend API: Cleaned backend URL:', JSON.stringify(backendUrl));
    console.log('Frontend API: Full URL:', `${backendUrl}/api/curate-resources/${params.userId}`);

    // Test basic connectivity first
    console.log('Frontend API: Testing basic connectivity to backend...');
    try {
      const healthResponse = await fetch(`${backendUrl}/health`, { 
        method: 'GET'
      });
      console.log('Frontend API: Health check status:', healthResponse.status);
    } catch (healthError) {
      console.log('Frontend API: Health check failed:', healthError.message);
    }

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