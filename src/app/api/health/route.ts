import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ||
      (process.env.NODE_ENV === 'production'
        ? 'https://focus-mentor.onrender.com'
        : 'http://localhost:8000');

    console.log('Checking backend health:', backendUrl);

    const backendResponse = await fetch(`${backendUrl}/health`, {
      timeout: 10000,
    });

    if (backendResponse.ok) {
      const data = await backendResponse.json();
      return NextResponse.json({
        status: 'healthy',
        frontend: 'ok',
        backend: 'ok',
        backendUrl,
        details: data
      });
    } else {
      return NextResponse.json({
        status: 'unhealthy',
        frontend: 'ok',
        backend: 'error',
        backendUrl,
        backendStatus: backendResponse.status,
        message: `Backend returned ${backendResponse.status}`
      }, { status: 503 });
    }
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({
      status: 'unhealthy',
      frontend: 'ok',
      backend: 'unreachable',
      error: error instanceof Error ? error.message : String(error),
      message: 'Cannot reach backend server'
    }, { status: 503 });
  }
}
