// Fix Twilio phone number format in environment
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function fixTwilioPhoneFormat() {
  console.log('Checking Twilio phone number format...');
  
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
  if (!twilioPhone) {
    console.log('TWILIO_PHONE_NUMBER not found in environment');
    return;
  }
  
  // Fix phone format if needed
  if (!twilioPhone.startsWith('+')) {
    const fixedPhone = `+${twilioPhone}`;
    console.log(`Updating phone format from ${twilioPhone} to ${fixedPhone}`);
    
    try {
      // Read the current .env file
      const envPath = path.resolve(process.cwd(), '.env');
      let envContent = '';
      
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      } else {
        console.log('.env file not found, creating new one');
      }
      
      // Replace the TWILIO_PHONE_NUMBER line or add it if it doesn't exist
      if (envContent.includes('TWILIO_PHONE_NUMBER=')) {
        envContent = envContent.replace(
          /TWILIO_PHONE_NUMBER=.*/,
          `TWILIO_PHONE_NUMBER=${fixedPhone}`
        );
      } else {
        envContent += `\nTWILIO_PHONE_NUMBER=${fixedPhone}`;
      }
      
      // Write the updated content back to .env
      fs.writeFileSync(envPath, envContent);
      console.log('Successfully updated TWILIO_PHONE_NUMBER in .env file');
      
      // Also add ADMIN_PHONE_NUMBER if not present
      if (!process.env.ADMIN_PHONE_NUMBER && !envContent.includes('ADMIN_PHONE_NUMBER=')) {
        const adminPhone = '+19496337926'; // Use the provided admin phone
        console.log(`Adding ADMIN_PHONE_NUMBER=${adminPhone}`);
        
        fs.appendFileSync(envPath, `\nADMIN_PHONE_NUMBER=${adminPhone}`);
        console.log('Successfully added ADMIN_PHONE_NUMBER to .env file');
      }
      
      console.log('Environment update complete. Please restart your application to apply changes.');
    } catch (error) {
      console.error('Error updating environment:', error);
    }
  } else {
    console.log('Twilio phone number already in correct format');
  }
}

fixTwilioPhoneFormat().catch(console.error);