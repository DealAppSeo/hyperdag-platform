// Simple email & SMS test script
const { checkEmailServiceStatus, sendEmail } = require('./server/services/email-service');
const { checkSmsServiceStatus, sendSms } = require('./server/services/sms-service');

// Test data
const testUser = `TestUser${Math.floor(Math.random() * 1000)}`;
const timestamp = new Date().toLocaleString();

async function runTest() {
  console.log('=== Testing Communication Services ===');
  
  // Check email service
  console.log('\nChecking email service...');
  const emailAvailable = await checkEmailServiceStatus();
  console.log(`Email service available: ${emailAvailable ? 'YES' : 'NO'}`);
  console.log(`SendGrid API Key: ${process.env.SENDGRID_API_KEY ? 'Set' : 'Not set'}`);
  console.log(`Mailgun API Key: ${process.env.MAILGUN_API_KEY ? 'Set' : 'Not set'}`);
  console.log(`Mailgun Domain: ${process.env.MAILGUN_DOMAIN || 'Not set'}`);
  
  // Test sending an email
  if (emailAvailable) {
    console.log('\nSending test email...');
    const emailResult = await sendEmail(
      'dealappseo@gmail.com',
      `HyperDAG Test Notification for ${testUser}`,
      `This is a test message sent at ${timestamp}`,
      `<div style="font-family: Arial; padding: 20px;">
        <h2>HyperDAG Test Email</h2>
        <p>This is a test message for <strong>${testUser}</strong></p>
        <p>Sent at: ${timestamp}</p>
      </div>`
    );
    console.log(`Email result: ${emailResult ? 'SENT' : 'FAILED'}`);
  }
  
  // Check SMS service
  console.log('\nChecking SMS service...');
  const smsAvailable = await checkSmsServiceStatus();
  console.log(`SMS service available: ${smsAvailable ? 'YES' : 'NO'}`);
  console.log(`Twilio Account SID: ${process.env.TWILIO_ACCOUNT_SID ? 'Set' : 'Not set'}`);
  console.log(`Twilio Auth Token: ${process.env.TWILIO_AUTH_TOKEN ? 'Set' : 'Not set'}`);
  console.log(`Twilio Phone Number: ${process.env.TWILIO_PHONE_NUMBER || 'Not set'}`);
  
  // Test sending an SMS if admin phone is set
  if (smsAvailable && process.env.ADMIN_PHONE_NUMBER) {
    console.log('\nSending test SMS...');
    const smsResult = await sendSms(
      process.env.ADMIN_PHONE_NUMBER,
      `HyperDAG test for ${testUser} at ${timestamp}`
    );
    console.log(`SMS result: ${smsResult ? 'SENT' : 'FAILED'}`);
  } else if (smsAvailable) {
    console.log('\nCannot send SMS test: ADMIN_PHONE_NUMBER not set');
  }
  
  console.log('\n=== Test Complete ===');
}

runTest();