/**
 * Email and SMS Notification Tester
 * 
 * This script tests the email and SMS notification functionality for HyperDAG.
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as emailService from './services/email-service.js';
import * as smsService from './services/sms-service.js';

// Load environment variables
config();

// Admin contact details
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'dealappseo@gmail.com';
const ADMIN_PHONE = process.env.ADMIN_PHONE_NUMBER;

// Generate test data
const testUsername = `TestUser${Math.floor(Math.random() * 1000)}`;
const testPersona = 'developer';
const testTimestamp = new Date().toLocaleString();

async function runTest() {
  console.log('===== TESTING EMAIL & SMS NOTIFICATION SYSTEM =====');
  console.log(`Test User: ${testUsername}`);
  console.log(`Timestamp: ${testTimestamp}`);
  
  // Check email configuration
  console.log('\n📧 EMAIL CONFIGURATION:');
  console.log(`Mailgun API Key: ${process.env.MAILGUN_API_KEY ? 'Available ✓' : 'Missing ✗'}`);
  console.log(`Mailgun Domain: ${process.env.MAILGUN_DOMAIN || 'Not set ✗'}`);
  console.log(`SendGrid API Key: ${process.env.SENDGRID_API_KEY ? 'Available ✓' : 'Missing ✗'}`);
  console.log(`Admin Email: ${ADMIN_EMAIL}`);
  
  // Check SMS configuration
  console.log('\n📱 SMS CONFIGURATION:');
  console.log(`Twilio Account SID: ${process.env.TWILIO_ACCOUNT_SID ? 'Available ✓' : 'Missing ✗'}`);
  console.log(`Twilio Auth Token: ${process.env.TWILIO_AUTH_TOKEN ? 'Available ✓' : 'Missing ✗'}`);
  console.log(`Twilio Phone Number: ${process.env.TWILIO_PHONE_NUMBER || 'Not set ✗'}`);
  console.log(`Admin Phone Number: ${ADMIN_PHONE || 'Not set ✗'}`);
  
  // Test email service
  console.log('\n🔄 SENDING TEST EMAIL...');
  try {
    const emailSuccess = await emailService.sendEmail(
      ADMIN_EMAIL,
      `HyperDAG Test Notification - ${testUsername}`,
      `This is a test email for user ${testUsername}. Sent at ${testTimestamp}.`,
      `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">HyperDAG Test Notification</h2>
        <p>This is a test email from the HyperDAG notification system.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Test User:</strong> ${testUsername}</p>
          <p><strong>Persona:</strong> ${testPersona}</p>
          <p><strong>Timestamp:</strong> ${testTimestamp}</p>
        </div>
        <p>If you're receiving this email, the email notification system is working!</p>
      </div>`
    );
    
    console.log(`Email test result: ${emailSuccess ? 'SUCCESS ✓' : 'FAILED ✗'}`);
  } catch (error) {
    console.error('Email test error:', error);
  }
  
  // Test SMS service if phone number is configured
  if (ADMIN_PHONE && process.env.TWILIO_PHONE_NUMBER) {
    console.log('\n🔄 SENDING TEST SMS...');
    
    try {
      const smsSuccess = await smsService.sendSms(
        ADMIN_PHONE,
        `HyperDAG Test: New user ${testUsername} registered. Timestamp: ${new Date().toLocaleTimeString()}`
      );
      
      console.log(`SMS test result: ${smsSuccess ? 'SUCCESS ✓' : 'FAILED ✗'}`);
    } catch (error) {
      console.error('SMS test error:', error);
    }
  } else {
    console.log('\n⚠️ SMS TEST SKIPPED: Admin phone number or Twilio phone number not configured.');
  }
  
  console.log('\n===== TEST COMPLETE =====');
}

runTest();