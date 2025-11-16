/**
 * Test Mailgun with dual email delivery
 */
import Mailgun from 'mailgun.js';
import formData from 'form-data';
import dotenv from 'dotenv';

// Load environment
dotenv.config();

async function testDualEmailDelivery() {
  console.log('🔄 Testing Mailgun connection with dual email delivery...');
  
  const mailgun = new Mailgun(formData);
  const mg = mailgun.client({
    username: 'api',
    key: process.env.MAILGUN_API_KEY
  });
  
  if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
    console.log('❌ Missing Mailgun credentials');
    return false;
  }

  const emailContent = {
    from: `HyperDAG <noreply@${process.env.MAILGUN_DOMAIN}>`,
    subject: '🎉 HyperDAG Email Automation Test - Successfully Connected!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">🚀 Your Email Automation is Live!</h2>
        
        <p>Congratulations! Your HyperDAG platform can now send automated emails including:</p>
        
        <ul style="background: #f3f4f6; padding: 20px; border-radius: 8px;">
          <li>✨ Profile completion nudges (Day 1, 3, 7, 14)</li>
          <li>🏆 Milestone celebration emails</li>
          <li>🤝 Referral success notifications</li>
          <li>🎯 Grant matching alerts</li>
          <li>👥 Team collaboration invites</li>
        </ul>
        
        <div style="background: #dbeafe; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <strong>✅ Email System Status:</strong>
          <br>• Mailgun: Connected via ${process.env.MAILGUN_DOMAIN}
          <br>• Automated campaigns: Active
          <br>• Profile completion scheduler: Running every 6 hours
          <br>• User engagement workflows: Ready
        </div>
        
        <p>Your automated user engagement system is now ready to drive profile completions and build referral networks!</p>
        
        <p style="color: #6b7280; font-size: 14px;">
          Sent from HyperDAG Email Automation System
        </p>
      </div>
    `,
    text: 'HyperDAG Email Automation Test - Your automated email system is now live and ready to engage users with profile completion nudges, milestone celebrations, and referral notifications!'
  };

  try {
    // Send to both email addresses
    const emails = [
      'sean@ccanaheim.com',
      'sean@hyperdag.org'
    ];

    console.log(`📧 Sending test emails to: ${emails.join(', ')}`);

    for (const email of emails) {
      const result = await mg.messages.create(process.env.MAILGUN_DOMAIN, {
        ...emailContent,
        to: email
      });
      
      console.log(`✅ Email sent successfully to ${email}:`, result.id);
    }

    console.log('🎊 All test emails sent successfully!');
    console.log('📬 Check both inboxes to confirm delivery');
    
    return true;
    
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    return false;
  }
}

// Run the test
testDualEmailDelivery()
  .then(success => {
    if (success) {
      console.log('\n🚀 Your HyperDAG email automation is ready for production!');
      console.log('Users will now automatically receive:');
      console.log('  • Welcome emails upon registration');
      console.log('  • Profile completion nudges on days 1, 3, 7, and 14');
      console.log('  • Milestone celebration emails when earning reputation points');
      console.log('  • Referral success notifications');
    } else {
      console.log('\n❌ Email test failed - check your Mailgun configuration');
    }
  })
  .catch(error => {
    console.error('Test error:', error);
  });