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

    console.log('PDF Chat Request:', {
      documentId,
      userId,
      apiUrl,
      contentLength: JSON.stringify(body).length
    });

    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout

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

      console.log('PDF Chat Response Status:', response.status);

      if (!response.ok) {
        let backendError = 'Failed to process chat request';
        try {
          // Clone the response to safely check content type
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await response.json();
            backendError = error.error || error.message || backendError;
          } else {
            const errorText = await response.text();
            backendError = errorText || backendError;
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          backendError = `Error: ${response.status} ${response.statusText}`;
        }

        console.error('Backend error response:', {
          status: response.status,
          error: backendError
        });

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
        console.error('Request timeout - backend took too long to respond');
        return NextResponse.json(
          { error: 'Request timeout - PDF processing is taking longer than expected. Please try again.' },
          { status: 408 }
        );
      }
      
      console.error('Fetch error details:', {
        name: fetchError instanceof Error ? fetchError.name : 'Unknown',
        message: fetchError instanceof Error ? fetchError.message : String(fetchError)
      });
      
      throw fetchError;
    }
  } catch (error) {
    console.error('Error in PDF chat:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
} 