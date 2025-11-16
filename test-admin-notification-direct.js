/**
 * Direct test for admin notification email
 * 
 * This script bypasses the notification service and directly uses the email service
 * to send an admin notification about a new user registration.
 * 
 * Usage: node test-admin-notification-direct.js
 */

// Import the email service
const emailService = require('./server/services/email-service');

async function testAdminNotification() {
  console.log('🚀 Starting admin notification test...');
  
  try {
    // Generate test data
    const username = 'test_user_' + Math.floor(Math.random() * 1000);
    const persona = 'Developer';
    
    console.log(`Sending notification for test user: ${username} (${persona})`);
    
    // Send the notification directly
    const result = await emailService.sendAdminNewUserNotification(username, persona);
    
    if (result) {
      console.log('✅ Admin notification sent successfully!');
      console.log('Email was sent to dealappseo@gmail.com');
    } else {
      console.error('❌ Failed to send admin notification');
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

// Run the test
testAdminNotification();