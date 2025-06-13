/**
 * Twilio WhatsApp Service
 * Handles sending messages via Twilio's WhatsApp API
 */
const twilio = require('twilio');
require('dotenv').config();

// Load environment variables
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || 'whatsapp:+14155238886'; // Default Twilio sandbox number

// Validate required environment variables
if (!TWILIO_ACCOUNT_SID) {
  console.error('❌ ERROR: TWILIO_ACCOUNT_SID is not defined in environment variables');
}

if (!TWILIO_AUTH_TOKEN) {
  console.error('❌ ERROR: TWILIO_AUTH_TOKEN is not defined in environment variables');
}

// Initialize Twilio client
const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

/**
 * Send a text message via Twilio WhatsApp
 * @param {string} to - Recipient phone number (without WhatsApp: prefix, we'll add it)
 * @param {string} text - Message text to send
 * @returns {Promise} - Twilio message response
 */
async function sendTextMessage(to, text) {
  try {
    // Clean and format the phone number properly
    let cleanTo = to.replace(/^whatsapp:/, '').replace(/^\+/, '').replace(/\s+/g, '');
    const formattedTo = `whatsapp:+${cleanTo}`;
    
    console.log(`📱 Sending WhatsApp message to ${formattedTo}`);
    
    const message = await client.messages.create({
      body: text,
      from: TWILIO_PHONE_NUMBER,
      to: formattedTo
    });
    
    console.log(`✅ Message sent successfully! SID: ${message.sid}`);
    return message;
  } catch (error) {
    console.error('❌ Error sending WhatsApp message via Twilio:', error.message);
    throw error;
  }
}

/**
 * Send a media message via Twilio WhatsApp
 * @param {string} to - Recipient phone number (without WhatsApp: prefix, we'll add it)
 * @param {string} mediaUrl - URL of the media to send
 * @param {string} caption - Optional caption for the media
 * @returns {Promise} - Twilio message response
 */
async function sendMediaMessage(to, mediaUrl, caption = '') {
  try {
    // Clean and format the phone number properly
    let cleanTo = to.replace(/^whatsapp:/, '').replace(/^\+/, '').replace(/\s+/g, '');
    const formattedTo = `whatsapp:+${cleanTo}`;
    
    console.log(`📱 Sending WhatsApp media message to ${formattedTo}`);
    
    const message = await client.messages.create({
      body: caption,
      from: TWILIO_PHONE_NUMBER,
      to: formattedTo,
      mediaUrl: [mediaUrl]
    });
    
    console.log(`✅ Media message sent successfully! SID: ${message.sid}`);
    return message;
  } catch (error) {
    console.error('❌ Error sending WhatsApp media message via Twilio:', error.message);
    throw error;
  }
}

module.exports = {
  sendTextMessage,
  sendMediaMessage
}; 