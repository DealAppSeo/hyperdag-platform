/**
 * Test Email Services Script
 * 
 * This script directly tests both Mailgun and SendGrid email services
 * to verify their functionality and determine which service is properly working.
 */

import dotenv from 'dotenv';
import Mailgun from 'mailgun.js';
import FormData from 'form-data';
import sgMail from '@sendgrid/mail';

// Initialize dotenv
dotenv.config();

// Recipient email (where we want to receive the test)
const RECIPIENT_EMAIL = 'dealappseo@gmail.com';

async function testMailgun() {
  console.log('\n============ TESTING MAILGUN ============');
  
  // Check if Mailgun is configured
  const mailgunDomain = process.env.MAILGUN_DOMAIN;
  const mailgunApiKey = process.env.MAILGUN_API_KEY;
  
  if (!mailgunDomain || !mailgunApiKey) {
    console.error('Mailgun is not properly configured. Missing API key or domain.');
    return false;
  }
  
  console.log(`Using Mailgun domain: ${mailgunDomain}`);
  console.log(`Mailgun API key present: ${Boolean(mailgunApiKey)}`);
  
  try {
    // Initialize Mailgun client
    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({ username: 'api', key: mailgunApiKey });
    
    // Message data
    const data = {
      from: `HyperDAG Test <noreply@${mailgunDomain}>`,
      to: RECIPIENT_EMAIL,
      subject: 'HyperDAG Mailgun Test',
      text: 'This is a test email from Mailgun to verify email delivery.',
      html: '<div style="color: #333; font-family: Arial, sans-serif;"><h2>HyperDAG Mailgun Test</h2><p>This is a test email sent via Mailgun to verify email delivery.</p><p>If you received this email, Mailgun is working!</p></div>'
    };
    
    console.log('Sending test email via Mailgun...');
    const result = await mg.messages.create(mailgunDomain, data);
    console.log('Mailgun API response:', result);
    
    console.log('✅ Mailgun test email sent successfully!');
    return true;
  } catch (error) {
    console.error('❌ Mailgun test failed:', error);
    return false;
  }
}

async function testSendGrid() {
  console.log('\n============ TESTING SENDGRID ============');
  
  // Check if SendGrid is configured
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  
  if (!sendgridApiKey) {
    console.error('SendGrid is not properly configured. Missing API key.');
    return false;
  }
  
  console.log(`SendGrid API key present: ${Boolean(sendgridApiKey)}`);
  
  try {
    // Initialize SendGrid
    sgMail.setApiKey(sendgridApiKey);
    
    // Message data
    const msg = {
      to: RECIPIENT_EMAIL,
      from: 'noreply@hyperdag.org', // Must be a verified sender in SendGrid
      subject: 'HyperDAG SendGrid Test',
      text: 'This is a test email from SendGrid to verify email delivery.',
      html: '<div style="color: #333; font-family: Arial, sans-serif;"><h2>HyperDAG SendGrid Test</h2><p>This is a test email sent via SendGrid to verify email delivery.</p><p>If you received this email, SendGrid is working!</p></div>'
    };
    
    console.log('Sending test email via SendGrid...');
    const result = await sgMail.send(msg);
    console.log('SendGrid API response:', JSON.stringify(result, null, 2));
    
    console.log('✅ SendGrid test email sent successfully!');
    return true;
  } catch (error) {
    console.error('❌ SendGrid test failed:', error);
    if (error.response) {
      console.error('SendGrid error details:', error.response.body);
    }
    return false;
  }
}

async function main() {
  console.log('======================================');
  console.log('HYPERDAG EMAIL SERVICES TEST');
  console.log('Recipient Email: ' + RECIPIENT_EMAIL);
  console.log('Timestamp: ' + new Date().toISOString());
  console.log('======================================\n');
  
  // Test both services
  const mailgunResult = await testMailgun();
  const sendgridResult = await testSendGrid();
  
  // Summary
  console.log('\n======================================');
  console.log('TEST RESULTS:');
  console.log('Mailgun: ' + (mailgunResult ? '✅ SUCCESS' : '❌ FAILED'));
  console.log('SendGrid: ' + (sendgridResult ? '✅ SUCCESS' : '❌ FAILED'));
  console.log('======================================');
  
  if (mailgunResult || sendgridResult) {
    console.log('\n✅ At least one email service is working!');
    console.log('Please check your inbox at ' + RECIPIENT_EMAIL + ' for test emails.');
  } else {
    console.log('\n❌ Both email services failed.');
    console.log('Please check your API keys and configurations.');
  }
}

// Run the tests
main().catch(console.error);