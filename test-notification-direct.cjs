/**
 * Direct Admin Notification Test (CommonJS version)
 * 
 * This test sends an admin notification to both dealappseo@gmail.com and sean@ccanaheim.com
 * using the Mailgun API directly.
 */

require('dotenv').config();
const Mailgun = require('mailgun.js');
const FormData = require('form-data');

const ADMIN_EMAILS = [
  process.env.ADMIN_EMAIL || 'dealappseo@gmail.com',
  'sean@ccanaheim.com'
];

async function testAdminNotification() {
  console.log('======================================');
  console.log('TESTING ADMIN NOTIFICATION SYSTEM');
  console.log('Sending to these admin emails:');
  ADMIN_EMAILS.forEach(email => console.log(`- ${email}`));
  console.log('======================================\n');
  
  // Setup Mailgun client
  const mailgunApiKey = process.env.MAILGUN_API_KEY;
  const mailgunDomain = process.env.MAILGUN_DOMAIN || 'hyperdag.org';
  
  if (!mailgunApiKey) {
    console.error('⚠️ MAILGUN_API_KEY is not set in environment');
    process.exit(1);
  }
  
  const mailgun = new Mailgun(FormData);
  const mg = mailgun.client({ username: 'api', key: mailgunApiKey });
  
  // Mock user data for test
  const mockUser = {
    username: 'test_user_' + Math.floor(Math.random() * 1000),
    persona: 'Developer',
    referrer: null
  };
  
  // Format date for better readability
  const timestamp = new Date().toISOString();
  const date = new Date().toLocaleString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // HTML email template
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; color: #333;">
      <div style="background-color: #f7f9fc; padding: 15px; border-left: 4px solid #3498db;">
        <h2 style="color: #2c3e50; margin-top: 0;">HyperDAG Platform: New User Registration</h2>
      </div>
      
      <div style="padding: 20px; border: 1px solid #eaeaea; margin-top: 15px; background-color: #fff;">
        <p>Hello,</p>
        <p>This is an automated notification that a new user has registered on the HyperDAG platform.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eaeaea; width: 30%;"><strong>Username:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #eaeaea;">${mockUser.username}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eaeaea;"><strong>Persona:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #eaeaea;">${mockUser.persona || 'Not specified'}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eaeaea;"><strong>Referrer:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #eaeaea;">${mockUser.referrer || 'None'}</td>
          </tr>
          <tr>
            <td style="padding: 10px;"><strong>Registration Time:</strong></td>
            <td style="padding: 10px;">${date}</td>
          </tr>
        </table>
        
        <p>Please review this new account in the admin dashboard when convenient.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; color: #7f8c8d; font-size: 12px;">
          <p>This is an automated message from the HyperDAG platform. Please do not reply to this email.</p>
          <p>© ${new Date().getFullYear()} HyperDAG. All rights reserved.</p>
          <p>Timestamp: ${timestamp}</p>
        </div>
      </div>
    </div>
  `;
  
  // Plain text version
  const text = `HyperDAG Platform: New User Registration
  
Hello,

This is an automated notification that a new user has registered on the HyperDAG platform.

User Details:
- Username: ${mockUser.username}
- Persona: ${mockUser.persona || 'Not specified'}
- Referrer: ${mockUser.referrer || 'None'}
- Registration Time: ${date}

Please review this new account in the admin dashboard when convenient.

---
This is an automated message from the HyperDAG platform. Please do not reply to this email.
© ${new Date().getFullYear()} HyperDAG. All rights reserved.
Timestamp: ${timestamp}`;

  let allSucceeded = true;
  
  // Send to each admin email
  for (const email of ADMIN_EMAILS) {
    console.log(`Sending admin notification to: ${email}`);
    
    try {
      // Prepare email data
      const data = {
        from: `HyperDAG Notifications <noreply@${mailgunDomain}>`,
        to: email,
        subject: 'HyperDAG Platform: New User Registration',
        text,
        html
      };
      
      // Send the email
      const result = await mg.messages.create(mailgunDomain, data);
      console.log(`Mailgun API response for ${email}:`, result);
      
      if (result.status === 200) {
        console.log(`✅ Notification sent successfully to ${email}`);
      } else {
        console.error(`⚠️ Unexpected status code ${result.status} when sending to ${email}`);
        allSucceeded = false;
      }
    } catch (error) {
      console.error(`❌ Failed to send notification to ${email}:`, error);
      allSucceeded = false;
    }
  }
  
  if (allSucceeded) {
    console.log('\n✅ All admin notifications sent successfully!');
    console.log(`Notifications sent to: ${ADMIN_EMAILS.join(', ')}`);
  } else {
    console.error('\n⚠️ Some admin notifications failed to send');
    console.log('Please check the logs above for details');
  }
}

testAdminNotification().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});