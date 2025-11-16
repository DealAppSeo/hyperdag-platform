// Detailed Mailgun test script
const dotenv = require('dotenv');
dotenv.config();

async function testMailgun() {
  console.log('=== Detailed Mailgun Test ===');
  
  // Check configuration
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  
  console.log(`API Key: ${apiKey ? '✓ Set' : '✗ Not set'}`);
  console.log(`Domain: ${domain || '✗ Not set'}`);
  
  if (!apiKey || !domain) {
    console.log('❌ Cannot proceed: Missing configuration');
    return;
  }
  
  try {
    const formData = require('form-data');
    const Mailgun = require('mailgun.js');
    
    console.log('\nInitializing Mailgun client...');
    const mailgun = new Mailgun(formData);
    const mg = mailgun.client({
      username: 'api',
      key: apiKey
    });
    
    // Test domain verification status
    console.log('\nChecking domain verification status...');
    try {
      const domainInfo = await mg.domains.get(domain);
      console.log(`Domain exists: ✓`);
      console.log(`Domain state: ${domainInfo.state || 'unknown'}`);
      console.log(`Receiving records setup: ${domainInfo.receiving_dns_records ? '✓' : '✗'}`);
      console.log(`Sending records setup: ${domainInfo.sending_dns_records ? '✓' : '✗'}`);
    } catch (domainError) {
      console.error(`❌ Failed to get domain info: ${domainError.message}`);
    }
    
    // Try sending a test email
    console.log('\nAttempting to send test email...');
    try {
      const testEmail = 'dealappseo@gmail.com';
      console.log(`Sending to: ${testEmail}`);
      
      const result = await mg.messages.create(
        domain,
        {
          from: `HyperDAG <noreply@${domain}>`,
          to: [testEmail],
          subject: 'HyperDAG Mailgun Detailed Test',
          text: 'This is a detailed test email from HyperDAG via Mailgun.',
          html: `
            <div style="font-family: Arial; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 5px;">
              <h2 style="color: #333;">HyperDAG Mailgun Test</h2>
              <p>This is a detailed test email sent via Mailgun.</p>
              <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Domain:</strong> ${domain}</p>
            </div>
          `
        }
      );
      
      console.log('✅ Email sent successfully!');
      console.log(`Message ID: ${result.id}`);
    } catch (sendError) {
      console.error('❌ Failed to send email:');
      console.error(sendError.message);
      
      // More detailed error information
      if (sendError.status) {
        console.error(`Status code: ${sendError.status}`);
      }
      
      if (sendError.details) {
        console.error('Error details:', sendError.details);
      }
    }
    
  } catch (error) {
    console.error('❌ General error:');
    console.error(error.message);
  }
  
  console.log('\n=== Test Complete ===');
}

testMailgun().catch(console.error);