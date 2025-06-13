/**
 * WhatsApp Setup - Auto-configuration
 */
const fs = require('fs');

// This is the configuration we'll use - your existing token won't work
// IMPORTANT: Replace TOKEN_HERE with your new token that has WhatsApp Business permissions
const CONFIG = {
  wabaId: "416401061531062",                    // WhatsApp Business Account ID
  phoneNumberId: "PHONE_ID_HERE",         // This will be filled automatically by the script
  phoneNumber: "15551508797", // Your WhatsApp phone number without +
  token: "TOKEN_HERE",                    // Replace with your new token with WhatsApp permissions
  
  // Other settings - leave as is
  verifyToken: "d06bfb2ab638cd9c34ba1e9f2f11e66a",
  port: "3000",
  baseUrl: "https://apt-reindeer-quickly.ngrok-free.app",
  googleCredentials: "credentials/google-credentials.json",
  appSecret: "424d04665932011529ae67b9cf6d8bac"
};

// Create .env file content
const envContent = `# Server Config
# Auto-generated on ${new Date().toISOString()}

# Server settings
PORT=${CONFIG.port}
NODE_ENV="development"
BASE_URL="${CONFIG.baseUrl}"
APP_SECRET="${CONFIG.appSecret}"

# WhatsApp Business API settings
WHATSAPP_TOKEN="${CONFIG.token}"
WHATSAPP_PHONE_NUMBER_ID="${CONFIG.phoneNumberId}"
WHATSAPP_VERIFY_TOKEN="${CONFIG.verifyToken}"
WHATSAPP_BUSINESS_ACCOUNT_ID="${CONFIG.wabaId}"
WHATSAPP_PHONE_NUMBER="${CONFIG.phoneNumber}"

# Google Cloud API settings
GOOGLE_APPLICATION_CREDENTIALS="${CONFIG.googleCredentials}"
`;

// Update direct-fix.js file
function updateDirectFix() {
  try {
    const directFixPath = 'src/direct-fix.js';
    if (fs.existsSync(directFixPath)) {
      const directFixContent = fs.readFileSync(directFixPath, 'utf8');
      const updatedDirectFix = directFixContent.replace(
        /const realToken = "(.*?)";/,
        `const realToken = "${CONFIG.token}";`
      );
      
      fs.writeFileSync(directFixPath, updatedDirectFix);
      console.log('✅ Updated src/direct-fix.js with the token');
    } else {
      console.log('❌ src/direct-fix.js file not found');
    }
  } catch (error) {
    console.error('❌ Error updating direct-fix.js:', error.message);
  }
}

// Create a test script
function createTestScript() {
  const testScriptContent = `
/**
 * Simple WhatsApp Test Message Script
 */
require('dotenv').config();
const axios = require('axios');

// Use the values from environment
const token = process.env.WHATSAPP_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

// Your test phone number - YOU CAN CHANGE THIS
const testNumber = "${CONFIG.phoneNumber}"; // Using your own number

console.log("======================================");
console.log("WhatsApp Test Message");
console.log("======================================");
console.log("Business Account ID:", businessAccountId);
console.log("Phone Number ID:", phoneNumberId);
console.log("Using token ending with:", token ? "..." + token.slice(-4) : "undefined");
console.log("======================================");

async function sendTestMessage() {
  if (!testNumber) {
    console.log("❌ Please edit test-message.js and add your phone number first");
    return;
  }
  
  try {
    console.log(\`Sending test message to \${testNumber}...\`);
    
    const response = await axios({
      method: 'POST',
      url: \`https://graph.facebook.com/v18.0/\${phoneNumberId}/messages\`,
      headers: {
        'Authorization': \`Bearer \${token}\`,
        'Content-Type': 'application/json'
      },
      data: {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: testNumber,
        type: 'text',
        text: {
          preview_url: false,
          body: "🎉 Test message from WhatsApp Calendar fixed setup!"
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

// Run the test
sendTestMessage();
`;

  fs.writeFileSync('test-message.js', testScriptContent);
  console.log('✅ Created test-message.js script to verify your setup');
}

// Write the new .env file
try {
  fs.writeFileSync('.env', envContent);
  console.log('✅ Created new .env file with all required configurations');
  
  // Update the direct-fix.js file
  updateDirectFix();
  
  // Create test script
  createTestScript();
  
  console.log('\n✅ Configuration complete!');
  console.log('To test your setup, run:');
  console.log('node test-message.js');
  
  console.log('\nTo restart the server, run:');
  console.log('pkill -f "node src/index.js" && nohup npm start > server.log 2>&1 &');
} catch (error) {
  console.error('❌ Error creating configuration:', error.message);
}
