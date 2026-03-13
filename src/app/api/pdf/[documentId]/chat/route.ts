import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://focus-mentor.onrender.com'
    : 'http://localhost:8000');

export async function POST(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    const userId = (token?.id as string) || token?.sub;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - User ID is required' },
        { status: 401 }
      );
    }

    const { documentId } = params;
    const body = await request.json();

    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    try {
      const response = await fetch(`${apiUrl}/pdf/${documentId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let backendError = 'Failed to process chat request';
        try {
          const error = await response.json();
          backendError = error.error || error.message || backendError;
        } catch {
          const errorText = await response.text();
          if (errorText) {
            backendError = errorText;
          }
        }

        return NextResponse.json(
          { error: backendError },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timeout - PDF processing is taking longer than expected. Please try again.' },
          { status: 408 }
        );
      }
      
      throw fetchError;
    }
  } catch (error) {
    console.error('Error in PDF chat:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
} 