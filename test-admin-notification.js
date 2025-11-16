/**
 * Test admin notification for new user registration
 * 
 * This script tests sending admin notifications when a new user registers on HyperDAG.
 * It directly calls the notification service to send an email to the admin.
 */

require('dotenv').config();
const { notificationService } = require('./server/services/notification-service');

async function testAdminNotification() {
  console.log('Testing admin notification for new user registration...');
  
  // Mock user object for testing
  const mockUser = {
    id: 999,
    username: 'test_user_' + Math.floor(Math.random() * 1000),
    email: 'test@example.com',
    referralCode: 'TEST1234',
    createdAt: new Date(),
    referredBy: null
  };
  
  try {
    console.log(`Sending admin notification for user: ${mockUser.username}`);
    const result = await notificationService.sendAdminNewUserNotification(mockUser);
    
    if (result) {
      console.log('✅ Admin notification sent successfully!');
      console.log(`Admin email: ${process.env.ADMIN_EMAIL || 'dealappseo@gmail.com'}`);
      
      if (process.env.ADMIN_PHONE) {
        console.log(`Admin phone: ${process.env.ADMIN_PHONE} (SMS notification sent)`);
      } else {
        console.log('No admin phone configured for SMS notification');
      }
    } else {
      console.error('❌ Failed to send admin notification');
    }
  } catch (error) {
    console.error('❌ Error testing admin notification:', error);
  }
}

testAdminNotification();