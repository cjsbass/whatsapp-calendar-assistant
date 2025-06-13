/**
 * WhatsApp Test Message Script
 */
require('dotenv').config();
const axios = require('axios');

// WhatsApp API configuration from .env
const token = process.env.WHATSAPP_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

// The recipient's number should be the same as your WhatsApp Business number during testing
const recipientNumber = "15551508797";

console.log("===============================================");
console.log("WhatsApp Test Message");
console.log("===============================================");
console.log("Business Account ID:", wabaId);
console.log("Phone Number ID:", phoneNumberId);
console.log("Token (ending with):", token ? "..." + token.slice(-4) : "undefined");
console.log("Sending to:", recipientNumber);
console.log("===============================================");

async function sendTestMessage() {
  try {
    console.log("Sending test message...");
    
    const response = await axios({
      method: 'POST',
      url: `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipientNumber,
        type: 'text',
        text: {
          preview_url: false,
          body: "🎉 WhatsApp Calendar is now configured correctly! This is a test message."
        }
      }
    });
    
    console.log("✅ Message sent successfully!");
    console.log(response.data);
  } catch (error) {
    console.error("❌ Error sending message:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Error data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

// Send the test message
sendTestMessage();
