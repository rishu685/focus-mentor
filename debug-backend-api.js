#!/usr/bin/env node

// Simple debug script to test the external backend API
async function testBackendAPI() {
  console.log('🔍 Testing the backend API...\n');

  const baseUrl = 'https://focus-mentor.onrender.com';
  
  try {
    // Test 1: Check if backend is responding
    console.log('1. Testing backend health...');
    const healthResponse = await fetch(`${baseUrl}/health`);
    console.log(`   Status: ${healthResponse.status}`);
    
    // Test 2: Check a user with known data
    console.log('\n2. Testing fetching plans for test user...');
    const testUserId = 'test-debug-user';
    const plansResponse = await fetch(`${baseUrl}/api/study-plan/${testUserId}`);
    const plansData = await plansResponse.json();
    console.log(`   Status: ${plansResponse.status}`);
    console.log(`   Plans found: ${plansData.plans?.length || 0}`);
    
    // Test 3: Try creating a plan (should fail with PLAN_EXISTS)
    console.log('\n3. Testing plan validation (should show PLAN_EXISTS)...');
    const createResponse = await fetch(`${baseUrl}/api/study-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: 'test subject',
        examDate: '2026-03-01',
        userId: testUserId,
        prioritizeSyllabus: false
      })
    });
    const createData = await createResponse.json();
    console.log(`   Status: ${createResponse.status}`);
    console.log(`   Error: ${createData.error}`);
    console.log(`   Message: ${createData.message}`);
    
    // Test 4: Test with a different subject (should show PLAN_EXISTS for 'react')
    console.log('\n4. Testing with "react" subject...');
    const reactResponse = await fetch(`${baseUrl}/api/study-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: 'react',
        examDate: '2026-03-01',
        userId: 'your-real-user-id', // Replace with actual user ID from session
        prioritizeSyllabus: false
      })
    });
    const reactData = await reactResponse.json();
    console.log(`   Status: ${reactResponse.status}`);
    console.log(`   Error: ${reactData.error}`);
    console.log(`   Message: ${reactData.message}`);
    
    console.log('\n✅ Backend API test completed!');
    console.log('\n💡 Next steps:');
    console.log('   1. Make sure you are signed in to the application');
    console.log('   2. Replace "your-real-user-id" with your actual user ID from the session');
    console.log('   3. Check the browser console for authentication status');
    
  } catch (error) {
    console.error('❌ Backend API test failed:', error.message);
  }
}

// Run the test
testBackendAPI();