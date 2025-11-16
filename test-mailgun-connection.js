/**
 * Mailgun Connection Test Script
 * 
 * This script tests the Mailgun integration once API credentials are provided.
 * It will send a test email to verify the automated email system is working.
 */

import { sendEmail } from './server/services/email-service.js';

async function testMailgunConnection() {
  console.log('🔄 Testing Mailgun connection...');
  
  try {
    // Test with a simple welcome email
    const testEmailSuccess = await sendEmail({
      to: 'sean@ccanaheim.com', // Your current email for testing
      subject: '🎉 HyperDAG Email Automation is Live!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">🚀 Your Email Automation is Working!</h2>
          
          <p>Congratulations! Your HyperDAG platform can now send automated emails including:</p>
          
          <ul style="background: #f3f4f6; padding: 20px; border-radius: 8px;">
            <li>✨ Profile completion nudges</li>
            <li>🏆 Milestone celebration emails</li>
            <li>🤝 Referral success notifications</li>
            <li>🎯 Grant matching alerts</li>
            <li>👥 Team collaboration invites</li>
          </ul>
          
          <p>Your automated user engagement system is now ready to drive profile completions and build referral networks!</p>
          
          <div style="background: #dbeafe; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <strong>Next Steps:</strong>
            <br>• Users will automatically receive welcome emails
            <br>• Profile completion nudges will be sent on days 1, 3, 7, and 14
            <br>• Milestone celebrations trigger when users earn reputation points
          </div>
          
          <p style="color: #6b7280;">Sent from HyperDAG Email Automation System</p>
        </div>
      `,
      text: 'HyperDAG Email Automation Test - Your automated email system is now live and ready to engage users!'
    });

    if (testEmailSuccess) {
      console.log('✅ Mailgun connection successful!');
      console.log('📧 Test email sent to sean@ccanaheim.com');
      console.log('🎊 Your automated email system is now active!');
      
      return {
        success: true,
        message: 'Mailgun connected and email automation is live!'
      };
    } else {
      console.log('❌ Failed to send test email');
      return {
        success: false,
        message: 'Email sending failed - check API credentials'
      };
    }
    
  } catch (error) {
    console.error('❌ Mailgun connection error:', error.message);
    return {
      success: false,
      message: `Connection error: ${error.message}`
    };
  }
}

// Run the test
testMailgunConnection()
  .then(result => {
    console.log('\n📊 Test Result:', result);
    if (result.success) {
      console.log('\n🚀 Your HyperDAG platform is now ready for automated user engagement!');
    }
  })
  .catch(error => {
    console.error('Test script error:', error);
  });

export default testMailgunConnection;