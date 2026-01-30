// Client-side utility functions for syllabus operations
export async function getUserSyllabusContext(userId: string) {
  try {
    const response = await fetch(`/api/syllabus/active/${userId}`);
    
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

export async function generateContextAwareResponse(message: string, userContext: {
  userId: string;
  userName?: string | null;
  university?: string;
  course?: string;
  syllabusContent?: string;
}) {
  try {
    const response = await fetch('/api/study-buddy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        ...userContext
      }),
    });

    const result = await response.json();
    
    if (result.success) {
      return result.response;
    } else {
      throw new Error(result.error || 'Failed to generate response');
    }
  } catch (error) {
    console.error('Error generating context-aware response:', error);
    throw error;
  }
}

export async function generateSyllabusBasedResources(
  userId: string,
  subject: string,
  limit: number = 10
) {
  try {
    const response = await fetch('/api/syllabus/resources', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        subject,
        limit,
      }),
    });

    const result = await response.json();
    
    if (result.success) {
      return result;
    } else {
      throw new Error(result.error || 'Failed to generate syllabus-based resources');
    }
  } catch (error) {
    console.error('Error generating syllabus-based resources:', error);
    throw error;
  }
}