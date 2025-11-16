// SMS service test script with updated admin phone
const dotenv = require('dotenv');
dotenv.config();

// Using the admin phone number provided
const ADMIN_PHONE = '+19496337926'; // Format with the + prefix in E.164 format

async function testSms() {
  console.log('=== SMS Service Test ===');
  console.log('Configuration:');
  console.log(`- Twilio Account SID: ${process.env.TWILIO_ACCOUNT_SID ? 'Set ✓' : 'Not set ✗'}`);
  console.log(`- Twilio Auth Token: ${process.env.TWILIO_AUTH_TOKEN ? 'Set ✓' : 'Not set ✗'}`);
  console.log(`- Twilio Phone Number: ${process.env.TWILIO_PHONE_NUMBER || 'Not set ✗'}`);
  console.log(`- Admin Phone Number: ${ADMIN_PHONE}`);
  
  // Test Twilio if configured
  if (process.env.TWILIO_ACCOUNT_SID && 
      process.env.TWILIO_AUTH_TOKEN && 
      process.env.TWILIO_PHONE_NUMBER) {
    
    console.log('\nTesting Twilio SMS delivery...');
    try {
      const twilio = require('twilio');
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      
      const result = await client.messages.create({
        body: `HyperDAG SMS Test: ${new Date().toLocaleString()}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: ADMIN_PHONE
      });
      
      console.log('Twilio SMS test successful!');
      console.log(`Message SID: ${result.sid}`);
      console.log(`Status: ${result.status}`);
    } catch (error) {
      console.error('Twilio SMS test failed:');
      console.error(error.message);
      if (error.code) {
        console.error(`Error code: ${error.code}`);
      }
    }
  } else {
    console.log('\nSkipping Twilio SMS test - configuration incomplete');
    
    // Show which parts are missing
    if (!process.env.TWILIO_ACCOUNT_SID) console.log('- Missing: TWILIO_ACCOUNT_SID');
    if (!process.env.TWILIO_AUTH_TOKEN) console.log('- Missing: TWILIO_AUTH_TOKEN');
    if (!process.env.TWILIO_PHONE_NUMBER) console.log('- Missing: TWILIO_PHONE_NUMBER');
  }
  
  console.log('\n=== SMS Test Complete ===');
}

testSms().catch(console.error);