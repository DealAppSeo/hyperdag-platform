/**
 * Simple Mailgun Test Script
 * Tests the email service to verify Mailgun integration is working
 */

import { emailService } from './server/services/email-service.js';

async function testMailgunIntegration() {
  console.log('Testing Mailgun integration...');
  
  try {
    // Check if email service is available
    const isAvailable = emailService.isAvailable();
    console.log(`Email service available: ${isAvailable}`);
    
    if (!isAvailable) {
      console.error('Email service is not configured properly');
      return;
    }
    
    // Test sending a simple email
    const testResult = await emailService.sendEmail({
      to: 'test@hyperdag.org',
      subject: 'HyperDAG Email Service Test',
      html: '<p>This is a test email from HyperDAG platform.</p>',
      text: 'This is a test email from HyperDAG platform.'
    });
    
    if (testResult) {
      console.log('✅ Email sent successfully via Mailgun');
    } else {
      console.log('❌ Email sending failed');
    }
    
  } catch (error) {
    console.error('Error testing Mailgun:', error);
  }
}

testMailgunIntegration();