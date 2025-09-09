import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function GET() {
  try {
    const session = await getServerSession();
    
    // Allow non-authenticated users with default context
    if (!session?.user?.email) {
      console.log('No session found, returning default study context');
    }

    // Return default context for testing
    const studyContext = {
      currentSubject: 'General Study',
      studyGoals: ['Improve understanding', 'Prepare for exams'],
      learningStyle: 'visual',
      currentTopic: 'Various topics',
      difficultyLevel: 5,
      timeAvailable: 60
    };

    return NextResponse.json(studyContext);

  } catch (error) {
    console.error('Error fetching study context:', error);
    // Return default context if there's an error
    return NextResponse.json({
      currentSubject: 'General Study',
      studyGoals: ['Improve understanding', 'Prepare for exams'],
      learningStyle: 'visual',
      currentTopic: 'Various topics',
      difficultyLevel: 5,
      timeAvailable: 60
    });
  }
}


