/**
 * Twilio WhatsApp Test Script
 * This script tests sending a WhatsApp message via Twilio
 */
require('dotenv').config();
const twilio = require('twilio');

// Twilio configuration from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || 'whatsapp:+14155238886';

// Recipient phone number (your WhatsApp number)
const userPhone = process.env.WHATSAPP_PHONE_NUMBER || '15551508797';
const formattedUserPhone = `whatsapp:+${userPhone.replace(/^\+/, '')}`;

// Create Twilio client
const client = twilio(accountSid, authToken);

console.log("===============================================");
console.log("Twilio WhatsApp Test");
console.log("===============================================");
console.log("Account SID:", accountSid);
console.log("From:", twilioPhoneNumber);
console.log("To:", formattedUserPhone);
console.log("===============================================");

async function sendTestMessage() {
  try {
    console.log("Sending test message...");
    
    const message = await client.messages.create({
      body: '🎉 Twilio WhatsApp Calendar is now configured correctly! This is a test message.',
      from: twilioPhoneNumber,
      to: formattedUserPhone
    });
    
    console.log("✅ Message sent successfully!");
    console.log("Message SID:", message.sid);
    console.log("Message status:", message.status);
    
    console.log("\n⚠️ IMPORTANT: If this is your first time using Twilio WhatsApp,");
    console.log("you need to join the Twilio Sandbox by sending the following code");
    console.log("to +14155238886 from your WhatsApp app:");
    console.log("\njoin partly-tone");
    console.log("\nOr use the join code provided by Twilio if it's different.");
  } catch (error) {
    console.error("❌ Error sending message:");
    console.error(error.message);
    
    if (error.code === 21608) {
      console.log("\n⚠️ It looks like you need to join the Twilio Sandbox first!");
      console.log("Send 'join partly-tone' to +14155238886 from your WhatsApp app.");
      console.log("Or check the specific code in your Twilio console.");
    }
  }
}

// Send the test message
sendTestMessage(); 