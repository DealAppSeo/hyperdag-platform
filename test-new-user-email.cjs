/**
 * Test New User Registration Email
 * 
 * This script simulates sending an admin notification when a new user signs up.
 * It directly uses the sendAdminNewUserNotification function from email-service.
 */

// Use CommonJS format for compatibility
const { sendAdminNewUserNotification } = require('./server/services/email-service');

async function testNewUserNotification() {
  console.log('🚀 Sending test notification for new user registration...');
  
  try {
    // Simulate a new user registration
    const username = 'test_user_' + Math.floor(Math.random() * 1000);
    const persona = 'Developer';
    const referrer = null;

    console.log(`Test data: Username: ${username}, Persona: ${persona}`);
    
    // Send the admin notification
    const result = await sendAdminNewUserNotification(username, persona, referrer);
    
    if (result) {
      console.log('✅ Admin notification sent successfully!');
      console.log('The email was sent to the admin email (dealappseo@gmail.com)');
      console.log('Check your inbox for the notification.');
    } else {
      console.error('❌ Failed to send admin notification');
      console.log('Check the email service configuration:');
      console.log(`- Mailgun Domain: ${process.env.MAILGUN_DOMAIN || 'Not set'}`);
      console.log(`- Mailgun API Key: ${process.env.MAILGUN_API_KEY ? 'Set' : 'Not set'}`);
      console.log(`- SendGrid API Key: ${process.env.SENDGRID_API_KEY ? 'Set' : 'Not set'}`);
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

// Run the test
testNewUserNotification();