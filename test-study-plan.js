// Test script for study plan generation without syllabus

const testStudyPlan = async () => {
  try {
    console.log('Testing study plan generation without syllabus...');
    
    const response = await fetch('http://localhost:8000/api/study-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject: 'React',
        examDate: '2025-12-31',
        userId: 'test-user-123',
        prioritizeSyllabus: false
      }),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Study plan generated successfully!');
      console.log('Plan overview:', result.plan?.overview);
      console.log('Number of weekly plans:', result.plan?.weeklyPlans?.length || 0);
      console.log('Message:', result.message);
    } else {
      console.error('❌ Failed to generate study plan');
      console.error('Error:', result.error);
      console.error('Message:', result.message);
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
};

// Run if this file is executed directly
if (typeof window === 'undefined') {
  testStudyPlan();
}