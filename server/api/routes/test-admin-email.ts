import express from 'express';
import * as emailService from '../../services/email-service';
import * as smsService from '../../services/sms-service';

const router = express.Router();

/**
 * Endpoint to send a test admin notification (email and/or SMS)
 * GET /api/test-admin-email
 */
router.get('/', async (req, res) => {
  try {
    // Only admins can access this endpoint
    if (!req.user?.isAdmin) {
      return res.status(403).send('Access denied: Admin privileges required');
    }

    // Check service status
    const emailAvailable = await emailService.checkEmailServiceStatus();
    const smsAvailable = await smsService.checkSmsServiceStatus();

    // Generate random test user info
    const testUsername = `TestUser${Math.floor(Math.random() * 1000)}`;
    const testPersona = 'developer';
    const testReferrer = 'Sean';

    console.log(`Sending test admin notification for user: ${testUsername}`);
    
    // Prepare email content for the admin notification
    const adminEmail = process.env.ADMIN_EMAIL || 'dealappseo@gmail.com';
    const subject = `[TEST] New HyperDAG User Registration: ${testUsername}`;
    
    // Create HTML content
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">Test: New User Registration</h2>
        <p>This is a <strong>TEST</strong> notification. A new user has registered on HyperDAG.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Username:</strong> ${testUsername}</p>
          <p><strong>Persona:</strong> ${testPersona}</p>
          <p><strong>Referred by:</strong> ${testReferrer}</p>
          <p><strong>Registration Date:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <p>You can log in to the admin dashboard to view their profile.</p>
      </div>
    `;
    
    // Plain text version
    const textContent = `
      TEST: New User Registration on HyperDAG
      
      Username: ${testUsername}
      Persona: ${testPersona}
      Referred by: ${testReferrer}
      Registration Date: ${new Date().toLocaleString()}
      
      You can log in to the admin dashboard to view their profile.
    `;
    
    // Send email notification
    const emailSuccess = await emailService.sendEmail(
      adminEmail,
      subject,
      textContent,
      htmlContent
    );
    
    // Get admin phone number from environment variable
    const adminPhoneNumber = process.env.ADMIN_PHONE_NUMBER;
    
    // Send SMS notification if configured
    let smsSuccess = false;
    if (smsAvailable && adminPhoneNumber) {
      const smsMessage = `[TEST] New HyperDAG user registration: ${testUsername} (${testPersona}). Referred by: ${testReferrer}`;
      smsSuccess = await smsService.sendSms(adminPhoneNumber, smsMessage);
    }
    
    // Consider the notification successful if either email or SMS was sent successfully
    const success = emailSuccess || smsSuccess;

    if (success) {
      return res.send(`
        <html>
          <head>
            <title>Test Admin Email Sent</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
              .success { color: green; padding: 20px; border: 1px solid green; border-radius: 5px; }
              .details { margin-top: 20px; background: #f5f5f5; padding: 15px; border-radius: 5px; }
              h1 { color: #333; }
              a { display: inline-block; margin-top: 20px; text-decoration: none; color: #4F46E5; }
            </style>
          </head>
          <body>
            <h1>Test Admin Email Notification</h1>
            <div class="success">
              <strong>Success!</strong> Test admin notification email has been sent.
            </div>
            <div class="details">
              <p><strong>Email sent to:</strong> dealappseo@gmail.com</p>
              <p><strong>Test username:</strong> ${testUsername}</p>
              <p><strong>Test persona:</strong> ${testPersona}</p>
              <p><strong>Test referrer:</strong> ${testReferrer}</p>
              <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <a href="/">&larr; Back to Home</a>
          </body>
        </html>
      `);
    } else {
      return res.status(500).send(`
        <html>
          <head>
            <title>Test Admin Email Failed</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
              .error { color: red; padding: 20px; border: 1px solid red; border-radius: 5px; }
              h1 { color: #333; }
              a { display: inline-block; margin-top: 20px; text-decoration: none; color: #4F46E5; }
            </style>
          </head>
          <body>
            <h1>Test Admin Email Notification</h1>
            <div class="error">
              <strong>Error!</strong> Failed to send test admin notification email.
            </div>
            <p>Please check the server logs for more details.</p>
            <a href="/">&larr; Back to Home</a>
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('Error sending test admin notification:', error);
    return res.status(500).send(`
      <html>
        <head>
          <title>Test Admin Email Error</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            .error { color: red; padding: 20px; border: 1px solid red; border-radius: 5px; }
            .details { margin-top: 20px; background: #f5f5f5; padding: 15px; border-radius: 5px; }
            h1 { color: #333; }
            a { display: inline-block; margin-top: 20px; text-decoration: none; color: #4F46E5; }
          </style>
        </head>
        <body>
          <h1>Test Admin Email Notification</h1>
          <div class="error">
            <strong>Server Error!</strong> An unexpected error occurred.
          </div>
          <div class="details">
            <p>${error instanceof Error ? error.message : String(error)}</p>
          </div>
          <a href="/">&larr; Back to Home</a>
        </body>
      </html>
    `);
  }
});

export default router;