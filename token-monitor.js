require('dotenv').config();
const axios = require('axios');
const nodemailer = require('nodemailer');
const config = require('./src/config');

// Time to check token validity (in milliseconds)
const CHECK_INTERVAL = 12 * 60 * 60 * 1000; // Check every 12 hours

// Check if the WhatsApp token is valid
async function checkTokenValidity() {
  try {
    console.log('Checking WhatsApp API token validity...');
    
    const response = await axios({
      method: 'GET',
      url: `https://graph.facebook.com/v18.0/${config.whatsapp.phoneNumberId}`,
      headers: {
        'Authorization': `Bearer ${config.whatsapp.apiToken}`
      }
    });
    
    console.log('✅ WhatsApp API token is valid!');
    return true;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.error('❌ WhatsApp API token has expired or is invalid.');
      console.error('Please generate a new token at https://developers.facebook.com/apps/');
      
      // Log detailed error
      if (error.response && error.response.data) {
        console.error('Error details:', error.response.data);
      }
      
      // You can set up email notifications here:
      // await sendTokenExpirationNotification();
      
      return false;
    } else {
      console.error('Error checking token validity:', error.message);
      return null; // Unknown status
    }
  }
}

// Optional: Setup email notifications when token expires
async function sendTokenExpirationNotification() {
  // This is just a template - you'll need to configure your own email service
  try {
    // Create a transporter (configure with your email service)
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Or your preferred email service
      auth: {
        user: 'your-email@gmail.com',
        pass: 'your-app-password' // Use app password for Gmail
      }
    });
    
    // Email content
    const mailOptions = {
      from: 'your-email@gmail.com',
      to: 'your-notification-email@example.com',
      subject: '⚠️ WhatsApp API Token Expired',
      text: `Your WhatsApp API token for Kairos has expired. 
      Please generate a new token at https://developers.facebook.com/apps/`
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Token expiration notification sent:', info.response);
  } catch (error) {
    console.error('Failed to send token expiration notification:', error);
  }
}

// Run the check immediately
checkTokenValidity();

// Set up periodic check (uncomment to enable)
// setInterval(checkTokenValidity, CHECK_INTERVAL);

// Add this to package.json scripts for easy running:
// "monitor-token": "node token-monitor.js"

console.log(`
===============================================
💡 WhatsApp Token Management Tips:

1. Current token expires in 24 hours from generation
2. For production use, consider:
   - Creating a System User in Meta Business Manager
   - Generating a 60-day System User Access Token
   - Implementing automated token refresh

3. Run this script periodically with:
   node token-monitor.js

4. Add to your crontab to check automatically:
   0 */12 * * * cd /path/to/app && node token-monitor.js
===============================================
`); 