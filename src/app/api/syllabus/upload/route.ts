import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Forward the request to the backend
    const backendFormData = new FormData();
    
    // Get all form fields
    const syllabusFile = formData.get('syllabusFile') as File;
    const userId = formData.get('userId') as string;
    const university = formData.get('university') as string;
    const course = formData.get('course') as string;
    const semester = formData.get('semester') as string;
    const year = formData.get('year') as string;

    // Append to backend form data
    if (syllabusFile) {
      backendFormData.append('syllabusFile', syllabusFile);
    }
    backendFormData.append('userId', userId);
    backendFormData.append('university', university);
    backendFormData.append('course', course);
    backendFormData.append('semester', semester || '');
    backendFormData.append('year', year || '');

    // Make request to backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 
      process.env.NODE_ENV === 'production' 
        ? 'https://focus-mentor.onrender.com'
        : 'http://localhost:3001';
    const backendResponse = await fetch(`${backendUrl}/api/syllabus/upload`, {
      method: 'POST',
      body: backendFormData,
    });

    const result = await backendResponse.json();

    if (backendResponse.ok) {
      return NextResponse.json({
        success: true,
        data: result,
        message: 'Syllabus uploaded successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Upload failed'
      }, { status: backendResponse.status });
    }

  } catch (error) {
    console.error('Syllabus upload error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}