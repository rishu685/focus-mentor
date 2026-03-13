import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

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
      (process.env.NODE_ENV === 'production'
        ? 'https://focus-mentor.onrender.com'
        : 'http://localhost:8000');
    
    const response = await fetch(`${apiUrl}/pdf/${documentId}/history`, {
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      },
    });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch chat history';
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
    console.error('Error fetching chat history:', err);
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || 'Error retrieving chat history' },
      { status: 500 }
    );
  }
} 