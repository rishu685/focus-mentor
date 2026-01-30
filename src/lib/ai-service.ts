// Server-side AI service utilities
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function generateContextAwareResponse(message: string, userContext: {
  userId: string;
  userName?: string | null;
  university?: string;
  course?: string;
  syllabusContent?: string;
}) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/study-buddy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        userContext
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    return result.response || result.message || "I'm here to help with your studies!";
  } catch (error) {
    console.error('Error calling AI service:', error);
    return "I'm experiencing some technical difficulties. Please try again.";
  }
}

export async function getUserSyllabusContext(userId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/syllabus/active/${userId}`);
    
    if (response.ok) {
      const syllabus = await response.json();
      return syllabus;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching syllabus context:', error);
    return null;
  }
}