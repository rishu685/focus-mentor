#!/usr/bin/env node

/**
 * Test script to check if the meeting room backend is working
 */

async function testBackendConnection() {
  const backendUrls = [
    'http://localhost:8000',
    'https://focus-mentor-backend.onrender.com'
  ];

  console.log('🧪 Testing backend connection...\n');

  for (const url of backendUrls) {
    console.log(`Testing: ${url}`);
    try {
      // Test health endpoint
      const healthResponse = await fetch(`${url}/health`);
      console.log(`  ✅ Health check: ${healthResponse.status}`);
      
      if (healthResponse.ok) {
        const health = await healthResponse.json();
        console.log(`  📊 Status: ${health.status} - ${health.message}`);
      }

      // Test meeting rooms endpoint
      const meetingResponse = await fetch(`${url}/api/meeting-rooms`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      console.log(`  🏠 Meeting rooms: ${meetingResponse.status}`);

      if (meetingResponse.ok) {
        console.log(`  ✅ Meeting rooms endpoint is accessible`);
      } else {
        console.log(`  ❌ Meeting rooms endpoint failed`);
      }

    } catch (error) {
      console.log(`  ❌ Connection failed: ${error.message}`);
    }
    console.log('');
  }
}

async function testMeetingRoomCreation() {
  const backendUrl = 'http://localhost:8000';
  console.log('🚀 Testing meeting room creation...\n');

  try {
    const response = await fetch(`${backendUrl}/api/meeting-rooms/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Meeting Room',
        description: 'Test meeting room for debugging',
        createdBy: 'test-user-123',
        hostName: 'Test Host',
        maxParticipants: 5,
        settings: {
          allowChat: true,
          allowScreenShare: true,
          recordMeeting: false,
          requireApproval: false
        }
      })
    });

    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Meeting room created successfully!');
      console.log(`Room ID: ${data.data.roomId}`);
      console.log(`Room URL: ${data.roomUrl}`);
    } else {
      const error = await response.text();
      console.log('❌ Failed to create meeting room:');
      console.log(error);
    }
  } catch (error) {
    console.log('❌ Error testing meeting room creation:', error.message);
  }
}

// Run tests
testBackendConnection().then(() => {
  console.log('📝 If the local server (port 8000) is not running, start it with: npm run dev:server\n');
  
  // Only test creation if we can connect to localhost
  testMeetingRoomCreation();
});