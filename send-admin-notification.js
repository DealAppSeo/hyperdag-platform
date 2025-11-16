/**
 * Test admin notification for new user registration
 * 
 * This script directly calls the email service function that sends 
 * admin notifications when a new user registers.
 */

import { sendAdminNewUserNotification } from './server/services/email-service.js';

async function sendAdminEmailTest() {
  console.log('🚀 Sending test admin notification...');
  
  try {
    // Generate test data
    const username = 'test_user_' + Math.floor(Math.random() * 1000);
    const persona = 'Developer';
    
    console.log(`Test data: Username: ${username}, Persona: ${persona}`);
    
    // Send the notification
    const result = await sendAdminNewUserNotification(username, persona);
    
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
sendAdminEmailTest();