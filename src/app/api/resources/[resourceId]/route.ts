import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 
  process.env.NODE_ENV === 'production' 
    ? 'https://focus-mentor.onrender.com'
    : 'http://localhost:3001';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { resourceId: string } }
) {
  try {
    const { resourceId } = params;
    console.log('DELETE request received for resourceId:', resourceId);

    if (!resourceId) {
      return NextResponse.json(
        { success: false, error: 'Resource ID is required' },
        { status: 400 }
      );
    }

    // Forward delete request to backend
    const backendUrl = `${BACKEND_URL}/api/curate-resources/${resourceId}`;
    console.log('Forwarding delete request to:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Backend response status:', response.status);
    console.log('Backend response headers:', Object.fromEntries(response.headers.entries()));

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError);
      data = { 
        success: false, 
        error: 'Invalid response format from backend' 
      };
    }

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error deleting resource:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete resource',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}