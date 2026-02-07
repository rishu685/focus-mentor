import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 
  process.env.NODE_ENV === 'production' 
    ? 'https://focus-mentor-backend.onrender.com'
    : 'http://localhost:3001';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { resourceId: string } }
) {
  try {
    const { resourceId } = params;

    if (!resourceId) {
      return NextResponse.json(
        { success: false, error: 'Resource ID is required' },
        { status: 400 }
      );
    }

    // Forward delete request to backend
    const response = await fetch(`${BACKEND_URL}/curate-resources/${resourceId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

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