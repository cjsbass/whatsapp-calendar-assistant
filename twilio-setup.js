/**
 * Twilio WhatsApp Setup Guide
 * This script displays instructions for setting up Twilio WhatsApp with your app
 */
require('dotenv').config();

// Get the base URL from environment variables
const BASE_URL = process.env.BASE_URL || 'https://apt-reindeer-quickly.ngrok-free.app';
const NGROK_RUNNING = BASE_URL.includes('ngrok');

console.log("===============================================");
console.log("Twilio WhatsApp Setup Guide");
console.log("===============================================");
console.log("Follow these steps to complete your Twilio WhatsApp setup:");
console.log("");

// Step 1: Join the Twilio Sandbox
console.log("1. JOIN THE TWILIO SANDBOX");
console.log("   - Open WhatsApp on your phone");
console.log("   - Send 'join partly-tone' to +14155238886");
console.log("   - You should receive a confirmation message");
console.log("   - This connects your WhatsApp number to the Twilio Sandbox");
console.log("");

// Step 2: Configure the Twilio Webhook URL
console.log("2. CONFIGURE TWILIO WEBHOOK");
console.log("   - Log in to your Twilio account: https://www.twilio.com/console");
console.log("   - Navigate to Messaging → Try it out → Send a WhatsApp message");
console.log("   - Look for 'Sandbox Settings'");
console.log("   - Set the 'WHEN A MESSAGE COMES IN' field to:");
console.log(`     ${BASE_URL}/api/twilio`);
console.log("");

// Step 3: Keep ngrok running if applicable
if (NGROK_RUNNING) {
  console.log("3. KEEP NGROK RUNNING");
  console.log("   - Your app is using an ngrok tunnel at:");
  console.log(`     ${BASE_URL}`);
  console.log("   - Make sure to keep ngrok running for the webhook to work");
  console.log("   - If ngrok restarts, you'll need to update the webhook URL");
  console.log("");
}

// Step 4: Test the integration
console.log(`${NGROK_RUNNING ? '4' : '3'}. TEST THE INTEGRATION`);
console.log("   - Open WhatsApp on your phone");
console.log("   - Send a message to +14155238886");
console.log("   - Your bot should respond with a help message");
console.log("   - Send an image with event details to test full functionality");
console.log("");

console.log("===============================================");
console.log("TWILIO WHATSAPP SANDBOX LIMITATIONS:");
console.log("- In sandbox mode, users must join with the code first");
console.log("- Messages to non-joined users won't be delivered");
console.log("- Conversations expire after 72 hours of inactivity");
console.log("- For production, you'll need to request a production WhatsApp account");
console.log("  through Twilio and complete the WhatsApp Business verification process");
console.log("===============================================");

console.log("Your server is running at:");
console.log(BASE_URL);
console.log("Webhook URL for Twilio:");
console.log(`${BASE_URL}/api/twilio`);
console.log("===============================================");