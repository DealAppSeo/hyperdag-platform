/**
 * Test admin notification for new user registration
 * 
 * This script tests sending admin notifications when a new user registers on HyperDAG.
 * It directly calls the notification service to send an email to both admin emails.
 */

import dotenv from 'dotenv';
// Import email service directly instead of notification service
import { emailService, sendAdminNewUserNotification } from './server/services/email-service.js';

dotenv.config();

async function testAdminNotification() {
  console.log('======================================');
  console.log('TESTING ADMIN NOTIFICATION SYSTEM');
  console.log('Sending to these admin emails:');
  console.log('- dealappseo@gmail.com');
  console.log('- sean@ccanaheim.com');
  console.log('======================================\n');
  
  // Mock user object for testing
  const mockUser = {
    id: 999,
    username: 'test_user_' + Math.floor(Math.random() * 1000),
    email: 'test@example.com',
    referralCode: 'TEST1234',
    createdAt: new Date(),
    referredBy: null,
    persona: 'Developer'
  };
  
  try {
    console.log(`Sending admin notification for user: ${mockUser.username}`);
    const result = await sendAdminNewUserNotification(mockUser.username, mockUser.persona, mockUser.referredBy);
    
    if (result) {
      console.log('\n✅ Admin notifications sent successfully!');
      console.log('Emails sent to both dealappseo@gmail.com and sean@ccanaheim.com');
      
      if (process.env.ADMIN_PHONE) {
        console.log(`SMS notification sent to ${process.env.ADMIN_PHONE}`);
      } else {
        console.log('No admin phone configured for SMS notification');
      }
    } else {
      console.error('\n❌ Failed to send some admin notifications');
      console.log('Please check the logs above for details');
    }
  } catch (error) {
    console.error('\n❌ Error testing admin notification:', error);
  }
}

testAdminNotification();