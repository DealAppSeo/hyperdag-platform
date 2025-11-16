/**
 * Test script for sending a new user registration notification email
 * 
 * This script simulates sending an admin notification when a new user registers.
 */

// Dynamically import the email service module
const importEmailService = async () => {
  return await import('./server/services/email-service.js');
};

// Test user details
const testUsername = 'TestUser' + Math.floor(Math.random() * 1000);
const testPersona = 'developer';
const testReferrer = 'Sean';

// Send the test notification
async function sendTestEmail() {
  console.log('Sending test notification for new user registration...');
  try {
    // Import the email service
    const emailService = await importEmailService();
    
    // Call the notification function
    const result = await emailService.sendAdminNewUserNotification(testUsername, testPersona, testReferrer);
    
    if (result) {
      console.log('✅ Test notification email sent successfully!');
    } else {
      console.error('❌ Failed to send test notification email.');
    }
  } catch (error) {
    console.error('❌ Error sending test notification:', error);
  }
}

// Execute the test
sendTestEmail();