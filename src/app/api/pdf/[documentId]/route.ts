import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Get PDF document
export async function GET(
  req: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    // Get the session token
    const token = await getToken({ 
      req,
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    const documentId = params.documentId;
    const userId = (token.id as string) || token.sub || '';
    const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 
      process.env.NODE_ENV === 'production' 
        ? 'https://focus-mentor.onrender.com'
        : 'http://localhost:8000';
    
    // Forward the request with user ID in headers
    const response = await fetch(`${apiUrl}/pdf/${documentId}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      },
    });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch PDF';
      try {
        const data = await response.json();
        errorMessage = data.error || data.message || errorMessage;
      } catch {
        const errorText = await response.text();
        if (errorText) {
          errorMessage = errorText;
        }
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Error fetching PDF:', err);
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || 'Failed to fetch PDF' },
      { status: 500 }
    );
  }
}

// Chat with PDF
export async function POST(
  req: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    // Get the session token
    const token = await getToken({ 
      req,
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const userId = (token.id as string) || token.sub || '';
    const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 
      process.env.NODE_ENV === 'production' 
        ? 'https://focus-mentor.onrender.com'
        : 'http://localhost:8000';
    
    const response = await fetch(
      `${apiUrl}/pdf/${params.documentId}/chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify({
          ...body,
          userId,
        }),
      }
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to process chat request');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Error in chat:', err);
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || 'Failed to process chat request' },
      { status: 500 }
    );
  }
} 