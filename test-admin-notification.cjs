/**
 * Test admin notification for new user registration
 * 
 * This script tests sending admin notifications when a new user registers on HyperDAG.
 * It directly calls the notification service to send an email to the admin.
 */

const axios = require('axios');

async function testAdminNotification() {
  console.log('🚀 Sending test notification for new user registration...');
  
  try {
    // Generate random test data
    const username = 'test_user_' + Math.floor(Math.random() * 1000);
    const persona = 'Developer';
    
    console.log(`Test data: Username: ${username}, Persona: ${persona}`);
    
    // Call the admin notification API
    const response = await axios.post('http://localhost:5000/api/admin/test-notification', {
      username,
      persona,
      emailType: 'new_user'
    });
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Admin notification sent successfully!');
      console.log('The email was sent to the admin email (dealappseo@gmail.com)');
      console.log('Check your inbox for the notification.');
    } else {
      console.error('❌ Failed to send admin notification:', response.data.message || 'Unknown error');
    }
  } catch (error) {
    console.error('Error sending notification:', error.response?.data?.message || error.message);
    console.log('Check if the server is running and the /api/admin/test-notification endpoint is available.');
  }
}

// Run the test
testAdminNotification();