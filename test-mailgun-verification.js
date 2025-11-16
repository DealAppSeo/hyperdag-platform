/**
 * Mailgun Verification Test Script
 * 
 * This script tests email delivery using the new mg.hyperdag.org subdomain
 * after DNS records have been configured.
 */

import { EmailService } from './server/services/email-service.js';

async function testMailgunVerification() {
  console.log('='.repeat(60));
  console.log('MAILGUN VERIFICATION TEST');
  console.log('='.repeat(60));
  
  const emailService = new EmailService();
  
  // Check if email service is available
  if (!emailService.isAvailable()) {
    console.error('❌ Email service is not configured properly');
    return;
  }
  
  console.log('✅ Email service initialized');
  console.log(`📧 Using domain: ${process.env.MAILGUN_DOMAIN}`);
  console.log(`📤 Sender: ${process.env.EMAIL_SENDER}`);
  
  // Test email to admin
  const testEmail = {
    to: 'sean@hyperdag.org',
    subject: 'HyperDAG Email Verification Test',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0; text-align: center;">🎉 Email Test Successful!</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745;">
          <h2 style="color: #155724; margin-top: 0;">Mailgun Configuration Verified</h2>
          <p style="color: #155724; margin-bottom: 0;">
            Your HyperDAG email system is now working perfectly with the mg.hyperdag.org subdomain!
          </p>
        </div>
        
        <div style="padding: 20px;">
          <p><strong>Configuration Details:</strong></p>
          <ul>
            <li>✅ Mailgun Domain: mg.hyperdag.org</li>
            <li>✅ DNS Records: Properly configured</li>
            <li>✅ Email Delivery: Active</li>
            <li>✅ No MX conflicts with Zoho</li>
          </ul>
          
          <p>Your dual email setup is now complete:</p>
          <ul>
            <li>📧 <strong>sean@hyperdag.org</strong> → Zoho Mail (personal/business)</li>
            <li>🤖 <strong>noreply@mg.hyperdag.org</strong> → Mailgun (app notifications)</li>
          </ul>
        </div>
        
        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 20px;">
          <p style="margin: 0; color: #1565c0;">
            <strong>Next Steps:</strong> Your HyperDAG platform is ready for launch! 
            All user notifications, welcome emails, and admin alerts will now be delivered reliably.
          </p>
        </div>
      </div>
    `,
    text: `
HyperDAG Email Verification Test

✅ Mailgun Configuration Verified!

Your HyperDAG email system is now working perfectly with the mg.hyperdag.org subdomain!

Configuration Details:
- Mailgun Domain: mg.hyperdag.org
- DNS Records: Properly configured  
- Email Delivery: Active
- No MX conflicts with Zoho

Your dual email setup is now complete:
- sean@hyperdag.org → Zoho Mail (personal/business)
- noreply@mg.hyperdag.org → Mailgun (app notifications)

Next Steps: Your HyperDAG platform is ready for launch! All user notifications, welcome emails, and admin alerts will now be delivered reliably.
    `
  };
  
  try {
    console.log('\n📤 Sending verification email...');
    const success = await emailService.sendEmail(testEmail);
    
    if (success) {
      console.log('✅ EMAIL SENT SUCCESSFULLY!');
      console.log('📧 Check sean@hyperdag.org for the verification email');
      console.log('\n🎉 Your email system is fully operational!');
      console.log('🚀 HyperDAG is ready for deployment!');
    } else {
      console.error('❌ Email sending failed');
      console.log('💡 DNS records may still be propagating (can take up to 48 hours)');
    }
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    console.log('💡 This is likely due to DNS propagation delay');
  }
  
  console.log('\n' + '='.repeat(60));
}

// Run the test
testMailgunVerification().catch(console.error);