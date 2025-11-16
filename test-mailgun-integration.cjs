/**
 * Mailgun Integration Test
 * Tests the Mailgun configuration and email delivery
 */

const FormData = require('form-data');
const Mailgun = require('mailgun.js');

async function testMailgunDirect() {
  console.log('Testing Mailgun integration directly...');
  
  const domain = process.env.MAILGUN_DOMAIN;
  const apiKey = process.env.MAILGUN_API_KEY;
  
  console.log(`Domain: ${domain}`);
  console.log(`API Key configured: ${!!apiKey}`);
  
  if (!domain || !apiKey) {
    console.error('Missing Mailgun configuration');
    return false;
  }
  
  try {
    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({ username: 'api', key: apiKey });
    
    const messageData = {
      from: `HyperDAG Test <noreply@${domain}>`,
      to: 'test@hyperdag.org',
      subject: 'Mailgun Integration Test',
      text: 'This is a test email to verify Mailgun integration is working.',
      html: '<p>This is a test email to verify Mailgun integration is working.</p>'
    };
    
    console.log('Sending test email...');
    const result = await mg.messages.create(domain, messageData);
    
    console.log('Mailgun response:', result);
    
    if (result && result.id) {
      console.log('✅ Mailgun test successful - email queued with ID:', result.id);
      return true;
    } else {
      console.log('❌ Unexpected response from Mailgun');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Mailgun test failed:', error);
    return false;
  }
}

testMailgunDirect();